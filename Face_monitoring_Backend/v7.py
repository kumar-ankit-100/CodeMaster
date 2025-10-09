from fastapi import FastAPI, File, Form, UploadFile, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum
import cv2
import numpy as np
from deepface import DeepFace
import mediapipe as mp
import json
import random
import logging
import traceback
from datetime import datetime
from collections import deque
import hashlib
import uuid
import os

# ============ DATABASE IMPORTS ============
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anti_cheat_api")

# ============ DATABASE SETUP ============
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_5rqfJXnzxQ1K@ep-restless-morning-a1tkszbf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
)

logger.info(f"Connecting to database: {DATABASE_URL[:50]}...")

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============ DATABASE MODELS ============
class ExamSessionDB(Base):
    __tablename__ = "exam_sessions"
    
    session_id = Column(String(50), primary_key=True)
    user_id = Column(String(100), nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.now)
    last_activity = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    
    # Session state
    frame_count = Column(Integer, default=0)
    warnings_issued = Column(Integer, default=0)
    looking_away_count = Column(Integer, default=0)
    auth_failures = Column(Integer, default=0)
    
    # Detection data (stored as JSON)
    cheating_events = Column(Text, default="[]")
    detection_history = Column(Text, default="[]")
    
    # Reference data
    reference_image_hash = Column(String(255), nullable=True)
    baseline_established = Column(Boolean, default=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============ FASTAPI APP ============
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
MAX_SESSION_HISTORY = 30
MAX_IMAGE_DIMENSION = 480
VERIFICATION_FREQUENCY = 10
RANDOM_CHECK_PROBABILITY = 0.2
SMOOTHING_WINDOW = 5

# Global state (in-memory cache for current session)
user_sessions = {}
exam_sessions = {}
reference_images = {}

# MediaPipe setup
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh
face_detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
face_mesher = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ============ PYDANTIC MODELS ============
class SuspicionLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ExamSession(BaseModel):
    session_id: str
    user_id: str
    start_time: str
    reference_image_hash: Optional[str] = None

class CheatingIndicator(BaseModel):
    indicator_type: str
    confidence: float
    description: str

class FaceDetail(BaseModel):
    face_id: int
    bounding_box: Dict[str, int]
    confidence: float

class CheatingDetectionResult(BaseModel):
    session_id: str
    timestamp: str
    faces_detected: int
    multiple_faces: bool
    face_details: List[FaceDetail]
    suspicious_behaviors: List[str]
    cheating_indicators: List[CheatingIndicator]
    detected_objects: List[str]
    warnings: List[str]
    recommendations: List[str]
    suspicion_level: SuspicionLevel
    cheating_probability: float
    random_check: bool
    looking_away: bool
    gaze_metrics: Optional[Dict[str, Any]]
    attention_score: Optional[float]
    integrity_hash: str

# ============ DATABASE FUNCTIONS ============
def get_or_create_session_db(session_id: str, user_id: str, db: Session):
    """Get existing session from DB or create new one"""
    db_session = db.query(ExamSessionDB).filter(
        ExamSessionDB.session_id == session_id
    ).first()
    
    if not db_session:
        db_session = ExamSessionDB(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.now(),
            last_activity=datetime.now()
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        logger.info(f"Created new session in DB: {session_id}")
    
    return db_session

def save_frame_result(session_id: str, detection_result: dict, db: Session):
    """Save individual frame detection result to database"""
    try:
        db_session = db.query(ExamSessionDB).filter(
            ExamSessionDB.session_id == session_id
        ).first()
        
        if db_session:
            # Update frame count and last activity
            db_session.frame_count += 1
            db_session.last_activity = datetime.now()
            
            # Append to detection history (keep last 100)
            history = json.loads(db_session.detection_history)
            history.append(detection_result)
            if len(history) > 100:
                history = history[-100:]
            db_session.detection_history = json.dumps(history)
            
            # Update cheating events if suspicious
            if detection_result.get('suspicion_level') in ['high', 'critical']:
                events = json.loads(db_session.cheating_events)
                events.append({
                    'timestamp': detection_result['timestamp'],
                    'suspicion_level': detection_result['suspicion_level'],
                    'cheating_probability': detection_result['cheating_probability'],
                    'suspicious_behaviors': detection_result.get('suspicious_behaviors', [])
                })
                db_session.cheating_events = json.dumps(events)
            
            # Update looking away count
            if detection_result.get('looking_away'):
                db_session.looking_away_count += 1
            
            # Update warnings
            if len(detection_result.get('warnings', [])) > 0:
                db_session.warnings_issued += 1
            
            db.commit()
            logger.info(f"Saved frame result for session {session_id}")
    except Exception as e:
        logger.error(f"Error saving frame result: {str(e)}")
        db.rollback()

def load_session_from_db(session_id: str, db: Session) -> Optional[dict]:
    """Load session state from database"""
    try:
        db_session = db.query(ExamSessionDB).filter(
            ExamSessionDB.session_id == session_id
        ).first()
        
        if not db_session:
            return None
        
        return {
            'session_id': db_session.session_id,
            'user_id': db_session.user_id,
            'start_time': db_session.start_time.isoformat(),
            'last_activity': db_session.last_activity.isoformat(),
            'frame_count': db_session.frame_count,
            'warnings_issued': db_session.warnings_issued,
            'looking_away_count': db_session.looking_away_count,
            'auth_failures': db_session.auth_failures,
            'cheating_events': json.loads(db_session.cheating_events),
            'detection_history': json.loads(db_session.detection_history),
        }
    except Exception as e:
        logger.error(f"Error loading session from DB: {str(e)}")
        return None

def get_session_report(session_id: str, db: Session) -> Optional[dict]:
    """Get full session report for analysis"""
    try:
        db_session = db.query(ExamSessionDB).filter(
            ExamSessionDB.session_id == session_id
        ).first()
        
        if not db_session:
            return None
        
        cheating_events = json.loads(db_session.cheating_events)
        detection_history = json.loads(db_session.detection_history)
        
        duration = (db_session.last_activity - db_session.start_time).total_seconds()
        
        return {
            'session_summary': {
                'session_id': db_session.session_id,
                'user_id': db_session.user_id,
                'session_duration': duration,
                'total_frames': db_session.frame_count,
                'warnings_issued': db_session.warnings_issued,
                'looking_away_count': db_session.looking_away_count,
                'start_time': db_session.start_time.isoformat(),
                'last_activity': db_session.last_activity.isoformat(),
            },
            'cheating_events': cheating_events,
            'suspicious_behaviors': list(set(
                b for h in detection_history 
                for b in h.get('suspicious_behaviors', [])
            )),
            'average_suspicion': sum(
                h.get('cheating_probability', 0) 
                for h in detection_history
            ) / len(detection_history) if detection_history else 0,
            'total_cheating_events': len(cheating_events)
        }
    except Exception as e:
        logger.error(f"Error getting session report: {str(e)}")
        return None

# ============ HELPER FUNCTIONS ============
def generate_session_id():
    return str(uuid.uuid4()).upper()[:12]

def calculate_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def preprocess_image(image_data: bytes, max_dimension: int = MAX_IMAGE_DIMENSION):
    try:
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image")
            return None
        h, w = img.shape[:2]
        if max(h, w) > max_dimension:
            scale = max_dimension / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        img = cv2.imdecode(np.frombuffer(buffer, np.uint8), cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        logger.error(f"Error in preprocess_image: {str(e)}")
        return None

def verify_identity(reference_img, current_img):
    try:
        verification_result = DeepFace.verify(
            reference_img,
            current_img,
            enforce_detection=False,
            model_name="Facenet",
            distance_metric="cosine",
            detector_backend="opencv"
        )
        return verification_result
    except Exception as e:
        logger.error(f"Error in verify_identity: {str(e)}")
        return {"verified": False, "distance": 1.0, "threshold": 0.4}

def analyze_gaze(landmarks):
    left_eye = landmarks[33]
    right_eye = landmarks[263]
    left_horizontal = left_eye.x
    right_horizontal = right_eye.x
    left_vertical = left_eye.y
    right_vertical = right_eye.y
    gaze_metrics = {
        "left_horizontal": left_horizontal,
        "right_horizontal": right_horizontal,
        "left_vertical": left_vertical,
        "right_vertical": right_vertical,
        "is_left": left_horizontal < 0.4,
        "is_right": right_horizontal > 0.6,
        "is_up": left_vertical < 0.4 and right_vertical < 0.4,
        "is_down": left_vertical > 0.6 and right_vertical > 0.6
    }
    return gaze_metrics

def analyze_face_mesh(image_rgb):
    result = {
        "looking_away": False,
        "gaze_metrics": None,
        "attention_score": None,
    }
    try:
        mesh_results = face_mesher.process(image_rgb)
        if mesh_results.multi_face_landmarks:
            face_landmarks = mesh_results.multi_face_landmarks[0]
            gaze_metrics = analyze_gaze(face_landmarks.landmark)
            result["gaze_metrics"] = gaze_metrics
            result["looking_away"] = (
                gaze_metrics["is_left"] or
                gaze_metrics["is_right"] or
                (gaze_metrics["is_up"] and not gaze_metrics["is_down"])
            )
        return result
    except Exception as e:
        logger.error(f"Error in analyze_face_mesh: {str(e)}")
        return result

def analyze_frame_optimized(
    img,
    reference_img,
    user_id: str,
    session_id: str,
    session_history: deque,
    context_data: Dict[str, Any],
    random_check: bool,
    frame_count: int
):
    result = CheatingDetectionResult(
        session_id=session_id,
        timestamp=datetime.now().isoformat(),
        faces_detected=0,
        multiple_faces=False,
        face_details=[],
        suspicious_behaviors=[],
        cheating_indicators=[],
        detected_objects=[],
        warnings=[],
        recommendations=[],
        suspicion_level=SuspicionLevel.NONE,
        cheating_probability=0.0,
        random_check=random_check,
        looking_away=False,
        gaze_metrics=None,
        attention_score=None,
        integrity_hash=""
    )

    try:
        detection_results = face_detector.process(img)
        if detection_results.detections:
            result.faces_detected = len(detection_results.detections)
            result.multiple_faces = result.faces_detected > 1
            for i, detection in enumerate(detection_results.detections):
                bbox = detection.location_data.relative_bounding_box
                h, w = img.shape[:2]
                result.face_details.append(FaceDetail(
                    face_id=i,
                    bounding_box={
                        "x": int(bbox.xmin * w),
                        "y": int(bbox.ymin * h),
                        "width": int(bbox.width * w),
                        "height": int(bbox.height * h)
                    },
                    confidence=detection.score[0]
                ))

            if result.multiple_faces:
                result.suspicious_behaviors.append("multiple_faces_detected")
                result.cheating_indicators.append(CheatingIndicator(
                    indicator_type="multiple_faces",
                    confidence=0.9,
                    description="Multiple faces detected in frame"
                ))
                result.warnings.append("Only one candidate should be visible")
                result.suspicion_level = SuspicionLevel.CRITICAL
                result.cheating_probability = 0.9

        should_verify = reference_img is not None and (
            random_check or (frame_count % VERIFICATION_FREQUENCY == 0)
        )
        if should_verify:
            verification_result = verify_identity(reference_img, img)
            if not verification_result["verified"]:
                result.suspicious_behaviors.append("identity_mismatch")
                result.cheating_indicators.append(CheatingIndicator(
                    indicator_type="identity_mismatch",
                    confidence=verification_result["distance"],
                    description="Face does not match reference image"
                ))
                result.warnings.append("Identity verification failed")
                result.suspicion_level = SuspicionLevel.CRITICAL
                result.cheating_probability = min(verification_result["distance"], 0.9)

        face_mesh_result = analyze_face_mesh(img)
        if face_mesh_result["gaze_metrics"]:
            result.gaze_metrics = face_mesh_result["gaze_metrics"]
            if face_mesh_result["looking_away"]:
                result.suspicious_behaviors.append("looking_away")
                result.cheating_indicators.append(CheatingIndicator(
                    indicator_type="looking_away",
                    confidence=0.85,
                    description="Candidate looking away from screen"
                ))
                result.warnings.append("Please keep your eyes on the screen")
                result.suspicion_level = SuspicionLevel.CRITICAL
                result.cheating_probability = max(result.cheating_probability, 0.85)

        if result.suspicion_level == SuspicionLevel.NONE:
            result.suspicion_level = SuspicionLevel.LOW
            result.cheating_probability = 0.0

        return result
    except Exception as e:
        logger.error(f"Error in analyze_frame_optimized: {str(e)}")
        return result

# ============ ROUTES ============
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Advanced Exam Anti-Cheating API with Neon PostgreSQL")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/register-face/")
async def register_face(
    user_id: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        contents = await image.read()
        img_hash = calculate_hash(contents)
        reference_images[user_id] = contents
        
        for session_id, session in user_sessions.items():
            if session["user_id"] == user_id:
                img = preprocess_image(contents)
                if img is not None:
                    session["reference_image"] = img
                session["auth_failures"] = 0
        
        logger.info(f"Reference face registered for user {user_id}")
        return {
            "status": "success",
            "user_id": user_id,
            "image_hash": img_hash
        }
    except Exception as e:
        logger.error(f"Error in register_face: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/start-exam-session/")
async def start_exam_session(
    user_id: str = Form(...),
    reference_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        session_id = generate_session_id()
        
        # Create in database
        db_session = get_or_create_session_db(session_id, user_id, db)
        
        # Create in memory
        user_sessions[session_id] = {
            "user_id": user_id,
            "history": deque(maxlen=MAX_SESSION_HISTORY),
            "start_time": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "cheating_events": [],
            "warnings_issued": 0,
            "baseline_established": False,
            "baseline_face_position": None,
            "baseline_head_pose": None,
            "reference_image": None,
            "auth_failures": 0,
            "frame_count": 0,
            "left_pos_history": [],
            "right_pos_history": [],
            "looking_away_count": 0,
            "last_verification_frame": 0,
        }
        
        exam_sessions[session_id] = ExamSession(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.now().isoformat()
        )
        
        if reference_image:
            contents = await reference_image.read()
            img_hash = calculate_hash(contents)
            db_session.reference_image_hash = img_hash
            user_sessions[session_id]["reference_image_hash"] = img_hash
            
            img = preprocess_image(contents)
            if img is not None:
                user_sessions[session_id]["reference_image"] = img
            
            db.commit()
        
        logger.info(f"Started new exam session {session_id} for user {user_id}")
        return {
            "status": "success",
            "session_id": session_id,
            "start_time": user_sessions[session_id]["start_time"],
            "message": f"Exam session started for {user_id}"
        }
    except Exception as e:
        logger.error(f"Error in start_exam_session: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/detect-cheating/")
async def detect_cheating(
    frame: UploadFile = File(...),
    session_id: str = Form(...),
    timestamp: Optional[str] = Form(None),
    additional_data: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Received detect-cheating request with session_id: {session_id}")
        
        # Check database first
        if session_id not in user_sessions:
            db_session_data = load_session_from_db(session_id, db)
            if not db_session_data:
                logger.error(f"Session ID {session_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invalid session ID. Please start a new exam session."
                )
            
            # Reconstruct session in memory from database
            user_sessions[session_id] = {
                "user_id": db_session_data['user_id'],
                "history": deque(maxlen=MAX_SESSION_HISTORY),
                "start_time": db_session_data['start_time'],
                "last_activity": db_session_data['last_activity'],
                "cheating_events": db_session_data['cheating_events'],
                "warnings_issued": db_session_data['warnings_issued'],
                "baseline_established": False,
                "baseline_face_position": None,
                "baseline_head_pose": None,
                "reference_image": None,
                "auth_failures": db_session_data['auth_failures'],
                "frame_count": db_session_data['frame_count'],
                "left_pos_history": [],
                "right_pos_history": [],
                "looking_away_count": db_session_data['looking_away_count'],
                "last_verification_frame": 0,
            }
            logger.info(f"Reconstructed session {session_id} from database")

        session = user_sessions[session_id]
        user_id = session["user_id"]
        
        session["last_activity"] = datetime.now().isoformat()
        session["frame_count"] += 1

        contents = await frame.read()
        logger.info(f"Frame size: {len(contents)} bytes")
        frame_hash = calculate_hash(contents)

        img = preprocess_image(contents)
        if img is None:
            logger.error("Invalid image format in preprocess_image")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image format")

        reference_img = session.get("reference_image")
        logger.info(f"Reference image available: {reference_img is not None}")

        context_data = {}
        if additional_data:
            try:
                context_data = json.loads(additional_data)
                logger.info(f"Context data: {context_data}")
            except json.JSONDecodeError:
                logger.warning(f"Invalid additional data format for session {session_id}")

        random_check = random.random() < RANDOM_CHECK_PROBABILITY
        logger.info(f"Random check: {random_check}")

        result = analyze_frame_optimized(
            img,
            reference_img,
            user_id,
            session_id,
            session_history=session["history"],
            context_data=context_data,
            random_check=random_check,
            frame_count=session["frame_count"]
        )

        result.integrity_hash = frame_hash

        if result.gaze_metrics:
            if "left_horizontal" in result.gaze_metrics:
                session["left_pos_history"].append(result.gaze_metrics["left_horizontal"])
                while len(session["left_pos_history"]) > SMOOTHING_WINDOW:
                    session["left_pos_history"].pop(0)
            if "right_horizontal" in result.gaze_metrics:
                session["right_pos_history"].append(result.gaze_metrics["right_horizontal"])
                while len(session["right_pos_history"]) > SMOOTHING_WINDOW:
                    session["right_pos_history"].pop(0)
            if result.looking_away:
                session["looking_away_count"] += 1

        clean_result = json.loads(json.dumps(result.dict(), default=str))
        session["history"].append(clean_result)

        if clean_result["suspicion_level"] in [SuspicionLevel.HIGH, SuspicionLevel.CRITICAL]:
            session["cheating_events"].append({
                "timestamp": clean_result["timestamp"],
                "suspicion_level": clean_result["suspicion_level"],
                "cheating_probability": clean_result["cheating_probability"],
                "suspicious_behaviors": clean_result["suspicious_behaviors"]
            })
            if len(clean_result["suspicious_behaviors"]) > 0:
                session["warnings_issued"] += 1

        # Save to database
        save_frame_result(session_id, clean_result, db)
        
        logger.info(f"Successfully processed detect-cheating for session {session_id}")
        return clean_result
        
    except HTTPException as e:
        logger.error(f"HTTPException in detect-cheating: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in detect-cheating: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )

@app.get("/get-session-report/{session_id}")
async def get_session_report_endpoint(session_id: str, db: Session = Depends(get_db)):
    """Get full session report"""
    report = get_session_report(session_id, db)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return report

@app.get("/get_behavior_data")
async def get_behavior_data(session_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Get behavior data for all sessions or specific session"""
    try:
        if session_id:
            report = get_session_report(session_id, db)
            if not report:
                return {"error": "Session not found"}
            return report
        
        # Return data for all sessions (limit to last 10)
        all_sessions = db.query(ExamSessionDB).order_by(
            ExamSessionDB.last_activity.desc()
        ).limit(10).all()
        
        return {
            "sessions": [get_session_report(s.session_id, db) for s in all_sessions]
        }
    except Exception as e:
        logger.error(f"Error in get_behavior_data: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("v7:app", host="0.0.0.0", port=port, reload=False)

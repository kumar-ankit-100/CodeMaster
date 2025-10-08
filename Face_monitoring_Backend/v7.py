import base64
import threading

import cv2
import numpy as np
import time
from datetime import datetime
import os
import hashlib
import json
from typing import List, Dict, Any, Optional, Tuple, Union
import io
import mediapipe as mp
from deepface import DeepFace
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, Depends, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
import uvicorn
from enum import Enum
import logging
import random
import string
from collections import deque
from fastapi import Form
import httpx
import queue
import concurrent.futures
from functools import lru_cache

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("anti_cheat.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("anti_cheat_api")

# Initialize FastAPI app
app = FastAPI(
    title="Advanced Exam Anti-Cheating API",
    description="Comprehensive backend system for detecting cheating behavior during online exams",
    version="2.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe solutions - create once globally
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Pre-initialize models for reuse - this avoids loading them for each request
face_detector = mp_face_detection.FaceDetection(min_detection_confidence=0.5, model_selection=1)
face_mesher = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Configuration constants
FACE_DETECTION_CONFIDENCE = 0.5
TRACKING_CONFIDENCE = 0.5
EYE_CENTER_THRESHOLD = 0.45
ALERT_DURATION = 30
FONT_SCALE = 0.7
FONT_THICKNESS = 2
MAX_IMAGE_DIMENSION = 640  # Maximum dimension for processing
VERIFICATION_FREQUENCY = 5  # Run face verification every X frames
SMOOTHING_WINDOW = 5
MAX_SESSION_HISTORY = 30
SUSPICIOUS_OBJECT_CONFIDENCE = 0.65
RANDOM_CHECK_PROBABILITY = 0.05

# Session cache
user_sessions = {}
reference_embeddings = {}  # Cache for face embeddings
verification_cache = {}  # Cache verification results


# Define models
class SuspicionLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CheatingIndicator(BaseModel):
    indicator_type: str
    confidence: float
    description: str


class FaceDetail(BaseModel):
    face_id: int
    bounding_box: Dict[str, int]
    confidence: float
    emotion: Optional[str] = None
    verified: Optional[bool] = None
    verification_score: Optional[float] = None
    verification_threshold: Optional[float] = None
    gaze_info: Optional[Dict[str, float]] = None
    head_pose: Optional[Dict[str, float]] = None
    mouth_movement: Optional[float] = None


class DetectedObject(BaseModel):
    object_type: str
    confidence: float
    bounding_box: Dict[str, int]


class CheatingDetectionResult(BaseModel):
    session_id: str
    timestamp: str
    faces_detected: int
    multiple_faces: bool
    face_details: List[FaceDetail]
    is_same_person: Optional[bool] = None
    looking_away: Optional[bool] = None
    speaking: Optional[bool] = None
    emotion: Optional[str] = None
    detected_objects: List[DetectedObject] = Field(default_factory=list)
    suspicious_behaviors: List[str] = Field(default_factory=list)
    cheating_indicators: List[CheatingIndicator] = Field(default_factory=list)
    suspicion_level: SuspicionLevel = SuspicionLevel.LOW
    cheating_probability: float = 0.0
    random_check: bool = False
    integrity_hash: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class UserRegistration(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None


class ExamSession(BaseModel):
    session_id: str
    user_id: str
    exam_id: Optional[str] = None
    start_time: str
    active: bool = True
    reference_image_hash: Optional[str] = None



class BehaviorData(BaseModel):
    timestamp: str
    currentFocused: int
    gazeDeviationPercent: int
    attentionScore: Optional[int] = 100
    suspicionLevel: Optional[str] = "LOW"
    cheatProbability: Optional[int] = 0

# Session management
exam_sessions = {}
reference_images = {}  # In production, store securely


def preprocess_image(image_data, max_dimension=MAX_IMAGE_DIMENSION):
    """Preprocess and resize image for faster processing"""
    # Decode image
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return None

    # Resize image while maintaining aspect ratio
    h, w = img.shape[:2]
    if max(h, w) > max_dimension:
        scale = max_dimension / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h))

    return img


def calculate_hash(data):
    """Calculate SHA-256 hash of data"""
    return hashlib.sha256(data).hexdigest()


def generate_session_id():
    """Generate a random session ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))


def init_user_session(user_id: str, session_id: str = None):
    """Initialize or reset a user session"""
    if session_id is None:
        session_id = generate_session_id()
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
        "frame_count": 0,  # Track processed frames
        "left_pos_history": [],  # For eye tracking
        "right_pos_history": [],  # For eye tracking
        "looking_away_count": 0,  # Count looking away frames
        "last_verification_frame": 0,  # Track when we last verified identity
    }
    exam_sessions[session_id] = ExamSession(
        session_id=session_id,
        user_id=user_id,
        start_time=datetime.now().isoformat()
    )
    return session_id


attention_history = deque(maxlen=30)
attention_score = 100


def get_average_position(position_history):
    """Calculate average of position history with outlier rejection"""
    if not position_history or len(position_history) == 0:
        return 0.5

    # Simple average with basic outlier rejection
    values = list(position_history)
    if len(values) >= 3:
        # Remove max and min to reduce outliers
        values.remove(max(values))
        values.remove(min(values))

    return sum(values) / len(values) if values else 0.5


def analyze_gaze(landmarks):
    """
    Optimized gaze detection based on iris position relative to eye corners
    Returns gaze direction and confidence score
    """
    # Essential landmarks for gaze detection
    try:
        # Get iris landmarks
        left_iris = landmarks[468]
        right_iris = landmarks[473]

        # Get eye landmarks (corners and boundaries)
        # Left eye
        left_eye_outer = landmarks[33]  # Left eye outer corner
        left_eye_inner = landmarks[133]  # Left eye inner corner
        left_eye_top = landmarks[159]  # Left eye top boundary
        left_eye_bottom = landmarks[145]  # Left eye bottom boundary

        # Right eye
        right_eye_inner = landmarks[362]  # Right eye inner corner
        right_eye_outer = landmarks[263]  # Right eye outer corner
        right_eye_top = landmarks[386]  # Right eye top boundary
        right_eye_bottom = landmarks[374]  # Right eye bottom boundary

        # Calculate horizontal position ratios
        # For left eye: 0 = outer corner, 1 = inner corner
        left_eye_width = max(0.001, left_eye_inner.x - left_eye_outer.x)  # Avoid division by zero
        left_pos = (left_iris.x - left_eye_outer.x) / left_eye_width

        # For right eye: 0 = inner corner, 1 = outer corner
        right_eye_width = max(0.001, right_eye_outer.x - right_eye_inner.x)  # Avoid division by zero
        right_pos = (right_iris.x - right_eye_inner.x) / right_eye_width

        # Calculate vertical position - for improved accuracy
        # Left eye vertical ratio: 0 = top, 1 = bottom
        left_eye_height = max(0.001, left_eye_bottom.y - left_eye_top.y)  # Avoid division by zero
        left_vert = (left_iris.y - left_eye_top.y) / left_eye_height

        # Right eye vertical ratio: 0 = top, 1 = bottom
        right_eye_height = max(0.001, right_eye_bottom.y - right_eye_top.y)  # Avoid division by zero
        right_vert = (right_iris.y - right_eye_top.y) / right_eye_height

        # Return gaze metrics
        return {
            "left_horizontal": float(left_pos),  # Convert from numpy if needed
            "right_horizontal": float(right_pos),
            "left_vertical": float(left_vert),
            "right_vertical": float(right_vert),
            "is_left": left_pos < EYE_CENTER_THRESHOLD and right_pos < EYE_CENTER_THRESHOLD,
            "is_right": left_pos > (1 - EYE_CENTER_THRESHOLD) and right_pos > (1 - EYE_CENTER_THRESHOLD),
            "is_up": left_vert < 0.35 and right_vert < 0.35,
            "is_down": left_vert > 0.65 and right_vert > 0.65
        }
    except (IndexError, AttributeError) as e:
        # Return default values if landmarks are incomplete
        logger.warning(f"Gaze analysis error: {str(e)}")
        return {
            "left_horizontal": 0.5,
            "right_horizontal": 0.5,
            "left_vertical": 0.5,
            "right_vertical": 0.5,
            "is_left": False,
            "is_right": False,
            "is_up": False,
            "is_down": False
        }


def detect_faces(image_rgb, image_shape):
    """Detect faces in image and return face details"""
    frame_height, frame_width = image_shape
    result = {
        "faces_detected": 0,
        "multiple_faces": False,
        "face_details": []
    }

    # Process with MediaPipe face detection
    detection_results = face_detector.process(image_rgb)

    if detection_results.detections:
        result["faces_detected"] = len(detection_results.detections)
        result["multiple_faces"] = result["faces_detected"] > 1

        # Process each detected face
        for i, detection in enumerate(detection_results.detections):
            # Extract bounding box
            bounding_box = detection.location_data.relative_bounding_box
            x = max(0, int(bounding_box.xmin * frame_width))
            y = max(0, int(bounding_box.ymin * frame_height))
            w = min(int(bounding_box.width * frame_width), frame_width - x)
            h = min(int(bounding_box.height * frame_height), frame_height - y)

            # Create face detail
            face_info = {
                "face_id": i,
                "bounding_box": {"x": x, "y": y, "width": w, "height": h},
                "confidence": float(detection.score[0])
            }
            result["face_details"].append(face_info)

    return result


def verify_identity(reference_img, current_img, session_id=None, user_id=None):
    """
    Optimized identity verification with caching
    This runs less frequently for better performance
    """
    result = {"is_same_person": None}

    try:
        # Generate verification cache key
        current_time = time.time()
        cache_key = f"{user_id}_{current_time // 60}"  # Cache per minute

        # Try to use cached result first
        if session_id in verification_cache and cache_key in verification_cache[session_id]:
            return verification_cache[session_id][cache_key]

        # Fall back to DeepFace verification
        verification_result = DeepFace.verify(
            reference_img,
            current_img,
            enforce_detection=False,
            model_name="VGG-Face",  # or try "Facenet" which is faster
            distance_metric="cosine",
            detector_backend="opencv"  # Fastest detector, though less accurate
        )

        # Extract results
        if isinstance(verification_result, dict):
            verified = verification_result.get("verified", False)
            if isinstance(verified, np.generic):
                is_same_person = bool(verified.item())
            else:
                is_same_person = bool(verified)

            result = {
                "is_same_person": is_same_person,
                "verification_score": float(verification_result.get("distance", 0)),
                "verification_threshold": float(verification_result.get("threshold", 0))
            }

            # Cache the result
            if session_id is not None:
                if session_id not in verification_cache:
                    verification_cache[session_id] = {}
                verification_cache[session_id][cache_key] = result

    except Exception as e:
        logger.warning(f"Face verification error: {str(e)}")
        result["verification_error"] = str(e)

    return result


def analyze_face_mesh(image_rgb):
    """Extract face mesh and analyze gaze direction"""
    result = {
        "looking_away": False,
        "gaze_metrics": None,
        "attention_score":None,
    }

    # Process with MediaPipe face mesh
    mesh_results = face_mesher.process(image_rgb)

    # Analyze mesh for gaze if landmarks available
    if mesh_results.multi_face_landmarks:
        face_landmarks = mesh_results.multi_face_landmarks[0]
        gaze_metrics = analyze_gaze(face_landmarks.landmark)
        result["gaze_metrics"] = gaze_metrics

        # Determine if looking away based on multiple factors
        print(f"gaze value is : { gaze_metrics }")
        looking_away = (
                gaze_metrics["is_left"] or
                gaze_metrics["is_right"] or
                (gaze_metrics["is_up"] and not gaze_metrics["is_down"])  # Looking up but not down
        )
        result["looking_away"] = looking_away
        # is_attentive = not looking_away
        # attention_history.append(1 if is_attentive else 0)
        # if attention_history:
        #     attention_score = int(sum(attention_history) / len(attention_history) * 100)
        #     result["attention_score"] = attention_score

    return result
behavior_logs = []

class BehaviorTrackingService:
    def __init__(self):
        self.queue = queue.Queue()
        self._start_worker()

    def _start_worker(self):
        worker = threading.Thread(target=self._process_queue, daemon=True)
        worker.start()

    def _process_queue(self):
        while True:
            try:
                print('lllllllllllllllllllllllllllllllllllllllllllll')
                data = self.queue.get()
                """
                    Submit behavioral data from a coding interview session
                    """
                try:
                    # Convert to dict and store in memory
                    behavior_logs.append(data)
                    print(f"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Error recording behavior: {str(e)}")
                self.queue.task_done()
            except Exception as e:
                print(f"Error submitting behavior: {e}")
            time.sleep(0.01)

    def track(self, behavioral_data):
        self.queue.put(behavioral_data)


# Create a global instance
behavior_service = BehaviorTrackingService()



def calculate_suspicion(result):
    """Calculate suspicion level and add warnings/recommendations"""
    # Add suspicious behaviors based on detections
    if result["multiple_faces"]:
        result["suspicious_behaviors"].append("multiple_faces")
        result["cheating_indicators"].append({
            "indicator_type": "multiple_faces",
            "confidence": 0.9,
            "description": f"Detected {result['faces_detected']} faces in frame"
        })
        result["warnings"].append(f"Multiple faces detected ({result['faces_detected']})")
        result["recommendations"].append("Ensure you are alone during the exam")

    if result.get("faces_detected", 0) == 0:
        result["suspicious_behaviors"].append("absence")
        result["cheating_indicators"].append({
            "indicator_type": "absence",
            "confidence": 0.8,
            "description": "No face detected in frame"
        })
        result["warnings"].append("No face detected - please ensure you are visible")
        result["recommendations"].append("Adjust your camera or lighting to ensure your face is visible")

    if result.get("is_same_person") is False:
        result["suspicious_behaviors"].append("different_person")
        result["cheating_indicators"].append({
            "indicator_type": "different_person",
            "confidence": 0.95,
            "description": "Face identity does not match reference image"
        })
        result["warnings"].append("Identity verification failed")
        result["recommendations"].append("Please ensure you are the registered exam taker")

    if result.get("looking_away", False):
        result["suspicious_behaviors"].append("looking_away")
        result["cheating_indicators"].append({
            "indicator_type": "looking_away",
            "confidence": 0.85,
            "description": "Candidate looking away from screen"
        })
        result["warnings"].append("Please keep your eyes on the screen")

    # Calculate weighted cheating probability
    if result["cheating_indicators"]:
        weighted_sum = sum(indicator["confidence"] for indicator in result["cheating_indicators"])
        result["cheating_probability"] = min(0.99, round(weighted_sum / len(result["cheating_indicators"]), 2))

        # Determine suspicion level
        if result["cheating_probability"] >= 0.85:
            result["suspicion_level"] = SuspicionLevel.CRITICAL
        elif result["cheating_probability"] >= 0.7:
            result["suspicion_level"] = SuspicionLevel.HIGH
        elif result["cheating_probability"] >= 0.5:
            result["suspicion_level"] = SuspicionLevel.MEDIUM
        else:
            result["suspicion_level"] = SuspicionLevel.LOW

    # Submit behavioral data to the behavioral monitoring system
    try:
        # Calculate attention score based on multiple factors
        nattention_score = 100

        # Reduce score for looking away
        if result.get("looking_away", False):
            nattention_score -= 30

        # Reduce score based on suspicion level
        if result["suspicion_level"] == SuspicionLevel.MEDIUM:
            nattention_score -= 20
        elif result["suspicion_level"] == SuspicionLevel.HIGH:
            nattention_score -= 40
        elif result["suspicion_level"] == SuspicionLevel.CRITICAL:
            nattention_score -= 70

        # Calculate gaze stability - lower value means more stable gaze
        gaze_metrics = result.get("gaze_metrics", {})
        gaze_deviation = 0
        if gaze_metrics:
            horizontal_deviation = abs(0.5 - gaze_metrics.get("left_horizontal", 0.5)) * 100
            vertical_deviation = abs(0.5 - gaze_metrics.get("left_vertical", 0.5)) * 100
            gaze_deviation = int((horizontal_deviation + vertical_deviation) / 2)
        timestamp = datetime.now().isoformat()
        behavioral_data = {
            "timestamp": timestamp,
            "currentFocused": result.get("looking_away", False) if 0 else 1,
            "gazeDeviationPercent": gaze_deviation,
            "attentionScore": max(0, min(100, attention_score)),
            "suspicionLevel": result["suspicion_level"],
            "cheatProbability": int(result["cheating_probability"] * 100)
        }

        # Asynchronously submit the behavioral data
        behavior_service.track(behavioral_data)
    except Exception as e:
        logger.warning(f"Failed to submit behavioral data: {str(e)}")

    return result



@app.get("/get_behavior_data")
async def get_behavior_data():
    """
    Retrieve all behavioral data logs
    """
    try:
        return {
            "status": "success",
            "data": behavior_logs,
            "count": len(behavior_logs),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving behavior data: {str(e)}")

def analyze_frame_optimized(
        frame,
        reference_img=None,
        user_id=None,
        session_id=None,
        session_history=None,
        context_data=None,
        random_check=False,
        frame_count=0
):
    """Optimized frame analysis with selective processing"""
    # Get current timestamp
    timestamp = datetime.now().isoformat()

    # Initialize result structure
    result = {
        "session_id": session_id,
        "timestamp": timestamp,
        "faces_detected": 0,
        "multiple_faces": False,
        "face_details": [],
        "suspicious_behaviors": [],
        "cheating_indicators": [],
        "detected_objects": [],
        "warnings": [],
        "recommendations": [],
        "suspicion_level": SuspicionLevel.LOW,
        "cheating_probability": 0.0,
        "random_check": random_check
    }

    # If this is a random check, add a note
    if random_check:
        result["warnings"].append("Random integrity check initiated")

    # Convert to RGB for MediaPipe (do once)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_dimensions = frame.shape[:2]

    # Run face detection (always needed)
    detection_result = detect_faces(frame_rgb, frame_dimensions)
    result.update(detection_result)

    # Only run more intensive processing if faces are detected
    if result["faces_detected"] > 0:
        # Run face mesh analysis for gaze tracking
        mesh_result = analyze_face_mesh(frame_rgb)
        result.update(mesh_result)

        # Only run face verification occasionally to save processing time
        # Either on random checks or every VERIFICATION_FREQUENCY frames
        should_verify = (
                random_check or
                reference_img is not None and
                (frame_count % VERIFICATION_FREQUENCY == 0)
        )

        if should_verify and reference_img is not None:
            verification_result = verify_identity(
                reference_img, frame,
                session_id=session_id,
                user_id=user_id
            )
            result.update(verification_result)

    # Update context-aware analysis
    if context_data:
        # Check if context indicates the user should be writing/typing
        if "should_be_writing" in context_data and context_data["should_be_writing"]:
            # Check if user is not interacting with input when they should be
            if "writing" in context_data and not context_data["writing"]:
                # Only flag if we've seen the user consistently not typing
                if session_history and len(session_history) >= 3:
                    last_three = list(session_history)[-3:]
                    if all(("context_data" in s and
                            "writing" in s.get("context_data", {}) and
                            not s["context_data"]["writing"]) for s in last_three):
                        result["suspicious_behaviors"].append("writing_without_exam")
                        result["cheating_indicators"].append({
                            "indicator_type": "inactive_during_exam",
                            "confidence": 0.5,
                            "description": "User not actively engaging with exam"
                        })

    # Calculate final suspicion level
    result = calculate_suspicion(result)

    return result


@app.post("/start-exam-session/")
async def start_exam_session(
        user_id: str = Form(...),
        reference_image: Optional[UploadFile] = File(None)
):
    """Start a new exam session for a user"""
    session_id = generate_session_id()
    logger.info(f"Started new exam session {session_id} for user {user_id}")

    # Initialize user session
    init_user_session(user_id, session_id)

    # Process reference image if provided
    if reference_image:
        contents = await reference_image.read()
        # Store reference image
        reference_images[user_id] = contents
        img_hash = calculate_hash(contents)
        exam_sessions[session_id].reference_image_hash = img_hash

        # Process and store optimized reference image
        img = preprocess_image(contents)
        if img is not None:
            user_sessions[session_id]["reference_image"] = img

    logger.info(f"Started new exam session {session_id} for user {user_id}")
    return {
        "status": "success",
        "session_id": session_id,
        "start_time": user_sessions[session_id]["start_time"],
        "message": f"Exam session started for {user_id}"
    }




@app.post("/detect-cheating/")
async def detect_cheating(
        frame: UploadFile = File(...),
        session_id: str = Form(...),
        timestamp: Optional[str] = Form(None),
        additional_data: Optional[str] = Form(None)
):
    """
    Process a single webcam frame to detect potential cheating behaviors.
    Optimized for better performance and accuracy.
    """
    try:
        # Validate session
        if session_id not in user_sessions:
            raise HTTPException(status_code=404, detail="Invalid session ID. Please start a new exam session.")

        session = user_sessions[session_id]
        user_id = session["user_id"]

        # Update session last activity
        session["last_activity"] = datetime.now().isoformat()
        session["frame_count"] += 1

        # Process the uploaded frame - optimize by resizing first
        contents = await frame.read()
        frame_hash = calculate_hash(contents)

        # Preprocess image - resize for faster processing
        img = preprocess_image(contents)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Get reference image from session
        reference_img = session.get("reference_image")

        # Process additional data if provided
        context_data = {}
        if additional_data:
            try:
                context_data = json.loads(additional_data)
            except json.JSONDecodeError:
                logger.warning(f"Invalid additional data format for session {session_id}")

        # Determine if this should be a random integrity check
        random_check = random.random() < RANDOM_CHECK_PROBABILITY

        # Analyze frame with optimized processing
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

        # Add integrity hash
        result["integrity_hash"] = frame_hash

        # Update gaze tracking history
        if result.get("gaze_metrics"):
            # Store left and right eye positions
            if "left_horizontal" in result["gaze_metrics"]:
                session["left_pos_history"].append(result["gaze_metrics"]["left_horizontal"])
                while len(session["left_pos_history"]) > SMOOTHING_WINDOW:
                    session["left_pos_history"].pop(0)

            if "right_horizontal" in result["gaze_metrics"]:
                session["right_pos_history"].append(result["gaze_metrics"]["right_horizontal"])
                while len(session["right_pos_history"]) > SMOOTHING_WINDOW:
                    session["right_pos_history"].pop(0)

            # Track looking away behavior
            if result.get("looking_away", False):
                session["looking_away_count"] += 1

        # Convert result to a clean dict to fix serialization issues
        clean_result = json.loads(json.dumps(result, default=lambda o: str(o) if isinstance(o, np.generic) else o.__dict__ if hasattr(o, '__dict__') else str(o)))

        # Store result in session history
        session["history"].append(clean_result)

        # If high suspicion, add to cheating events
        if clean_result["suspicion_level"] in [SuspicionLevel.HIGH, SuspicionLevel.CRITICAL]:
            session["cheating_events"].append({
                "timestamp": clean_result["timestamp"],
                "suspicion_level": clean_result["suspicion_level"],
                "cheating_probability": clean_result["cheating_probability"],
                "suspicious_behaviors": clean_result["suspicious_behaviors"]
            })
            # Increment warnings if high suspicion
            if len(clean_result["suspicious_behaviors"]) > 0:
                session["warnings_issued"] += 1

        return clean_result
    except Exception as e:
        logger.error(f"Error in detect-cheating: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/register-face/")
async def register_face(
        image: UploadFile = File(...),
        user_id: str = Form(...)
):
    """
    Register a reference face for a user.
    Optimized to pre-process and store the image efficiently.
    """
    try:
        # Read and process the uploaded image
        contents = await image.read()
        img = preprocess_image(contents)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Validate image has a face
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detector.process(img_rgb)

        if not results.detections:
            raise HTTPException(status_code=400, detail="No face detected in the reference image")

        if len(results.detections) > 1:
            raise HTTPException(status_code=400,
                                detail="Multiple faces detected. Please provide an image with only one face")

        # Calculate a hash for integrity
        img_hash = calculate_hash(contents)

        # Store the reference image optimally
        reference_images[user_id] = contents  # Store original for verification

        # For active sessions, update reference image
        for session_id, session in user_sessions.items():
            if session["user_id"] == user_id:
                session["reference_image"] = img  # Store preprocessed for faster verification

        # Clear any existing verification cache for this user
        for session_id in verification_cache:
            if session_id in user_sessions and user_sessions[session_id]["user_id"] == user_id:
                verification_cache[session_id] = {}

        logger.info(f"Reference face registered for user {user_id}")
        return {
            "status": "success",
            "message": f"Reference face registered for user {user_id}",
            "reference_hash": img_hash,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error registering face: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error registering face: {str(e)}")

@app.get("/session-stats/{session_id}")
async def get_session_stats(session_id: str):
    """Get statistics and summary for an exam session"""
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = user_sessions[session_id]

    # Calculate stats
    total_frames = len(session["history"])
    cheating_events = len(session["cheating_events"])

    # Count occurrences of each suspicious behavior
    behavior_counts = {}
    for frame in session["history"]:
        if "suspicious_behaviors" in frame:
            for behavior in frame["suspicious_behaviors"]:
                if behavior not in behavior_counts:
                    behavior_counts[behavior] = 0
                behavior_counts[behavior] += 1

    # Calculate percentage of time with suspicious behavior
    suspicious_frames = sum(1 for frame in session["history"] if frame.get("suspicious_behaviors", []))
    suspicious_percentage = (suspicious_frames / total_frames * 100) if total_frames > 0 else 0

    # Get max cheating probability
    max_cheating_prob = max((frame.get("cheating_probability", 0) for frame in session["history"]), default=0)

    # Calculate average attention (inverted cheating probability)
    avg_attention = 100 - sum(frame.get("cheating_probability", 0) * 100 for frame in session["history"]) / total_frames if total_frames > 0 else 100

    # Include eye tracking metrics
    looking_away_percentage = (session["looking_away_count"] / total_frames * 100) if total_frames > 0 else 0

    return {
        "session_id": session_id,
        "user_id": session["user_id"],
        "start_time": session["start_time"],
        "last_activity": session["last_activity"],
        "total_frames_analyzed": total_frames,
        "suspicious_behavior_percentage": round(suspicious_percentage, 2),
        "attention_score": round(avg_attention, 2),
        "looking_away_percentage": round(looking_away_percentage, 2),
        "max_cheating_probability": round(max_cheating_prob, 2),
        "total_cheating_events": cheating_events,
        "warnings_issued": session["warnings_issued"],
        "behavior_breakdown": behavior_counts,
        "integrity_status": "pass" if suspicious_percentage < 25 else "warning" if suspicious_percentage < 50 else "fail"
    }

@app.post("/end-session/{session_id}")
async def end_session(session_id: str):
    """End an exam session and return final statistics"""
    if session_id not in user_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get stats before removing the session
    stats = await get_session_stats(session_id)

    # Mark session as inactive
    if session_id in exam_sessions:
        exam_sessions[session_id].active = False

    # Clean up verification cache
    if session_id in verification_cache:
        del verification_cache[session_id]

    return {
        "status": "success",
        "message": "Exam session ended successfully",
        "session_summary": stats
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len([s for s in exam_sessions.values() if s.active]),
        "version": "2.1.0",
        "memory_usage": {
            "sessions": len(user_sessions),
            "verification_cache": sum(len(cache) for cache in verification_cache.values()),
            "reference_images": len(reference_images)
        }
    }

# Optimize image response format
@app.post("/optimize-image/")
async def optimize_image(image: UploadFile = File(...)):
    """
    Optimize and resize an uploaded image for better performance.
    This helps the frontend reduce bandwidth usage.
    """
    try:
        contents = await image.read()
        img = preprocess_image(contents, max_dimension=640)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Encode the optimized image with reduced quality
        _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])

        # Return optimized image bytes
        return Response(
            content=buffer.tobytes(),
            media_type="image/jpeg"
        )
    except Exception as e:
        logger.error(f"Error optimizing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# New endpoint for Next.js frontend integration
@app.post("/verify-identity/")
async def verify_identity_endpoint(
    reference_image: UploadFile = File(...),
    current_image: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    Standalone endpoint to verify if two faces belong to the same person.
    Useful for frontend verification without full anti-cheat processing.
    """
    try:
        # Process images
        ref_contents = await reference_image.read()
        current_contents = await current_image.read()

        # Preprocess images
        ref_img = preprocess_image(ref_contents)
        current_img = preprocess_image(current_contents)

        if ref_img is None or current_img is None:
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Run face verification
        verification_result = verify_identity(ref_img, current_img, user_id=user_id)

        # Return verification result
        return {
            "status": "success",
            "is_same_person": verification_result.get("is_same_person", False),
            "verification_score": verification_result.get("verification_score", 1.0),
            "verification_threshold": verification_result.get("verification_threshold", 0.4),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error verifying identity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error verifying identity: {str(e)}")

# Scheduled task to clean up old verification cache
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Advanced Exam Anti-Cheating API")

    # Start background task for cleanup
    def cleanup_task():
        while True:
            try:
                # Clean up verification cache older than 5 minutes
                for session_id in list(verification_cache.keys()):
                    if session_id not in user_sessions:
                        del verification_cache[session_id]
                        continue

                    # For active sessions, clean old cache entries
                    current_time = time.time()
                    cache = verification_cache[session_id]
                    for key in list(cache.keys()):
                        # Extract timestamp from cache key
                        try:
                            ts = float(key.split('_')[-1]) * 60  # Convert minutes to seconds
                            if current_time - ts > 300:  # Older than 5 minutes
                                del cache[key]
                        except (ValueError, IndexError):
                            continue
            except Exception as e:
                logger.error(f"Error in cleanup task: {str(e)}")

            # Sleep for 5 minutes
            time.sleep(300)

    # Start the cleanup task in a background thread
    import threading
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
    cleanup_thread.start()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Advanced Exam Anti-Cheating API")

# Error handling middleware
@app.middleware("http")
async def add_error_handling(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_id": generate_session_id()},
        )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)  # Disable reload in production for better performance

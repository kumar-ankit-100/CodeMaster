"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for API responses
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GazeInfo {
  left_ear: number;
  right_ear: number;
  gaze_x: number;
  gaze_y: number;
}

interface FaceDetail {
  face_id: number;
  bounding_box: BoundingBox;
  confidence: number;
  emotion?: string;
  verified?: boolean;
  verification_score?: number;
  verification_threshold?: number;
  gaze_info?: GazeInfo;
}

interface CheatDetectionResult {
  session_id: string;
  timestamp: string;
  faces_detected: number;
  multiple_faces: boolean;
  face_details: FaceDetail[];
  is_same_person?: boolean;
  looking_away?: boolean;
  speaking?: boolean;
  emotion?: string;
  suspicion_level: string;
  cheating_probability: number;
  warnings: string[];
  recommendations: string[];
  attention_score: number;
}

export default function PopupCheatDetection({session_id}:{ session_id : string}) {
  const sessionId = session_id;
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [lastResult, setLastResult] = useState<CheatDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Monitoring active');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiUrl = "http://localhost:8000";
  const userId = "test_user_123";
//   const sessionId = "sample_session_id"; // In a real app, pass this via context or state

  // Initialize webcam
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('Camera ready');
      } catch (err) {
        setError('Failed to access webcam. Please ensure permissions are granted.');
        setStatus('Error');
        console.error('Error accessing webcam:', err);
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start monitoring
  useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(async () => {
        await detectCheating();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring]);

  // Capture frame from webcam
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Detect cheating
  const detectCheating = async () => {
    if (!sessionId) {
      setError('No active session.');
      return;
    }

    try {
      const frameBase64 = captureFrame();
      if (!frameBase64) {
        console.error('Failed to capture frame');
        return;
      }

      const response = await fetch(frameBase64);
      const blob = await response.blob();
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('frame', file);
      formData.append('session_id', sessionId);

      const apiResponse = await fetch(`${apiUrl}/detect-cheating/`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Failed to process frame');
      }

      const result: CheatDetectionResult = await apiResponse.json();
      setLastResult(result);
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      setError(`Detection error: ${errorMessage}`);
      console.error('Error detecting cheating:', err);
    }
  };

  // Render suspicion indicator
  const renderSuspicionIndicator = () => {
    if (!lastResult) return null;

    const { suspicion_level, cheating_probability } = lastResult;
    let color = 'bg-green-500';
    let textColor = 'text-green-600';
    let ringColor = 'ring-green-400';

    if (suspicion_level === 'MEDIUM') {
      color = 'bg-yellow-500';
      textColor = 'text-yellow-600';
      ringColor = 'ring-yellow-400';
    } else if (suspicion_level === 'HIGH' || suspicion_level === 'CRITICAL') {
      color = 'bg-red-500';
      textColor = 'text-red-600';
      ringColor = 'ring-red-400';
    }

    return (
      <motion.div
        className="mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center">
          <motion.div
            className={`w-2 h-2 rounded-full ${color} mr-2 ring-2 ${ringColor}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          ></motion.div>
          <span className={`text-xs ${textColor}`}>
            {`Suspicion Level:  `}    
            {Math.round(cheating_probability * 100)}%
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="">
      
      {/* Popup Video and Monitoring Analysis */}
      <motion.div
        className="fixed bottom-4 right-4 w-45 h-45 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/20 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {/* Recording indicator */}
          {isMonitoring && (
            <div className="absolute top-2 right-2 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              ></motion.div>
              <span className="text-xs font-medium text-white">Recording</span>
            </div>
          )}
          {/* Face detection boxes */}
          <AnimatePresence>
            {lastResult &&
              lastResult.face_details.map(face => (
                <motion.div
                  key={face.face_id}
                  className="absolute border-2 border-purple-400 rounded-md"
                  style={{
                    left: `${(face.bounding_box.x * 320) / 640}px`, // Scale to smaller video size
                    top: `${(face.bounding_box.y * 240) / 480}px`,
                    width: `${(face.bounding_box.width * 320) / 640}px`,
                    height: `${(face.bounding_box.height * 240) / 480}px`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="pl-3 pr-3 bg-white/5">
          
          <ul className="space-y-2 text-xs text-white mt-2">
            {/* <li className="flex justify-between">
              <span className="text-gray-400">Faces detected</span>
              <span className={`font-medium ${lastResult && lastResult.faces_detected > 1 ? 'text-red-400' : 'text-gray-200'}`}>
                {lastResult ? lastResult.faces_detected : '0'}
              </span>
            </li> */}
            {/* {lastResult && lastResult.is_same_person !== undefined && (
              <li className="flex justify-between">
                <span className="text-gray-400">Identity verified</span>
                <span className={`font-medium ${lastResult.is_same_person ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.is_same_person ? 'Yes ✓' : 'No ⚠️'}
                </span>
              </li>
            )} */}
            {lastResult && lastResult.looking_away !== undefined && (
              <li className="flex justify-between">
                <span className="text-gray-400">Focus on screen</span>
                <span className={`font-medium ${!lastResult.looking_away ? 'text-green-400' : 'text-red-400'}`}>
                  {!lastResult.looking_away ? 'Yes ✓' : 'No ⚠️'}
                </span>
              </li>
            )}
          </ul>
          {/* {lastResult && renderSuspicionIndicator()}
          {lastResult && lastResult.warnings.length > 0 && (
            <div className="mt-4 pt-2 border-t border-white/10">
              <h4 className="text-sm font-medium text-red-400 mb-2">Warnings</h4>
              <ul className="space-y-1 text-xs text-red-300">
                {lastResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}
          {/* {lastResult && lastResult.recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <h4 className="text-sm font-medium text-blue-400 mb-2">Recommendations</h4>
              <ul className="space-y-1 text-xs text-blue-300">
                {lastResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="mt-0.5">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )} */}
          {lastResult && (
           <div className=" pt-2 border-t border-white/10 text-xs text-gray-400">
           <div>ID: {lastResult.session_id.substring(0, 8)}...</div>
           <div>Updated: {new Date(lastResult.timestamp).toLocaleTimeString()}</div>
         </div>
         
          
          )}
        </div>
      </motion.div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

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

interface CheatDetectionProps {
  apiUrl: string;
  userId: string;
  captureInterval?: number; // in ms
  onCheatDetected?: (result: CheatDetectionResult) => void;
}

const CheatDetection: React.FC<CheatDetectionProps> = ({
  apiUrl,
  userId,
  captureInterval = 1000,
  onCheatDetected,
}) => {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheatDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Initialize webcam
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
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

  // Register face
  const registerFace = async () => {
    try {
      setStatus('Registering face...');
      setError(null);
      const frameBase64 = captureFrame();
      if (!frameBase64) {
        throw new Error('Failed to capture frame');
      }

      const response = await fetch(frameBase64);
      const blob = await response.blob();
      const file = new File([blob], 'reference-face.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('user_id', userId);

      const apiResponse = await fetch(`${apiUrl}/register-face/`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || 'Failed to register face');
      }

      setReferenceImage(frameBase64);
      setIsRegistered(true);
      setStatus('Face registered successfully');
      setShowInstructions(false);

      // Start exam session
      await startExamSession(file);
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      setError(`Face registration failed: ${errorMessage}`);
      setStatus('Registration failed');
      console.error('Error registering face:', err);
    }
  };

  // Start exam session
  const startExamSession = async (referenceFile: File) => {
    try {
      setStatus('Starting exam session...');
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('reference_image', referenceFile);

      const response = await fetch(`${apiUrl}/start-exam-session/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start exam session');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setStatus('Session started');
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      setError(`Failed to start session: ${errorMessage}`);
      setStatus('Session failed');
      console.error('Error starting session:', err);
    }
  };

  // Start monitoring
  const startMonitoring = () => {
    if (!isRegistered) {
      setError('Please register your face first');
      return;
    }
    if (!sessionId) {
      setError('No active session. Please register your face again.');
      return;
    }

    setIsMonitoring(true);
    setStatus('Monitoring active');
    setError(null);

    intervalRef.current = setInterval(async () => {
      await detectCheating();
    }, captureInterval);
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    setStatus('Monitoring stopped');

    if (sessionId) {
      try {
        const response = await fetch(`${apiUrl}/end-session/${sessionId}`, {
          method: 'POST',
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to end session:', errorData.detail);
        }
        setSessionId(null);
      } catch (err) {
        console.error('Error ending session:', err);
      }
    }
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
      console.log(result);

      if (result.cheating_probability > 0.7 && onCheatDetected) {
        onCheatDetected(result);
      }
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
            className={`w-4 h-4 rounded-full ${color} mr-2 ring-2 ${ringColor}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          ></motion.div>
          <span className={`font-medium ${textColor}`}>
            Suspicion Level: {suspicion_level.charAt(0).toUpperCase() + suspicion_level.slice(1).toLowerCase()} (
            {Math.round(cheating_probability * 100)}%)
          </span>
        </div>
      </motion.div>
    );
  };
  const [loading, setLoading] = useState(false);
  // Handle Start Interview
  const handleStartInterview = async (roundId:string) => {
    try {
      setLoading(true);
      setError(null);
    

      // Fetch active interview contest or create a new one
      const response = await fetch('/api/interview/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roundId: "assessment",
          InterviewSessionId : sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start interview session');
      }

      const data = await response.json();

      // Navigate to the contest page with the returned contest ID
      router.push(`/contest/${data.contestId}?sessionId=${sessionId}`);

      // If this is a new contest, we could show a notification or instruction
      if (data.isNew) {
        // You could add UI logic here to show interview instructions
        console.log('New interview session started');
      } else {
        console.log('Continuing existing interview session');
      }
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // router.push(`/contest?sessionId=${sessionId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <motion.div
        className="max-w-4xl mx-auto pt-12 pb-20 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              Real Time Video Monitoring System
            </h1>
            <p className="text-gray-300 mt-2">Secure coding interview environment</p>
          </div>
          <motion.div
            className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full"
            animate={{
              boxShadow: isMonitoring
                ? ['0 0 0 rgba(167, 139, 250, 0.4)', '0 0 20px rgba(167, 139, 250, 0.7)', '0 0 0 rgba(167, 139, 250, 0.4)']
                : 'none',
            }}
            transition={{ repeat: isMonitoring ? Infinity : 0, duration: 2 }}
          >
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">{status}</span>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="col-span-2">
            <motion.div
              className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl ${isMonitoring ? 'ring-4 ring-purple-500' : ''
                }`}
              layout
            >
              {/* Animated background pattern (decorative only) */}
              <motion.div
                className="absolute inset-0 opacity-20 z-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.2) 0%, rgba(0, 0, 0, 0) 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{ repeat: Infinity, duration: 8 }}
              />

              {showInstructions && !isRegistered && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-6 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-purple-500/30 flex items-center justify-center mb-6 mx-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Face Registration Required</h3>
                    <p className="text-gray-300 max-w-md">
                      To proceed with the coding interview, we need to register your face for identity verification.
                      Please ensure you're in a well-lit area with your face clearly visible.
                    </p>
                    <motion.button
                      onClick={() => setShowInstructions(false)}
                      className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Continue
                    </motion.button>
                  </motion.div>
                </div>
              )}

              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover z-10"
                autoPlay
                playsInline
                muted
              />

              {/* Overlay frame graphic */}
              <div className="absolute inset-0 border-2 border-purple-500/30 rounded-2xl pointer-events-none z-20">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-purple-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-purple-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-500 rounded-br-2xl"></div>
              </div>

              {/* Face detection boxes */}
              <AnimatePresence>
                {lastResult &&
                  lastResult.face_details.map(face => (
                    <motion.div
                      key={face.face_id}
                      className="absolute border-2 border-purple-400 rounded-md z-30"
                      style={{
                        left: `${face.bounding_box.x - 80}px`,
                        top: `${face.bounding_box.y - 80}px`,
                        width: `${face.bounding_box.width}px`,
                        height: `${face.bounding_box.height}px`,
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute -top-8 left-0 bg-purple-600 mélange backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                        {`id: ${lastResult.session_id.substring(0, 8)}` || 'unknown'} {face.verified === false ? '⚠️' : '✓'}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {/* Recording indicator */}
              {isMonitoring && (
                <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full z-30">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  ></motion.div>
                  <span className="text-xs font-medium">Recording</span>
                </div>
              )}
            </motion.div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-8 flex flex-wrap gap-4">
              <motion.button
                onClick={registerFace}
                disabled={isMonitoring}
                className={`px-6 py-3 rounded-full font-medium transition-all ${isMonitoring
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-700/30 hover:shadow-purple-700/50'
                  }`}
                whileHover={!isMonitoring ? { scale: 1.05 } : {}}
                whileTap={!isMonitoring ? { scale: 0.95 } : {}}
              >
                {isRegistered ? 'Re-Register Face' : 'Register Face'}
              </motion.button>

              {!isMonitoring ? (
                <motion.button
                  onClick={startMonitoring}
                  disabled={!isRegistered || !sessionId}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${!isRegistered || !sessionId
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-emerald-700/30 hover:shadow-emerald-700/50'
                    }`}
                  whileHover={isRegistered && sessionId ? { scale: 1.05 } : {}}
                  whileTap={isRegistered && sessionId ? { scale: 0.95 } : {}}
                >
                  Start Monitoring
                </motion.button>
              ) : (
                <motion.button
                  onClick={stopMonitoring}
                  className="px-6 py-3 rounded-full font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-pink-700/30 hover:shadow-pink-700/50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Stop Monitoring
                </motion.button>
              )}

              {isMonitoring && (
                <motion.button
                  onClick={handleStartInterview}
                  className="px-6 py-3 rounded-full font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-700/30 hover:shadow-cyan-700/50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Interview
                </motion.button>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <AnimatePresence>
              {error && (
                <motion.div
                  className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 mb-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-1 bg-red-500/20 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-red-100">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isRegistered && (
              <motion.div
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Face Registered</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Your identity has been verified. You can now begin the monitored coding session.
                </p>
              </motion.div>
            )}

            {lastResult && (
              <motion.div
                className="rounded-xl overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
              >
                <div className="bg-white/5 backdrop-blur-sm p-4 border-b border-white/10">
                  <h3 className="font-medium flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-purple-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Monitoring Analysis
                  </h3>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-5 border-white/10 rounded-b-xl">
                  <ul className="space-y-4 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-400">Faces detected</span>
                      <span className={`font-medium ${lastResult.faces_detected > 1 ? 'text-red-400' : 'text-gray-200'}`}>
                        {lastResult.faces_detected}
                      </span>
                    </li>

                    {lastResult.is_same_person !== undefined && (
                      <li className="flex justify-between">
                        <span className="text-gray-400">Identity verified</span>
                        <span className={`font-medium ${lastResult.is_same_person ? 'text-green-400' : 'text-red-400'}`}>
                          {lastResult.is_same_person ? 'Yes ✓' : 'No ⚠️'}
                        </span>
                      </li>
                    )}

                    {lastResult.looking_away !== undefined && (
                      <li className="flex justify-between">
                        <span className="text-gray-400">Focus on screen</span>
                        <span className={`font-medium ${!lastResult.looking_away ? 'text-green-400' : 'text-red-400'}`}>
                          {!lastResult.looking_away ? 'Yes ✓' : 'No ⚠️'}
                        </span>
                      </li>
                    )}
                  </ul>

                  {renderSuspicionIndicator()}

                  {lastResult.warnings.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-red-400 mb-2">Warnings</h4>
                      <ul className="space-y-2 text-xs text-red-300">
                        {lastResult.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="mt-0.5">⚠️</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lastResult.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-blue-400 mb-2">Recommendations</h4>
                      <ul className="space-y-2 text-xs text-blue-300">
                        {lastResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="mt-0.5">💡</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-gray-400">
                    <span>ID: {lastResult.session_id.substring(0, 8)}...</span>
                    <span>Updated: {new Date(lastResult.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default CheatDetection;
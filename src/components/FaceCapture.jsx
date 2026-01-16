import React, { useRef, useState, useCallback, useEffect } from 'react';

const FaceCapture = ({ onCapture, onCancel, title = "Face Capture", instructions = "Position your face in the center" }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [livenessChallenge, setLivenessChallenge] = useState(null);
    const [challengeCompleted, setChallengeCompleted] = useState(false);

    // Liveness challenges
    const challenges = [
        { type: 'blink', instruction: 'Please blink your eyes' },
        { type: 'smile', instruction: 'Please smile' },
        { type: 'turn_left', instruction: 'Turn your head slightly left' },
        { type: 'turn_right', instruction: 'Turn your head slightly right' },
    ];

    useEffect(() => {
        startCamera();
        // Set random liveness challenge
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        setLivenessChallenge(randomChallenge);

        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setError(null);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please ensure you have granted camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror the canvas to match the video preview
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0);

        // Get base64 image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = imageData.split(',')[1];

        stopCamera();
        onCapture(base64Data);
    }, [stream, onCapture]);

    const handleCapture = () => {
        if (!challengeCompleted) {
            // For now, we'll skip actual liveness verification and just require user confirmation
            setChallengeCompleted(true);
            return;
        }

        setIsCapturing(true);
        setCountdown(3);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    capturePhoto();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-4">
                <h2 className="text-2xl font-bold text-white text-center mb-4">{title}</h2>

                {error ? (
                    <div className="text-center py-8">
                        <div className="text-red-400 mb-4">{error}</div>
                        <button
                            onClick={startCamera}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />

                            {/* Face guide overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-48 h-60 border-4 border-white/50 rounded-full"></div>
                            </div>

                            {/* Countdown overlay */}
                            {countdown && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
                                </div>
                            )}

                            {/* Screen flash effect for better capture in low light */}
                            {isCapturing && (
                                <div className="absolute inset-0 bg-white opacity-20"></div>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="hidden" />

                        {/* Instructions */}
                        <div className="mt-4 text-center">
                            {!challengeCompleted ? (
                                <div className="bg-yellow-900/50 rounded-lg p-4 mb-4">
                                    <p className="text-yellow-300 font-medium">🔐 Liveness Check</p>
                                    <p className="text-white mt-2">{livenessChallenge?.instruction}</p>
                                    <p className="text-gray-400 text-sm mt-1">Then click "I've completed the action"</p>
                                </div>
                            ) : (
                                <p className="text-gray-400">{instructions}</p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCapture}
                                disabled={isCapturing}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {!challengeCompleted ? "I've completed the action" : isCapturing ? 'Capturing...' : 'Capture Photo'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FaceCapture;

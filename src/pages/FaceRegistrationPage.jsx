import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import FaceCapture from '../components/FaceCapture';
import api from '../utils/api';

const FaceRegistrationPage = () => {
    const [showCamera, setShowCamera] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [hasFaceData, setHasFaceData] = useState(false);

    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        checkFaceRegistration();
    }, [user]);

    const checkFaceRegistration = async () => {
        if (!user?.id) return;
        try {
            const response = await api.get(`/users/${user.id}`);
            setHasFaceData(!!response.data.faceData);
        } catch (err) {
            console.error('Error checking face registration:', err);
        }
    };

    const handleFaceCapture = async (imageData) => {
        setShowCamera(false);
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.post(`/users/${user.id}/face-data`, {
                imageData: imageData
            });

            setResult({
                success: true,
                message: response.data.message || 'Face registered successfully!'
            });
            setHasFaceData(true);
        } catch (err) {
            console.error('Face registration error:', err);
            setError(err.response?.data?.message || 'Failed to register face. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Face Registration
                </h1>
                <p className="text-gray-600 mt-2">Register your face for attendance verification</p>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center">
                    {/* Face Icon */}
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${hasFaceData
                            ? 'bg-gradient-to-br from-green-400 to-green-600'
                            : 'bg-gradient-to-br from-gray-200 to-gray-300'
                        }`}>
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    {/* Status */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        {hasFaceData ? 'Face Registered' : 'No Face Registered'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {hasFaceData
                            ? 'Your face is registered for attendance verification. You can update it anytime.'
                            : 'Register your face to enable facial recognition attendance.'
                        }
                    </p>

                    {/* Result/Error Messages */}
                    {result && (
                        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-left">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="font-medium text-green-800">{result.message}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <p className="font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
                            <div className="flex items-center justify-center gap-3">
                                <div className="animate-spin">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <p className="font-medium text-blue-800">Processing your face data...</p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={() => setShowCamera(true)}
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3 mx-auto"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {hasFaceData ? 'Update Face' : 'Register Face'}
                    </button>
                </div>

                {/* Tips */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-medium text-gray-700 mb-4">Tips for best results:</h3>
                    <ul className="space-y-2 text-sm text-gray-500">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            Ensure good lighting on your face
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            Look directly at the camera
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            Remove glasses or hats that might obscure your face
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            Keep a neutral expression
                        </li>
                    </ul>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <FaceCapture
                    title="Register Your Face"
                    instructions="Position your face within the oval guide"
                    onCapture={handleFaceCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};

export default FaceRegistrationPage;

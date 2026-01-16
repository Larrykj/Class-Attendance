import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import FaceCapture from '../components/FaceCapture';
import api from '../utils/api';

const FaceAttendancePage = () => {
    const [showCamera, setShowCamera] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const user = useSelector((state) => state.auth.user);

    React.useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            const classData = response.data.classes || response.data;
            setClasses(Array.isArray(classData) ? classData : []);
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const handleFaceCapture = async (imageData) => {
        setShowCamera(false);
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await api.post('/attendance/face', {
                classId: selectedClass.id,
                imageData: imageData
            });

            setResult({
                success: true,
                message: response.data.message || 'Attendance marked successfully!',
                studentId: response.data.studentId
            });
        } catch (err) {
            console.error('Face attendance error:', err);
            setError(err.response?.data?.message || 'Failed to mark attendance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAttendance = (classItem) => {
        setSelectedClass(classItem);
        setShowCamera(true);
        setResult(null);
        setError(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Face Attendance
                </h1>
                <p className="text-gray-600 mt-2">Mark your attendance using facial recognition</p>
            </div>

            {/* Result/Error Messages */}
            {result && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-green-800">{result.message}</p>
                            <p className="text-sm text-green-600">Class: {selectedClass?.name}</p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-red-800">Attendance Failed</p>
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-spin">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-blue-800">Processing...</p>
                            <p className="text-sm text-blue-600">Verifying your face</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Class Selection */}
            <div className="grid gap-4 md:grid-cols-2">
                {classes.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">No classes available</p>
                    </div>
                ) : (
                    classes.map((classItem) => (
                        <div
                            key={classItem.id}
                            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:border-blue-300 transition-all hover:shadow-xl"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{classItem.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Code: {classItem.code}</p>
                                    <p className="text-sm text-gray-400 mt-2">{classItem.schedule}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartAttendance(classItem)}
                                disabled={loading}
                                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Mark Attendance
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <FaceCapture
                    title="Face Attendance"
                    instructions="Look directly at the camera"
                    onCapture={handleFaceCapture}
                    onCancel={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};

export default FaceAttendancePage;

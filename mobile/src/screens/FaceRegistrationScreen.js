import React, { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { registerFaceData } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function FaceRegistrationScreen({ navigation }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [instruction, setInstruction] = useState('Position your face in the center');
    const cameraRef = useRef(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleCapture = async () => {
        if (!cameraRef.current || processing) return;

        // Start countdown
        setInstruction('Get ready...');
        for (let i = 3; i > 0; i--) {
            setCountdown(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(null);
        setInstruction('Capturing...');

        try {
            setProcessing(true);
            const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });

            if (!photo.base64) {
                Alert.alert('Error', 'Failed to capture image');
                setProcessing(false);
                return;
            }

            const imageData = photo.base64;

            // Register face with backend
            const response = await registerFaceData(user.id, imageData);

            Alert.alert(
                'Success! 🎉',
                'Your face has been registered successfully. You can now use face attendance.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to register face. Please try again.');
            setInstruction('Position your face in the center');
        } finally {
            setProcessing(false);
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorIcon}>📷</Text>
                <Text style={styles.errorTitle}>Camera Access Required</Text>
                <Text style={styles.errorText}>
                    Please enable camera permissions in your device settings to register your face.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Face Registration</Text>
                <Text style={styles.subtitle}>Register your face for attendance</Text>
            </View>

            <View style={styles.cameraContainer}>
                <Camera
                    style={styles.camera}
                    ref={cameraRef}
                    type={Camera.Constants?.Type?.front || 'front'}
                >
                    {/* Face guide overlay */}
                    <View style={styles.overlay}>
                        <View style={styles.faceGuide} />
                    </View>

                    {/* Countdown overlay */}
                    {countdown && (
                        <View style={styles.countdownOverlay}>
                            <Text style={styles.countdownText}>{countdown}</Text>
                        </View>
                    )}
                </Camera>
            </View>

            <View style={styles.instructionContainer}>
                <Text style={styles.instruction}>{instruction}</Text>
            </View>

            <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Tips for best results:</Text>
                <Text style={styles.tipItem}>✓ Good lighting on your face</Text>
                <Text style={styles.tipItem}>✓ Look directly at the camera</Text>
                <Text style={styles.tipItem}>✓ Remove glasses if possible</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.captureButton, processing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={processing}
                >
                    {processing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.captureButtonIcon}>📸</Text>
                            <Text style={styles.captureButtonText}>Register Face</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 4,
    },
    cameraContainer: {
        flex: 1,
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1e293b',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceGuide: {
        width: 200,
        height: 260,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 120,
    },
    countdownOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 100,
        fontWeight: 'bold',
        color: '#fff',
    },
    instructionContainer: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    instruction: {
        color: '#e2e8f0',
        fontSize: 16,
        fontWeight: '500',
    },
    tipsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        marginHorizontal: 20,
        borderRadius: 12,
    },
    tipsTitle: {
        color: '#a5b4fc',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    tipItem: {
        color: '#94a3b8',
        fontSize: 13,
        marginBottom: 4,
    },
    actions: {
        padding: 20,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        paddingVertical: 16,
        borderRadius: 12,
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
    captureButtonIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 30,
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 15,
        fontSize: 14,
    },
    errorIcon: {
        fontSize: 60,
        marginBottom: 20,
    },
    errorTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    errorText: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
});

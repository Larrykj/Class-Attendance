import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { markAttendanceWithFace } from '../services/api';

export default function FaceAttendanceScreen({ route, navigation }) {
  const { classId, className } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || processing) return;

    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo.base64) {
        Alert.alert('Error', 'Failed to capture image');
        setProcessing(false);
        return;
      }

      const imageData = photo.base64;
      const response = await markAttendanceWithFace(classId, imageData);

      const studentId = response?.studentId || response?.record?.studentId;
      Alert.alert(
        'Success',
        studentId
          ? `Attendance recorded via face for student ID ${studentId}`
          : 'Attendance recorded via face.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to mark attendance via face');
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera. Please enable camera permissions in settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Attendance</Text>
      <Text style={styles.subtitle}>{className} (ID: {classId})</Text>

      <View style={styles.cameraContainer}>
        <Camera style={styles.camera} ref={cameraRef} />
      </View>

      <View style={styles.actions}>
        <Button
          title={processing ? 'Processing...' : 'Capture & Mark Attendance'}
          onPress={handleCapture}
          disabled={processing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  cameraContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  actions: {
    padding: 16,
    backgroundColor: '#111',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

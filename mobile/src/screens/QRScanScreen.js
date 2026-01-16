import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { scanCodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { runOnJS } from 'react-native-reanimated';
import { markAttendanceWithQR } from '../services/api';

export default function QRScanScreen({ route, navigation }) {
  const { className } = route.params || {};
  const [hasPermission, setHasPermission] = useState(null);
  const [processing, setProcessing] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const onCodeScanned = async (value) => {
    if (processing) return;
    try {
      setProcessing(true);
      const res = await markAttendanceWithQR(value);
      Alert.alert(
        'QR Attendance',
        res?.message || 'Attendance recorded via QR code.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to mark attendance via QR');
      setProcessing(false);
    }
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const codes = scanCodes(frame, [BarcodeFormat.QR_CODE]);
    if (codes.length > 0) {
      const value = codes[0]?.value;
      if (value) {
        runOnJS(onCodeScanned)(value);
      }
    }
  }, [processing]);

  if (hasPermission === null || !device) {
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
      <Text style={styles.title}>Scan Class QR</Text>
      {className ? <Text style={styles.subtitle}>{className}</Text> : null}
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          device={device}
          isActive={!processing}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
      </View>
      <Text style={styles.hint}>Point the camera at the class QR code.</Text>
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
  hint: {
    color: '#ccc',
    textAlign: 'center',
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

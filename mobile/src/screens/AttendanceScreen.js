import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { queueAttendance, syncIfOnline } from '../services/sync';
import { useAuth } from '../context/AuthContext';

export default function AttendanceScreen({ route, navigation }) {
  const { classId, className } = route.params;
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const markPresentMock = async () => {
    if (!user || user.role !== 'student') {
      Alert.alert('Not supported', 'Offline self check-in is only available for students.');
      return;
    }

    const record = {
      localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      classId,
      studentId: user.id,
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      verificationMethod: 'manual',
      latitude: null,
      longitude: null,
      deviceId: 'demo-device',
      notes: 'Marked from demo screen',
    };

    await queueAttendance(record);
    Alert.alert('Queued', 'Attendance queued for sync');
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncIfOnline();
    setSyncing(false);
    if (result.error) {
      Alert.alert('Sync failed', result.error);
    } else {
      Alert.alert('Sync', `Synced ${result.synced} records (if any pending)`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{className}</Text>
      <Text style={styles.subtitle}>Class ID: {classId}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demo actions</Text>
        {user && user.role === 'student' && (
          <>
            <Button title="Mark Present (queue offline)" onPress={markPresentMock} />
            <View style={{ height: 12 }} />
          </>
        )}
        <Button
          title={syncing ? 'Syncing...' : 'Sync Now'}
          onPress={handleSync}
          disabled={syncing}
        />
        <View style={{ height: 12 }} />
        <Button
          title="Face Attendance (online)"
          onPress={() => navigation.navigate('FaceAttendance', { classId, className })}
        />
        <View style={{ height: 12 }} />
        <Button
          title="QR Attendance (Vision Camera)"
          onPress={() => navigation.navigate('QRScan', { classId, className })}
        />
      </View>

      <Text style={styles.note}>
        This is a minimal demo screen. You will replace this with real QR scan and face capture
        flows later, but it already exercises the offline sync API your backend exposes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  note: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
  },
});

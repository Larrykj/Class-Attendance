import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { fetchAttendanceByStudent } from '../services/api';

export default function ChildAttendanceScreen({ route }) {
  const { studentId, childName } = route.params;
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRefreshing(true);
      const data = await fetchAttendanceByStudent(studentId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load attendance:', e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.recordRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.recordTitle}>{item.class?.name || 'Class'}</Text>
        {item.class?.code ? <Text style={styles.recordSubtitle}>{item.class.code}</Text> : null}
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={[styles.status, styles[`status_${item.status}`] || null]}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
        <Text style={styles.subtitle}>{childName}</Text>
      </View>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No attendance records yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  status: {
    marginTop: 4,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  status_present: {
    color: '#0a0',
  },
  status_absent: {
    color: '#d00',
  },
  status_late: {
    color: '#e67e22',
  },
  status_excused: {
    color: '#2980b9',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

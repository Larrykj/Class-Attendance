import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { syncOfflineAttendance } from './api';

const PENDING_KEY = 'pending_attendance_records_v1';

export async function queueAttendance(record) {
  const existing = await AsyncStorage.getItem(PENDING_KEY);
  const list = existing ? JSON.parse(existing) : [];
  list.push(record);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

export async function getPendingAttendance() {
  const existing = await AsyncStorage.getItem(PENDING_KEY);
  return existing ? JSON.parse(existing) : [];
}

export async function clearPendingAttendance() {
  await AsyncStorage.removeItem(PENDING_KEY);
}

export async function syncIfOnline() {
  const state = await NetInfo.fetch();
  if (!state.isConnected || !state.isInternetReachable) {
    return { synced: 0 };
  }

  const pending = await getPendingAttendance();
  if (!pending.length) {
    return { synced: 0 };
  }

  try {
    const response = await syncOfflineAttendance(pending);
    const { results = [] } = response || {};

    // For simplicity, if most are successful, clear the queue.
    const failed = results.filter((r) => !r.success);
    if (failed.length === 0 || failed.length < pending.length) {
      await clearPendingAttendance();
    }

    return { synced: results.length };
  } catch (error) {
    // Keep pending records for later retry
    console.warn('Sync failed, will retry later:', error.message);
    return { synced: 0, error: error.message };
  }
}

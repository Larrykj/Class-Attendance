import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

async function getAuthToken() {
  return AsyncStorage.getItem('auth_token');
}

async function request(path, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    const message = data?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function fetchClasses() {
  return request('/classes');
}

export async function syncOfflineAttendance(records) {
  return request('/attendance/sync', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

export async function markAttendanceWithFace(classId, imageData) {
  return request('/attendance/face', {
    method: 'POST',
    body: JSON.stringify({ classId, imageData }),
  });
}

export async function markAttendanceWithQR(qrCodeData) {
  return request('/attendance/qr', {
    method: 'POST',
    body: JSON.stringify({ qrCodeData }),
  });
}

export async function fetchMyChildren() {
  return request('/users/me/children');
}

export async function fetchAttendanceByStudent(studentId) {
  return request(`/attendance/student/${studentId}`);
}

export async function registerFaceData(userId, imageData) {
  return request(`/users/${userId}/face-data`, {
    method: 'POST',
    body: JSON.stringify({ imageData }),
  });
}

export async function getCurrentUser() {
  return request('/auth/profile');
}

export async function getUserById(userId) {
  return request(`/users/${userId}`);
}

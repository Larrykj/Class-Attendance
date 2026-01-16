import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import ClassListScreen from './src/screens/ClassListScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import FaceAttendanceScreen from './src/screens/FaceAttendanceScreen';
import FaceRegistrationScreen from './src/screens/FaceRegistrationScreen';
import QRScanScreen from './src/screens/QRScanScreen';
import ParentChildrenScreen from './src/screens/ParentChildrenScreen';
import ChildAttendanceScreen from './src/screens/ChildAttendanceScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {token ? (
          user && user.role === 'parent' ? (
            <>
              <Stack.Screen
                name="ParentChildren"
                component={ParentChildrenScreen}
                options={{ title: 'My Children' }}
              />
              <Stack.Screen
                name="ChildAttendance"
                component={ChildAttendanceScreen}
                options={{ title: 'Child Attendance' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Classes" component={ClassListScreen} />
              <Stack.Screen name="Attendance" component={AttendanceScreen} />
              <Stack.Screen name="FaceAttendance" component={FaceAttendanceScreen} />
              <Stack.Screen name="FaceRegistration" component={FaceRegistrationScreen} options={{ title: 'Register Face' }} />
              <Stack.Screen name="QRScan" component={QRScanScreen} />
            </>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

import 'react-native-gesture-handler';
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../components/AuthContext';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isLoaded, userId, user } = useAuth();

  // Show loading screen while auth is loading
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      {!userId ? (
        // User is not authenticated - show auth flow
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.role === 'admin' ? (
        // User is authenticated as admin
        <Stack.Screen name="Admin" component={AdminNavigator} />
      ) : (
        // User is authenticated as student (default)
        <Stack.Screen name="Student" component={StudentNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
};
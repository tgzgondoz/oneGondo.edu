import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text } from 'react-native'; // Add these imports

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clerkLoaded, setClerkLoaded] = useState(false);

  // Initialize auth
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if user is already signed in
      const storedUser = await SecureStore.getItemAsync('clerk_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
      setClerkLoaded(true);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      // Simulate authentication
      const userData = {
        id: '1',
        email: email,
        name: email.includes('admin') ? 'Admin User' : 'Student User',
        role: email.includes('admin') ? 'admin' : 'student',
        avatar: email.includes('admin') ? 'A' : 'S'
      };

      await SecureStore.setItemAsync('clerk_user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    try {
      // Simulate registration
      const userData = {
        id: Date.now().toString(),
        email: email,
        name: fullName,
        role: 'student',
        avatar: fullName.split(' ').map(n => n[0]).join('')
      };

      await SecureStore.setItemAsync('clerk_user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('clerk_user');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    clerkLoaded,
    isLoaded: clerkLoaded,
    userId: user?.id,
    sessionId: user?.id ? 'session_' + user.id : null,
    signIn,
    signUp,
    signOut,
    login: signIn,
    logout: signOut,
    getToken: async () => {
      return user ? `token_${user.id}` : null;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Loading component for AuthProvider
export function AuthLoading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}
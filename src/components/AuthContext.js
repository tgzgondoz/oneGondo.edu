import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Firebase imports (compatible version)
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTw3SIUt53NaPMczcYfUN-oV-peGG9oRA",
  authDomain: "onegondo-edu.firebaseapp.com",
  databaseURL: "https://onegondo-edu-default-rtdb.firebaseio.com",
  projectId: "onegondo-edu",
  storageBucket: "onegondo-edu.firebasestorage.app",
  messagingSenderId: "986762141766",
  appId: "1:986762141766:web:564faa084bbd7e3b7c2a47",
  measurementId: "G-PXHF43L0ZL"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Initialize auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        try {
          const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            const userInfo = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name || firebaseUser.email,
              role: userData.role || 'student',
              avatar: userData.avatar || firebaseUser.email.charAt(0).toUpperCase()
            };
            setUser(userInfo);
            await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
          } else {
            // If user document doesn't exist, create one
            const userInfo = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email,
              role: 'student',
              avatar: firebaseUser.email.charAt(0).toUpperCase()
            };
            await db.collection('users').doc(firebaseUser.uid).set(userInfo);
            setUser(userInfo);
            await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        await SecureStore.deleteItemAsync('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password, loginType = 'student') => {
    setLoading(true);
    try {
      // Firebase authentication
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      
      // Check if user role matches login type
      if (loginType === 'admin' && userData.role !== 'admin') {
        await auth.signOut();
        throw new Error('Admin access required. Please use admin credentials.');
      }

      if (loginType === 'student' && userData.role !== 'student') {
        await auth.signOut();
        throw new Error('Please use the correct login type for your account.');
      }

      const userInfo = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.name || firebaseUser.email,
        role: userData.role,
        avatar: userData.avatar || firebaseUser.email.charAt(0).toUpperCase()
      };

      setUser(userInfo);
      await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message || 'Login failed';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName, role = 'student') => {
    setLoading(true);
    try {
      // Firebase authentication
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const userData = {
        email: email,
        name: fullName,
        role: role,
        avatar: fullName.split(' ').map(n => n[0]).join('').toUpperCase(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(firebaseUser.uid).set(userData);

      const userInfo = {
        id: firebaseUser.uid,
        ...userData
      };

      setUser(userInfo);
      await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        default:
          errorMessage = error.message || 'Registration failed';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setUser(null);
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    loading,
    isLoaded: !loading,
    userId: user?.id,
    sessionId: user?.id ? 'session_' + user.id : null,
    signIn,
    signUp,
    signOut: signOutUser,
    login: signIn,
    logout: signOutUser,
    getToken: async () => {
      return user ? await auth.currentUser.getIdToken() : null;
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
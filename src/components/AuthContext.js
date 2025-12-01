import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
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

// Configure Firestore
const db = firebase.firestore();
const firestoreSettings = {
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
};
db.settings(firestoreSettings);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const auth = firebase.auth();

  // Hard-coded admin credentials
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin';
  const ADMIN_EMAIL = 'admin@onegondo.edu';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user detected:', firebaseUser.uid);
          
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
              console.log('User data loaded successfully');
            } else {
              console.log('Creating new user document');
              const userInfo = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                role: 'student',
                avatar: firebaseUser.email.charAt(0).toUpperCase(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              };
              
              // If it's admin email, set role to admin
              if (firebaseUser.email === ADMIN_EMAIL) {
                userInfo.role = 'admin';
              }
              
              await db.collection('users').doc(firebaseUser.uid).set(userInfo);
              setUser(userInfo);
              await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
            }
          } catch (dbError) {
            console.error('Error accessing user data:', dbError);
            // If there's a permissions error, create a basic user object
            if (dbError.code === 'permission-denied' || dbError.message.includes('permissions')) {
              const fallbackUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'student',
                avatar: firebaseUser.email.charAt(0).toUpperCase()
              };
              setUser(fallbackUser);
              await SecureStore.setItemAsync('user', JSON.stringify(fallbackUser));
            } else {
              throw dbError;
            }
          }
        } else {
          console.log('No user signed in');
          setUser(null);
          await SecureStore.deleteItemAsync('user');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        await SecureStore.deleteItemAsync('user');
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password, loginType = 'student') => {
    setLoading(true);
    try {
      console.log(`Attempting ${loginType} login with:`, email);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Check for hard-coded admin login
      if (loginType === 'admin' && email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log('Hard-coded admin login detected');
        
        try {
          // Try to sign in with admin email
          const userCredential = await auth.signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
          const firebaseUser = userCredential.user;
          
          console.log('Firebase admin auth successful');
          
          // Create or update admin user in Firestore
          const adminInfo = {
            id: firebaseUser.uid,
            email: ADMIN_EMAIL,
            name: 'Administrator',
            role: 'admin',
            avatar: 'A',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          
          try {
            await db.collection('users').doc(firebaseUser.uid).set(adminInfo, { merge: true });
          } catch (writeError) {
            console.warn('Could not write admin document to Firestore, using fallback');
          }
          
          setUser(adminInfo);
          await SecureStore.setItemAsync('user', JSON.stringify(adminInfo));
          console.log('Admin login successful');
          return { success: true, user: adminInfo };
          
        } catch (firebaseError) {
          // If admin doesn't exist in Firebase, create it
          if (firebaseError.code === 'auth/user-not-found') {
            console.log('Creating admin user...');
            const userCredential = await auth.createUserWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
            const firebaseUser = userCredential.user;
            
            const adminInfo = {
              id: firebaseUser.uid,
              email: ADMIN_EMAIL,
              name: 'Administrator',
              role: 'admin',
              avatar: 'A',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            try {
              await db.collection('users').doc(firebaseUser.uid).set(adminInfo);
            } catch (writeError) {
              console.warn('Could not write admin document to Firestore');
            }
            
            setUser(adminInfo);
            await SecureStore.setItemAsync('user', JSON.stringify(adminInfo));
            console.log('Admin created and login successful');
            return { success: true, user: adminInfo };
          }
          throw firebaseError;
        }
      }

      // For student login or regular admin login with email
      // Firebase authentication with email/password
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      console.log('Firebase auth successful, fetching user data...');

      try {
        // Get user data from Firestore
        const userDoc = await Promise.race([
          db.collection('users').doc(firebaseUser.uid).get(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]);
        
        // If user document doesn't exist, create it
        if (!userDoc.exists) {
          console.log('User document not found, creating...');
          const newUserData = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'student',
            avatar: firebaseUser.email.charAt(0).toUpperCase(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          
          try {
            await db.collection('users').doc(firebaseUser.uid).set(newUserData);
          } catch (writeError) {
            console.warn('Could not write user document (permissions issue), using fallback data');
          }
          
          const userInfo = {
            id: firebaseUser.uid,
            ...newUserData
          };
          
          setUser(userInfo);
          await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
          return { success: true, user: userInfo };
        }

        const userData = userDoc.data();
        
        // Check if user is trying to login as admin but doesn't have admin role
        if (loginType === 'admin' && userData.role !== 'admin') {
          await auth.signOut();
          throw new Error('Admin access required. Please use admin credentials.');
        }

        const userInfo = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name || firebaseUser.email,
          role: userData.role || 'student',
          avatar: userData.avatar || firebaseUser.email.charAt(0).toUpperCase()
        };

        setUser(userInfo);
        await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
        
        console.log('Login successful:', userInfo);
        return { success: true, user: userInfo };
      } catch (dbError) {
        console.error('Firestore error during login:', dbError);
        // If Firestore fails due to permissions, still allow login with basic user info
        if (dbError.code === 'permission-denied' || dbError.message.includes('permissions')) {
          const fallbackUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'student',
            avatar: firebaseUser.email.charAt(0).toUpperCase()
          };
          
          // Check admin access for fallback user
          if (loginType === 'admin' && fallbackUser.role !== 'admin') {
            await auth.signOut();
            throw new Error('Admin access required. Please use admin credentials.');
          }
          
          setUser(fallbackUser);
          await SecureStore.setItemAsync('user', JSON.stringify(fallbackUser));
          console.log('Login successful with fallback data (Firestore permissions issue)');
          return { success: true, user: fallbackUser };
        }
        throw dbError;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid login credentials. Please check your email and password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'permission-denied':
          errorMessage = 'Database permissions issue. Please contact support.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName, role = 'student') => {
    setLoading(true);
    try {
      if (!email || !password || !fullName) {
        throw new Error('Please fill in all fields');
      }

      if (password.length < 6) {
        throw new Error('Password should be at least 6 characters');
      }

      console.log('Attempting registration:', email);

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      console.log('Firebase user created, saving user data...');

      const userData = {
        email: email,
        name: fullName,
        role: role,
        avatar: fullName.split(' ').map(n => n[0]).join('').toUpperCase(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      try {
        await db.collection('users').doc(firebaseUser.uid).set(userData);
      } catch (writeError) {
        console.warn('Could not write user document to Firestore (permissions issue)');
        // Continue even if Firestore write fails
      }

      const userInfo = {
        id: firebaseUser.uid,
        ...userData
      };

      setUser(userInfo);
      await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
      
      console.log('Registration successful:', userInfo);
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
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
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
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Helper function to check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    initializing,
    isLoaded: !loading && !initializing,
    userId: user?.id,
    sessionId: user?.id ? 'session_' + user.id : null,
    isAdmin: isAdmin(),
    signIn,
    signUp,
    signOut: signOutUser,
    login: signIn,
    logout: signOutUser,
    getToken: async () => {
      return user ? await auth.currentUser?.getIdToken() : null;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthLoading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, color: '#666' }}>Loading...</Text>
    </View>
  );
}
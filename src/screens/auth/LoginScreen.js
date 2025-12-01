import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import { useAuth } from '../../components/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await signIn(email, password, 'student');
    
    if (result.success) {
      Alert.alert('Success', 'Welcome back!');
    } else {
      Alert.alert('Error', result.error || 'Login failed');
    }
  };

  const handleAdminLogin = () => {
    // Show admin login options
    Alert.alert(
      'Admin Access',
      'Select login method:',
      [
        { 
          text: 'Demo Admin (Auto-login)', 
          onPress: () => handleAdminAutoLogin(true)
        },
        { 
          text: 'Enter Admin Credentials', 
          onPress: () => handleAdminManualLogin()
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        }
      ]
    );
  };

  const handleAdminAutoLogin = async (showAlert = true) => {
    // For demo/admin access with auto-credentials
    const adminEmail = 'admin@onegondo.edu';
    const adminPassword = 'admin123';
    
    if (showAlert) {
      Alert.alert('Demo Admin', 'Logging in with demo admin credentials...');
    }
    
    const result = await signIn(adminEmail, adminPassword, 'admin');
    
    if (result.success) {
      Alert.alert('Success', 'Welcome Administrator!');
    } else {
      // Try to create admin account if it doesn't exist
      Alert.alert('Setting up Admin', 'Creating admin account...');
      const createResult = await signIn('admin', 'admin', 'admin');
      if (!createResult.success) {
        Alert.alert('Admin Access', 
          'Please ensure admin@onegondo.edu is created in Firebase Authentication with password: admin123\n\nAlso create admin user document in Firestore with role: "admin"',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleAdminManualLogin = () => {
    // Show input for manual admin credentials
    Alert.prompt(
      'Admin Login',
      'Enter admin email:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (adminEmail) => {
            if (adminEmail) {
              Alert.prompt(
                'Admin Password',
                'Enter admin password:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Login',
                    onPress: async (adminPassword) => {
                      if (adminPassword) {
                        const result = await signIn(adminEmail, adminPassword, 'admin');
                        if (result.success) {
                          Alert.alert('Success', 'Welcome Administrator!');
                        } else {
                          Alert.alert('Admin Login Failed', result.error || 'Invalid admin credentials');
                        }
                      }
                    }
                  }
                ],
                'secure-text'
              );
            }
          }
        }
      ],
      'plain-text',
      'admin@onegondo.edu'
    );
  };

  // Quick login for testing (remove in production)
  const handleQuickTestLogin = () => {
    Alert.alert(
      'Quick Test Login',
      'Select test user:',
      [
        {
          text: 'Test Student',
          onPress: async () => {
            setEmail('student@test.com');
            setPassword('test123');
            // Auto-login after a short delay
            setTimeout(() => handleLogin(), 500);
          }
        },
        {
          text: 'Demo Admin',
          onPress: () => handleAdminAutoLogin(false)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>oneGondo.edu</Text>
            <Text style={styles.subtitle}>Mobile Learning Platform</Text>
            
            {/* Quick test button (remove in production) */}
            <TouchableOpacity 
              style={styles.testButton}
              onPress={handleQuickTestLogin}
            >
              <Text style={styles.testButtonText}>Quick Test Login</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Student Login</Text>
            <Text style={styles.formSubtitle}>Sign in to continue your learning</Text>

            {/* Email and Password Fields */}
            <TextInput
              style={styles.input}
              placeholder="Student Email"
              placeholderTextColor="#6c757d"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6c757d"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {/* Login Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.studentButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                New to oneGondo.edu?{' '}
                <Text 
                  style={styles.registerLink}
                  onPress={() => navigation.navigate('Register')}
                >
                  Create an account
                </Text>
              </Text>
            </View>

            {/* Admin Access Link */}
            <TouchableOpacity 
              style={styles.adminLinkContainer}
              onPress={handleAdminLogin}
            >
              <Text style={styles.adminLinkText}>
                <Text style={styles.adminIcon}>⚙️ </Text>
                Administrator Access
                <Text style={styles.adminIcon}> ⚙️</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need help? Contact{' '}
              <Text style={styles.contactText}>
                support@onegondo.edu
              </Text>
            </Text>
            <Text style={styles.footerNote}>
              For demo: Use 'student@test.com' / 'test123' or admin credentials
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    marginTop: 8,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginVertical: 8,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  studentButton: {
    backgroundColor: '#28a745', // Green for student
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#e8f4fc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1e8ff',
  },
  registerText: {
    color: '#495057',
    fontSize: 14,
  },
  registerLink: {
    color: '#2E86AB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  adminLinkText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: '600',
  },
  adminIcon: {
    fontSize: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#2E86AB',
    fontSize: 16,
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 14,
  },
  footerNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  contactText: {
    color: '#2E86AB',
    fontWeight: 'bold',
  },
});
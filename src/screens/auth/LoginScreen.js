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
      // Navigation will be handled by auth state change
    } else {
      Alert.alert('Error', result.error || 'Login failed');
    }
  };

  const handleAdminLogin = async () => {
    // Use hard-coded admin credentials
    const adminUsername = 'admin';
    const adminPassword = 'admin';
    
    const result = await signIn(adminUsername, adminPassword, 'admin');
    
    if (result.success) {
      Alert.alert('Success', 'Welcome Administrator!');
      // Navigate to Admin Dashboard
      navigation.replace('AdminDashboard');
    } else {
      Alert.alert('Admin Login Failed', result.error || 'Invalid admin credentials');
    }
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
              style={styles.adminButton}
              onPress={handleAdminLogin}
              disabled={loading}
            >
              <Text style={styles.adminButtonText}>
                <Text style={styles.adminIcon}>⚙️ </Text>
                Administrator Login
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
  adminButton: {
    backgroundColor: '#dc3545', // Red for admin
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
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
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminIcon: {
    fontSize: 16,
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
  contactText: {
    color: '#2E86AB',
    fontWeight: 'bold',
  },
});
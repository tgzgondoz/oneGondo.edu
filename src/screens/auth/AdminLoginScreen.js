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

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading } = useAuth();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const result = await signIn(email, password, 'admin');
    
    if (result.success) {
      Alert.alert('Success', 'Welcome Administrator!');
      // Navigation will be handled automatically by auth state change
    } else {
      Alert.alert('Admin Login Failed', result.error || 'Invalid admin credentials');
    }
  };

  const goBackToStudentLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Administrator Login</Text>
            <Text style={styles.subtitle}>Restricted Access</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Admin Credentials</Text>
            <Text style={styles.warningText}>
              ⚠️ This area is restricted to authorized personnel only.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              placeholderTextColor="#6c757d"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Admin Password"
              placeholderTextColor="#6c757d"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {/* Admin Login Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.adminButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleAdminLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Sign In as Admin'}
              </Text>
            </TouchableOpacity>

            {/* Back to Student Login */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={goBackToStudentLogin}
            >
              <Text style={styles.backButtonText}>← Back to Student Login</Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Admin Access Instructions:</Text>
              <Text style={styles.instructionsText}>
                1. Use your admin email and password{'\n'}
                2. Your account must have 'admin' role in the system{'\n'}
                3. Contact system administrator if you need access
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2024 oneGondo.edu - Administration Portal
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
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  warningText: {
    color: '#dc3545',
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginVertical: 8,
    fontSize: 16,
    borderColor: '#dc3545',
  },
  button: {
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
  adminButton: {
    backgroundColor: '#dc3545',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  backButtonText: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: '#e8f4fc',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#d1e8ff',
  },
  instructionsTitle: {
    color: '#2E86AB',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  instructionsText: {
    color: '#495057',
    fontSize: 14,
    lineHeight: 20,
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
});
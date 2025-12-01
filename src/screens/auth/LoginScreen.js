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

    const result = await signIn(email, password, 'admin');
    
    if (result.success) {
      Alert.alert('Success', 'Welcome back, Administrator!');
    } else {
      Alert.alert('Error', result.error || 'Login failed');
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
            <Text style={styles.subtitle}>Administrator Portal</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.formSubtitle}>Access your dashboard</Text>

            {/* Email and Password Fields */}
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
                styles.adminButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Admin Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Demo notice */}
            <View style={styles.demoNotice}>
              <Text style={styles.demoNoticeText}>
                Use admin credentials to access the dashboard
              </Text>
            </View>

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
    marginTop: 64,
    marginBottom: 48,
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
  adminButton: {
    backgroundColor: '#dc3545', // Red for admin
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  demoNotice: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  demoNoticeText: {
    color: '#155724',
    fontSize: 12,
    textAlign: 'center',
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
  },
  footerText: {
    textAlign: 'center',
    color: '#6c757d',
  },
  contactText: {
    color: '#2E86AB',
    fontWeight: 'bold',
  },
});
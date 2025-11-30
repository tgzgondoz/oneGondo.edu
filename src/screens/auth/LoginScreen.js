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
  const [code, setCode] = useState('');
  const [loginType, setLoginType] = useState('student'); // 'student' or 'admin'
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    if (loginType === 'admin') {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
    } else {
      if (!code || code.length !== 4) {
        Alert.alert('Error', 'Please enter a valid 4-digit code');
        return;
      }
    }

    // Add login type to the signIn call
    const result = await signIn(
      loginType === 'admin' ? email : code, 
      loginType === 'admin' ? password : null, 
      loginType
    );
    
    if (result.success) {
      const welcomeMessage = loginType === 'admin' 
        ? 'Welcome back, Administrator!' 
        : 'Welcome back!';
      Alert.alert('Success', welcomeMessage);
      
      // Navigation will be handled by the AuthContext based on user type
    } else {
      Alert.alert('Error', result.error || 'Login failed');
    }
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    // Clear fields when switching login type
    setEmail('');
    setPassword('');
    setCode('');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>

            {/* Login Type Selector */}
            <View style={styles.loginTypeContainer}>
              <TouchableOpacity 
                style={[
                  styles.loginTypeButton, 
                  loginType === 'student' && styles.loginTypeButtonActive
                ]}
                onPress={() => handleLoginTypeChange('student')}
              >
                <Text style={[
                  styles.loginTypeText,
                  loginType === 'student' && styles.loginTypeTextActive
                ]}>
                  Student Sign In
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.loginTypeButton, 
                  loginType === 'admin' && styles.loginTypeButtonActive
                ]}
                onPress={() => handleLoginTypeChange('admin')}
              >
                <Text style={[
                  styles.loginTypeText,
                  loginType === 'admin' && styles.loginTypeTextActive
                ]}>
                  Admin Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {loginType === 'admin' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#6c757d"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6c757d"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Enter 4-digit Code"
                placeholderTextColor="#6c757d"
                value={code}
                onChangeText={(text) => {
                  // Allow only numbers and limit to 4 digits
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText.length <= 4) {
                    setCode(numericText);
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
              />
            )}

            {/* Dynamic Login Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                loginType === 'admin' ? styles.adminButton : styles.studentButton,
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading 
                  ? `Signing In...` 
                  : loginType === 'admin' ? 'Admin Sign In' : 'Student Sign In'
                }
              </Text>
            </TouchableOpacity>

            {/* Demo notice */}
            <View style={styles.demoNotice}>
              <Text style={styles.demoNoticeText}>
                {loginType === 'admin' 
                  ? 'Admin: Use admin credentials to access dashboard' 
                  : 'Student: Use your 4-digit access code'
                }
              </Text>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                {loginType === 'admin' ? 'Forgot Password?' : 'Lost your code?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text 
                style={styles.signUpText}
                onPress={() => navigation.navigate('Register')}
              >
                Sign Up
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
    marginBottom: 24,
  },
  loginTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  loginTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  loginTypeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  loginTypeTextActive: {
    color: '#2E86AB',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  studentButton: {
    backgroundColor: '#28a745', // Green for student
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
  signUpText: {
    color: '#2E86AB',
    fontWeight: 'bold',
  },
});
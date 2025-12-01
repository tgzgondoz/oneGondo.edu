import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Keyboard
} from 'react-native';
import { useAuth } from '../../components/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, loading } = useAuth();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      triggerShake();
      return;
    }

    // Dismiss keyboard
    Keyboard.dismiss();

    const result = await signIn(email, password, 'student');
    
    if (result.success) {
      Alert.alert('Welcome Back!', 'Successfully logged in to your learning dashboard.');
      // Navigation will be handled by auth state change
    } else {
      Alert.alert(
        'Login Failed',
        result.error || 'Unable to sign in. Please check your credentials.',
        [{ text: 'Try Again', style: 'cancel' }]
      );
      triggerShake();
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleAdminAccess = () => {
    navigation.navigate('AdminLogin');
  };

  const AnimatedView = Animated.createAnimatedComponent(View);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.headerGradient}>
          {!isKeyboardVisible && (
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoLetter}>G</Text>
                </View>
                <Text style={styles.logoText}>oneGondo.edu</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Premium Mobile Learning Experience
              </Text>
            </View>
          )}
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedView 
            style={[
              styles.content,
              {
                transform: [{ translateX: shakeAnimation }]
              }
            ]}
          >
            {isKeyboardVisible && (
              <View style={styles.compactHeader}>
                <Text style={styles.compactLogo}>oneGondo.edu</Text>
                <Text style={styles.compactSubtitle}>Student Login</Text>
              </View>
            )}

            <View style={styles.formContainer}>
              <Text style={styles.title}>
                Student Portal
              </Text>
              
              <Text style={styles.formSubtitle}>
                Enter your credentials to access your personalized learning dashboard
              </Text>

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Text style={styles.labelText}>Student Email</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    emailError ? styles.inputError : styles.inputNormal
                  ]}
                  placeholder="you@student.onegondo.edu"
                  placeholderTextColor="#adb5bd"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  onBlur={() => validateEmail(email)}
                />
                {emailError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>!</Text>
                    <Text style={styles.errorText}>{emailError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Text style={styles.labelText}>Password</Text>
                </View>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      passwordError ? styles.inputError : styles.inputNormal
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor="#adb5bd"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) validatePassword(text);
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    autoCapitalize="none"
                    onBlur={() => validatePassword(password)}
                    blurOnSubmit={false}
                  />
                  <View style={styles.eyeIconContainer} pointerEvents="box-none">
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {passwordError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>!</Text>
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.rowContainer}>
                <TouchableOpacity style={styles.rememberMe}>
                  <View style={styles.checkbox} />
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[
                  styles.button,
                  styles.studentButton,
                  loading && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In to Dashboard</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  New to oneGondo.edu?
                </Text>
                <TouchableOpacity 
                  style={styles.registerLinkContainer}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.registerLink}>Create Student Account</Text>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>
              </View>

              {/* Admin Access Button */}
              <TouchableOpacity 
                style={styles.adminAccessButton}
                onPress={handleAdminAccess}
                activeOpacity={0.7}
              >
                <View style={styles.adminIconContainer}>
                  <Text style={styles.adminIcon}>🔒</Text>
                </View>
                <View style={styles.adminTextContainer}>
                  <Text style={styles.adminAccessText}>
                    Faculty or Administrator Access
                  </Text>
                  <Text style={styles.adminSubtext}>
                    Click here for staff login
                  </Text>
                </View>
                <Text style={styles.chevronIcon}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            {!isKeyboardVisible && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Secure & Encrypted
                </Text>
                <Text style={styles.contactText}>
                  Support: 24/7 • support@onegondo.edu
                </Text>
                <Text style={styles.versionText}>
                  Version 2.1.4 • © 2024 oneGondo.edu
                </Text>
              </View>
            )}
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    backgroundColor: '#2E86AB',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoLetter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  compactHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  compactLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  compactSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  scrollView: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#6c757d',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    color: '#495057',
  },
  inputNormal: {
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 70,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
    marginLeft: 6,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6c757d',
    marginRight: 8,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    color: '#495057',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: '#2E86AB',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  studentButton: {
    backgroundColor: '#28a745',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  registerContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1e8ff',
    marginBottom: 20,
  },
  registerText: {
    color: '#495057',
    fontSize: 15,
    marginBottom: 8,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLink: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#2E86AB',
  },
  adminAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  adminIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  adminIcon: {
    fontSize: 20,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminAccessText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  adminSubtext: {
    color: '#6c757d',
    fontSize: 12,
  },
  chevronIcon: {
    fontSize: 24,
    color: '#6c757d',
    marginLeft: 8,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerText: {
    textAlign: 'center',
    color: '#28a745',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  contactText: {
    textAlign: 'center',
    color: '#495057',
    fontSize: 13,
    marginBottom: 6,
  },
  versionText: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 12,
  },
});
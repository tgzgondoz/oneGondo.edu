import React, { useState, useRef } from 'react';
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
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAuth } from '../../components/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const { signUp, loading } = useAuth();

  const scrollViewRef = useRef();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      triggerShake();
      return;
    }

    Keyboard.dismiss();
    
    const result = await signUp(
      formData.email, 
      formData.password
    );
    
    if (result.success) {
      Alert.alert(
        'Registration Successful!',
        'Welcome to oneGondo.edu! Your account has been created successfully.',
        [
          { 
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } else {
      Alert.alert(
        'Registration Failed',
        result.error || 'Unable to create account. Please try again.',
        [{ text: 'Try Again', style: 'cancel' }]
      );
      triggerShake();
    }
  };

  const handleLogin = () => navigation.navigate('Login');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="never"
            keyboardDismissMode="interactive"
          >
            {/* Header with time */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.timeText}>9:41</Text>
            </View>

            {/* Logo/Brand Section */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandText}>oneGondo.edu</Text>
            </View>

            {/* Main Content */}
            <Animated.View
              style={[
                styles.content,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              {/* Registration Form */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Create your Account</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.email && styles.inputError,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      autoCapitalize="none"
                    />
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
                  {errors.password && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.confirmPassword && styles.inputError,
                      ]}
                      placeholder="Confirm your password"
                      placeholderTextColor="#999"
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="password"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.eyeIcon}>
                        {showConfirmPassword ? 'HIDE' : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      formData.agreeToTerms && styles.checkboxChecked
                    ]}>
                      {formData.agreeToTerms && (
                        <Text style={styles.checkboxCheck}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to the{' '}
                      <Text style={styles.termsLink}>Terms & Conditions</Text>
                    </Text>
                  </TouchableOpacity>
                  {errors.agreeToTerms && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{errors.agreeToTerms}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign up</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or sign up with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Signup Buttons - Placeholder */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Text style={styles.socialButtonText}>Facebook</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account?</Text>
                  <TouchableOpacity
                    onPress={handleLogin}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  scrollView: { 
    flexGrow: 1 
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
  },
  timeText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  brandContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  brandText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  content: { 
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "600", 
    color: "#000", 
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: { 
    marginBottom: 20 
  },
  inputLabel: { 
    fontSize: 16, 
    fontWeight: "500", 
    color: "#333", 
    marginBottom: 8 
  },
  input: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#333",
  },
  inputNormal: { 
    borderColor: "#e0e0e0" 
  },
  inputError: { 
    borderColor: "#ff4444" 
  },
  passwordWrapper: { 
    position: "relative" 
  },
  passwordInput: { 
    paddingRight: 70 
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
    padding: 8,
  },
  eyeIcon: { 
    fontSize: 12, 
    color: "#666", 
    fontWeight: "600" 
  },
  errorContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 6 
  },
  errorText: { 
    color: "#ff4444", 
    fontSize: 13, 
    marginLeft: 6 
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#666",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  checkboxCheck: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  termsText: {
    flex: 1,
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: "#000",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: { 
    opacity: 0.7 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    color: "#666",
    fontSize: 14,
    marginHorizontal: 12,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  socialButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
    marginRight: 6,
  },
  loginLink: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
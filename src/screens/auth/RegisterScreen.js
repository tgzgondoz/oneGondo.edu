import React, { useState, useEffect, useRef } from 'react';
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

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
    phoneNumber: '',
    agreeToTerms: false,
    subscribeNewsletter: true
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { signUp, loading } = useAuth();

  const steps = ['Basic Info', 'Account Details', 'Confirmation'];

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

  useEffect(() => {
    calculatePasswordStrength(formData.password);
  }, [formData.password]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeStep * (width - 48) / 3,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [activeStep]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return '#28a745';
    if (passwordStrength >= 50) return '#ffc107';
    return '#dc3545';
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 50) {
      newErrors.password = 'Password is too weak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    if (!formData.agreeToTerms) {
      Alert.alert('Terms Required', 'You must agree to the Terms & Conditions');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (activeStep === 0 && validateStep1()) {
      setActiveStep(1);
    } else if (activeStep === 1 && validateStep2()) {
      setActiveStep(2);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegister = async () => {
    if (validateStep3()) {
      Keyboard.dismiss();
      
      const result = await signUp(
        formData.email, 
        formData.password, 
        formData.fullName,
        formData.studentId,
        formData.phoneNumber,
        formData.subscribeNewsletter
      );
      
      if (result.success) {
        Alert.alert(
          '🎉 Registration Successful!',
          'Welcome to oneGondo.edu! Your account has been created successfully.',
          [
            { 
              text: 'Explore Dashboard', 
              onPress: () => {
                // Navigation will be handled by auth state change
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          result.error || 'Unable to create account. Please try again.',
          [{ text: 'Try Again', style: 'cancel' }]
        );
      }
    }
  };

  // Simple Icon component using text/emojis
  const Icon = ({ name, size, color, style }) => {
    const iconMap = {
      'account-outline': '👤',
      'email-outline': '✉️',
      'card-account-details': '🆔',
      'phone-outline': '📱',
      'lock-outline': '🔒',
      'lock-check-outline': '🔐',
      'eye': '👁️',
      'eye-off': '👁️‍🗨️',
      'check-circle': '✅',
      'alert-circle': '⚠️',
      'arrow-left': '←',
      'arrow-right': '→',
      'school': '🏫',
      'account-check': '👤✅',
      'shield-check': '🛡️',
      'login': '🚪',
      'chevron-right': '›',
    };
    
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {iconMap[name] || '○'}
      </Text>
    );
  };

  // Simple Checkbox component
  const CheckBox = ({ value, onValueChange, color }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.checkbox,
          value && { backgroundColor: color || '#2E86AB', borderColor: color || '#2E86AB' }
        ]}
        onPress={() => onValueChange(!value)}
      >
        {value && <Text style={styles.checkboxCheck}>✓</Text>}
      </TouchableOpacity>
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= activeStep && styles.stepCircleActive
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= activeStep && styles.stepNumberActive
              ]}>
                {index + 1}
              </Text>
              {index === activeStep && <View style={styles.activePulse} />}
            </View>
            <Text style={[
              styles.stepLabel,
              index <= activeStep && styles.stepLabelActive
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            { 
              width: slideAnim,
              backgroundColor: getPasswordStrengthColor()
            }
          ]} 
        />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <Animated.View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about yourself to personalize your learning experience
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputWithIcon}>
          <Icon name="account-outline" size={24} color="#6c757d" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="Full Name (as per official documents)"
            placeholderTextColor="#adb5bd"
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWithIcon}>
          <Icon name="email-outline" size={24} color="#6c757d" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="University Email Address"
            placeholderTextColor="#adb5bd"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWithIcon}>
          <Icon name="card-account-details" size={24} color="#6c757d" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, errors.studentId && styles.inputError]}
            placeholder="Student ID Number"
            placeholderTextColor="#adb5bd"
            value={formData.studentId}
            onChangeText={(value) => handleInputChange('studentId', value)}
            keyboardType="number-pad"
          />
        </View>
        {errors.studentId && <Text style={styles.errorText}>{errors.studentId}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputWithIcon}>
          <Icon name="phone-outline" size={24} color="#6c757d" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number (Optional)"
            placeholderTextColor="#adb5bd"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Account Security</Text>
      <Text style={styles.stepDescription}>
        Create a strong password to protect your account
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.passwordContainer}>
          <Icon name="lock-outline" size={24} color="#6c757d" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
            placeholder="Create Password"
            placeholderTextColor="#adb5bd"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        
        {/* Password Strength Indicator */}
        {formData.password.length > 0 && (
          <View style={styles.passwordStrengthContainer}>
            <View style={styles.passwordStrengthBar}>
              <View 
                style={[
                  styles.passwordStrengthFill,
                  { 
                    width: `${passwordStrength}%`,
                    backgroundColor: getPasswordStrengthColor()
                  }
                ]} 
              />
            </View>
            <Text style={styles.passwordStrengthText}>
              Password Strength: {passwordStrength >= 75 ? 'Strong' : passwordStrength >= 50 ? 'Medium' : 'Weak'}
            </Text>
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementText}>✓ At least 8 characters</Text>
              <Text style={styles.requirementText}>✓ One uppercase letter</Text>
              <Text style={styles.requirementText}>✓ One number</Text>
              <Text style={styles.requirementText}>✓ One special character</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.passwordContainer}>
          <Icon name="lock-check-outline" size={24} color="#6c757d" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
            placeholder="Confirm Password"
            placeholderTextColor="#adb5bd"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
        {formData.password && formData.confirmPassword && 
         formData.password === formData.confirmPassword && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={16} color="#28a745" />
            <Text style={styles.successText}>Passwords match</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Almost There!</Text>
      <Text style={styles.stepDescription}>
        Review your information and agree to our terms
      </Text>

      <View style={styles.reviewContainer}>
        <View style={styles.reviewCard}>
          <Icon name="account-check" size={32} color="#2E86AB" style={styles.reviewIcon} />
          <Text style={styles.reviewTitle}>Account Summary</Text>
          
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Full Name:</Text>
            <Text style={styles.reviewValue}>{formData.fullName}</Text>
          </View>
          
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Student ID:</Text>
            <Text style={styles.reviewValue}>{formData.studentId}</Text>
          </View>
          
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Email:</Text>
            <Text style={styles.reviewValue}>{formData.email}</Text>
          </View>
          
          {formData.phoneNumber && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Phone:</Text>
              <Text style={styles.reviewValue}>{formData.phoneNumber}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.termsContainer}>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={formData.agreeToTerms}
            onValueChange={(value) => handleInputChange('agreeToTerms', value)}
            color={formData.agreeToTerms ? '#2E86AB' : undefined}
          />
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink} onPress={() => navigation.navigate('Privacy')}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        <View style={styles.checkboxContainer}>
          <CheckBox
            value={formData.subscribeNewsletter}
            onValueChange={(value) => handleInputChange('subscribeNewsletter', value)}
            color={formData.subscribeNewsletter ? '#2E86AB' : undefined}
          />
          <Text style={styles.termsText}>
            Subscribe to educational updates and campus news
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="check-circle" size={24} color="#fff" />
            <Text style={styles.registerButtonText}>Complete Registration</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.headerGradient}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Icon name="school" size={36} color="#fff" />
              <Text style={styles.logoText}>oneGondo.edu</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Join our learning community
            </Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {renderStepIndicator()}

            <View style={styles.formCard}>
              {activeStep === 0 && renderStep1()}
              {activeStep === 1 && renderStep2()}
              {activeStep === 2 && renderStep3()}

              {/* Navigation Buttons */}
              {activeStep < 2 && (
                <View style={styles.navigationButtons}>
                  {activeStep > 0 && (
                    <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                      <Icon name="arrow-left" size={20} color="#2E86AB" />
                      <Text style={styles.prevButtonText}>Previous</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.nextButton}
                    onPress={nextStep}
                    disabled={loading}
                  >
                    <Text style={styles.nextButtonText}>Continue</Text>
                    <Icon name="arrow-right" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Login Link */}
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                Already have an account?
              </Text>
              <TouchableOpacity 
                style={styles.loginLinkButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLinkText}>Sign In Here</Text>
                <Icon name="login" size={18} color="#2E86AB" />
              </TouchableOpacity>
            </View>

            {/* Security Badges */}
            {!isKeyboardVisible && (
              <View style={styles.securityBadges}>
                <View style={styles.badge}>
                  <Icon name="shield-check" size={16} color="#28a745" />
                  <Text style={styles.badgeText}>256-bit Encryption</Text>
                </View>
                <View style={styles.badge}>
                  <Icon name="lock-check" size={16} color="#28a745" />
                  <Text style={styles.badgeText}>Secure Registration</Text>
                </View>
              </View>
            )}
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  stepCircleActive: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
    shadowColor: '#2E86AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stepNumber: {
    color: '#6c757d',
    fontWeight: '700',
    fontSize: 16,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#2E86AB',
    fontWeight: '700',
  },
  activePulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E86AB',
    opacity: 0.3,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  stepContent: {
    minHeight: 300,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#6c757d',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 52,
    paddingVertical: 18,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    color: '#495057',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  passwordStrengthContainer: {
    marginTop: 12,
  },
  passwordStrengthBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  passwordStrengthText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  passwordRequirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementText: {
    fontSize: 11,
    color: '#6c757d',
    marginRight: 12,
    marginBottom: 4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 16,
  },
  successText: {
    color: '#28a745',
    fontSize: 13,
    marginLeft: 6,
  },
  reviewContainer: {
    marginBottom: 24,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  reviewIcon: {
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E86AB',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  reviewLabel: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewValue: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
  },
  termsContainer: {
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6c757d',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    color: '#495057',
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#2E86AB',
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E86AB',
    backgroundColor: '#fff',
  },
  prevButtonText: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#2E86AB',
    shadowColor: '#2E86AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginPromptText: {
    color: '#6c757d',
    fontSize: 15,
  },
  loginLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    padding: 8,
  },
  loginLinkText: {
    color: '#2E86AB',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 4,
  },
  securityBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  badgeText: {
    fontSize: 12,
    color: '#495057',
    marginLeft: 6,
    fontWeight: '500',
  },
});
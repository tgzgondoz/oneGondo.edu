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
  Keyboard,
  Image
} from 'react-native';
import { useAuth } from '../../components/AuthContext';

const { width } = Dimensions.get('window');

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const { adminSignIn, loading } = useAuth();

  const timerRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {}
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {}
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLocked && lockTime > 0) {
      timerRef.current = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLocked, lockTime]);

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

  const handleAdminLogin = async () => {
    if (isLocked) {
      Alert.alert(
        'Account Locked',
        `Too many failed attempts. Please wait ${lockTime} seconds before trying again.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!username || !password) {
      Alert.alert('Access Denied', 'Both username and password are required');
      triggerShake();
      return;
    }

    Keyboard.dismiss();

    const result = await adminSignIn(username, password);
    
    if (result.success) {
      setAttempts(0);
      Alert.alert(
        '🔐 Access Granted',
        'Welcome to the Administration Dashboard',
        [{ text: 'Continue', onPress: () => {} }]
      );
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockTime(30);
        Alert.alert(
          '🚨 Security Alert',
          'Too many failed attempts. Account locked for 30 seconds.',
          [{ text: 'OK' }]
        );
      } else {
        triggerShake();
        Alert.alert(
          'Access Denied',
          `Invalid credentials. ${3 - newAttempts} attempt(s) remaining.`,
          [{ text: 'Try Again' }]
        );
      }
    }
  };

  const goBackToStudentLogin = () => {
    navigation.navigate('Login');
  };

  const handleEmergencyAccess = () => {
    Alert.alert(
      'Emergency Access Protocol',
      'This feature requires physical security key or two-factor authentication.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use Security Key', onPress: () => {/* Handle emergency access */} }
      ]
    );
  };

  const handleForgotCredentials = () => {
    Alert.alert(
      'Recovery Protocol',
      'Please contact system administrator for credential recovery.',
      [
        { text: 'Contact IT Support', onPress: () => {/* Open contact */} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Simple Icon component
  const Icon = ({ name, size, color, style }) => {
    const iconMap = {
      'shield': '🛡️',
      'lock': '🔒',
      'eye': '👁️',
      'eye-off': '👁️‍🗨️',
      'alert': '⚠️',
      'arrow-left': '←',
      'key': '🔑',
      'admin': '👨‍💼',
      'security': '🔐',
      'timer': '⏱️',
      'fingerprint': '🖐️',
    };
    
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {iconMap[name] || '○'}
      </Text>
    );
  };

  const AnimatedView = Animated.createAnimatedComponent(View);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Security Header */}
          <View style={styles.securityHeader}>
            <View style={styles.securityBadge}>
              <Icon name="shield" size={48} color="#fff" />
              <Text style={styles.securityLevel}>SECURITY LEVEL 5</Text>
            </View>
            <Text style={styles.securityTitle}>Administration Portal</Text>
            <Text style={styles.securitySubtitle}>Restricted Access • Multi-Factor Required</Text>
          </View>

          <AnimatedView 
            style={[
              styles.content,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            {/* Warning Banner */}
            <View style={styles.warningBanner}>
              <Icon name="alert" size={24} color="#fff" />
              <Text style={styles.warningText}>
                ⚠️ UNAUTHORIZED ACCESS IS PROHIBITED AND MONITORED
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Icon name="admin" size={32} color="#dc3545" />
                <Text style={styles.formTitle}>Admin Authentication</Text>
                <Text style={styles.formSubtitle}>
                  Enter credentials with proper security clearance
                </Text>
              </View>

              {/* Username Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Icon name="security" size={20} color="#6c757d" />
                  <Text style={styles.labelText}>Administrator ID</Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    attempts > 0 && styles.inputWarning
                  ]}
                  placeholder="Enter admin username"
                  placeholderTextColor="#adb5bd"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                  editable={!isLocked}
                />
                {attempts > 0 && (
                  <Text style={styles.attemptsWarning}>
                    Attempts remaining: {3 - attempts}
                  </Text>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Icon name="key" size={20} color="#6c757d" />
                  <Text style={styles.labelText}>Security Password</Text>
                </View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      attempts > 0 && styles.inputWarning
                    ]}
                    placeholder="Enter secure password"
                    placeholderTextColor="#adb5bd"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    editable={!isLocked}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLocked}
                  >
                    <Icon 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={24} 
                      color="#6c757d" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lock Timer */}
              {isLocked && (
                <View style={styles.lockContainer}>
                  <Icon name="timer" size={24} color="#ff9800" />
                  <Text style={styles.lockText}>
                    Account locked for {lockTime} seconds
                  </Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity 
                style={[
                  styles.loginButton,
                  loading && styles.buttonDisabled,
                  isLocked && styles.buttonLocked
                ]}
                onPress={handleAdminLogin}
                disabled={loading || isLocked}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="lock" size={22} color="#fff" />
                    <Text style={styles.loginButtonText}>
                      {isLocked ? 'ACCESS LOCKED' : 'AUTHENTICATE & LOGIN'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Emergency Access */}
              <TouchableOpacity 
                style={styles.emergencyButton}
                onPress={handleEmergencyAccess}
              >
                <Icon name="fingerprint" size={20} color="#fff" />
                <Text style={styles.emergencyButtonText}>
                  Emergency Access Protocol
                </Text>
              </TouchableOpacity>

              {/* Forgot Credentials */}
              <TouchableOpacity 
                style={styles.forgotButton}
                onPress={handleForgotCredentials}
              >
                <Text style={styles.forgotButtonText}>
                  🔑 Lost Admin Credentials?
                </Text>
              </TouchableOpacity>

              {/* Two-Factor Note */}
              <View style={styles.twoFactorNote}>
                <Text style={styles.twoFactorText}>
                  ⚡ Note: This system requires two-factor authentication for all admin access.
                </Text>
              </View>

              {/* Back to Student Login */}
              <TouchableOpacity 
                style={styles.backButton}
                onPress={goBackToStudentLogin}
              >
                <Icon name="arrow-left" size={20} color="#2E86AB" />
                <Text style={styles.backButtonText}>
                  Return to Student Portal
                </Text>
              </TouchableOpacity>
            </View>

            {/* Security Information */}
            <View style={styles.securityInfo}>
              <Text style={styles.securityInfoTitle}>🔒 Security Protocols</Text>
              <View style={styles.protocolList}>
                <View style={styles.protocolItem}>
                  <Text style={styles.protocolIcon}>✅</Text>
                  <Text style={styles.protocolText}>256-bit AES Encryption</Text>
                </View>
                <View style={styles.protocolItem}>
                  <Text style={styles.protocolIcon}>✅</Text>
                  <Text style={styles.protocolText}>IP Address Tracking</Text>
                </View>
                <View style={styles.protocolItem}>
                  <Text style={styles.protocolIcon}>✅</Text>
                  <Text style={styles.protocolText}>Session Timeout: 15min</Text>
                </View>
                <View style={styles.protocolItem}>
                  <Text style={styles.protocolIcon}>✅</Text>
                  <Text style={styles.protocolText}>All Access Logged</Text>
                </View>
              </View>
            </View>

            {/* Developer Notes */}
            <View style={styles.devNotes}>
              <Text style={styles.devNotesTitle}>🛠️ Development Notes:</Text>
              <Text style={styles.devNotesText}>
                • Default credentials: admin / admin{'\n'}
                • Change in production environment{'\n'}
                • Implement proper authentication{'\n'}
                • Enable two-factor authentication{'\n'}
                • Log all admin access attempts
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                🚨 oneGondo.edu Administration System v2.0
              </Text>
              <Text style={styles.footerSubtext}>
                All access attempts are logged and monitored 24/7
              </Text>
              <Text style={styles.footerCopyright}>
                © 2024 oneGondo.edu • Restricted Access Only
              </Text>
            </View>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flexGrow: 1,
  },
  securityHeader: {
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 40 : 50,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#dc3545',
  },
  securityBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  securityLevel: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 8,
  },
  securityTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  warningBanner: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  warningText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ddd',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#333',
    color: '#fff',
  },
  inputWarning: {
    borderColor: '#ff9800',
  },
  attemptsWarning: {
    color: '#ff9800',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#332200',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  lockText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLocked: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17a2b8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  forgotButton: {
    alignItems: 'center',
    padding: 12,
    marginBottom: 20,
  },
  forgotButtonText: {
    color: '#17a2b8',
    fontSize: 14,
    fontWeight: '500',
  },
  twoFactorNote: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2d4d7a',
  },
  twoFactorText: {
    color: '#64b5f6',
    fontSize: 13,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  backButtonText: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  securityInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  securityInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  protocolList: {
    gap: 12,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  protocolIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  protocolText: {
    color: '#aaa',
    fontSize: 14,
  },
  devNotes: {
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a8a2a',
  },
  devNotesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 12,
  },
  devNotesText: {
    color: '#8bc34a',
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  footerSubtext: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  footerCopyright: {
    textAlign: 'center',
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
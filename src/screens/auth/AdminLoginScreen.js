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

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shakeAnimation] = useState(new Animated.Value(0));
  const { adminSignIn, loading } = useAuth();

  const scrollViewRef = useRef();

  const validateForm = () => {
    let isValid = true;
    
    if (!username) {
      setUsernameError('Username is required');
      isValid = false;
    } else {
      setUsernameError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
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

  const handleAdminLogin = async () => {
    setUsernameError('');
    setPasswordError('');
    
    if (!validateForm()) {
      triggerShake();
      return;
    }

    Keyboard.dismiss();
    const result = await adminSignIn(username, password);
    
    if (result.success) {
      Alert.alert(
        'Access Granted',
        'Welcome to Admin Dashboard'
      );
    } else {
      Alert.alert(
        'Access Denied',
        result.error || 'Invalid admin credentials',
        [{ text: 'Try Again', style: 'cancel' }]
      );
      triggerShake();
    }
  };

  const handleStudentLogin = () => {
    navigation.navigate('Login');
  };

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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
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
              {/* Admin Login Form */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Administrator Login</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={[
                      styles.input,
                      usernameError && styles.inputError,
                    ]}
                    placeholder="Enter admin username"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (usernameError) setUsernameError('');
                    }}
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  {usernameError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{usernameError}</Text>
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
                        passwordError && styles.inputError,
                      ]}
                      placeholder="Enter admin password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleAdminLogin}
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
                  {passwordError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{passwordError}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleAdminLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Admin Login</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.studentLoginButton}
                  onPress={handleStudentLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.studentLoginText}>Student Login</Text>
                </TouchableOpacity>

               
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
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
  },
  brandContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
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
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 16,
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
  studentLoginButton: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  studentLoginText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  noteContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  noteText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});
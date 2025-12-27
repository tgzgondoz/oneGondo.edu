import React, { useState, useRef } from "react";
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
} from "react-native";
import { useAuth } from "../../components/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { signIn, loading } = useAuth();
  const [shakeAnimation] = useState(new Animated.Value(0));

  const scrollViewRef = useRef();
  const emailInputRef = useRef();
  const passwordInputRef = useRef();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
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
    setEmailError("");
    setPasswordError("");
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      triggerShake();
      return;
    }

    Keyboard.dismiss();
    const result = await signIn(email, password, "student");

    if (result.success) {
      Alert.alert(
        "Welcome Back!",
        "Successfully logged in to your learning dashboard."
      );
    } else {
      Alert.alert(
        "Login Failed",
        result.error || "Unable to sign in. Please check your credentials.",
        [{ text: "Try Again", style: "cancel" }]
      );
      triggerShake();
    }
  };

  const handleForgotPassword = () => navigation.navigate("ForgotPassword");
  const handleSignUp = () => navigation.navigate("Register");
  const handleAdminLogin = () => navigation.navigate("AdminLogin");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
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
              {/* Login Form */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Login to your Account</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    ref={emailInputRef}
                    style={[
                      styles.input,
                      emailError ? styles.inputError : styles.inputNormal,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) validateEmail(text);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    onBlur={() => validateEmail(email)}
                  />
                  {emailError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>!</Text>
                      <Text style={styles.errorText}>{emailError}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      ref={passwordInputRef}
                      style={[
                        styles.input,
                        styles.passwordInput,
                        passwordError ? styles.inputError : styles.inputNormal,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) validatePassword(text);
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      onBlur={() => validatePassword(password)}
                      blurOnSubmit={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? "HIDE" : "SHOW"}
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
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign in</Text>
                  )}
                </TouchableOpacity>

                {/* Admin Login Link */}
                <TouchableOpacity
                  onPress={handleAdminLogin}
                  style={styles.adminLinkContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.adminLinkText}>
                    Faculty or Administrator Login
                  </Text>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Or sign in with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons - Placeholder */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                    <Text style={styles.socialButtonText}>Facebook</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={handleSignUp}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signupLink}>Sign up</Text>
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
  adminLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  adminLinkText: {
    color: "#666",
    fontSize: 14,
    marginRight: 8,
  },
  arrowIcon: {
    fontSize: 16,
    color: "#666",
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
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  signupText: {
    color: "#666",
    fontSize: 14,
    marginRight: 6,
  },
  signupLink: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
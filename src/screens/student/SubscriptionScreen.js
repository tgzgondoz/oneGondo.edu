// src/screens/student/SubscriptionScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePaystack } from "react-native-paystack-webview";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth } from "firebase/auth";

export default function SubscriptionScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const db = getDatabase();
  const auth = getAuth();
  const user = auth.currentUser;

  const { popup } = usePaystack();

  const handlePaymentSuccess = async (response) => {
    setLoading(false);

    if (response.status === "success") {
      // Save subscription to Firebase
      const subscriptionRef = ref(db, `users/${user.uid}/subscription`);
      await set(subscriptionRef, {
        active: true,
        transactionRef: response.reference,
        subscribedDate: Date.now(),
        // 30 days subscription
        expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      Alert.alert(
        "Success! 🎉",
        "Your monthly subscription is now active. Enjoy full access to all courses!",
        [
          {
            text: "Start Learning",
            onPress: () => navigation.replace("CoursesMain"), // Go to courses
          },
        ]
      );
    } else {
      Alert.alert("Payment Failed", "Something went wrong. Please try again.");
    }
  };

  const startSubscription = () => {
    if (!user?.email) {
      Alert.alert("Error", "User email not found. Please log in again.");
      return;
    }

    setLoading(true);

    popup.checkout({
      email: user.email,
      amount: 100000, // ₦1000.00 in kobo (change to your price)
      reference: `sub_${Date.now()}_${user.uid}`,
      currency: "NGN",
      channels: ["card", "bank_transfer", "ussd", "qr", "mobile_money"],
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.uid,
          },
          {
            display_name: "Platform",
            variable_name: "platform",
            value: "oneGondo.edu Mobile",
          },
        ],
      },
      onSuccess: handlePaymentSuccess,
      onCancel: () => {
        setLoading(false);
        Alert.alert("Cancelled", "Payment was cancelled.");
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={80} color="#000" />
        <Text style={styles.title}>Unlock All Courses</Text>
        <Text style={styles.subtitle}>Subscribe to oneGondo.edu Premium</Text>

        <View style={styles.planCard}>
          <Text style={styles.planTitle}>Monthly Plan</Text>
          <Text style={styles.price}>₦1,000</Text>
          <Text style={styles.priceSub}>per month</Text>

          <View style={styles.benefits}>
            <Text style={styles.benefit}>
              ✓ Unlimited access to all courses
            </Text>
            <Text style={styles.benefit}>✓ New courses added monthly</Text>
            <Text style={styles.benefit}>✓ Progress tracking</Text>
            <Text style={styles.benefit}>✓ Download for offline</Text>
            <Text style={styles.benefit}>✓ Cancel anytime</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <TouchableOpacity
            style={styles.payButton}
            onPress={startSubscription}
          >
            <Text style={styles.payText}>Subscribe Now</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.terms}>
          By subscribing, you agree to our Terms of Service{"\n"}
          and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  title: { fontSize: 28, fontWeight: "bold", marginTop: 20 },
  subtitle: { fontSize: 18, color: "#666", marginBottom: 30 },
  planCard: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  planTitle: { fontSize: 20, fontWeight: "600", marginBottom: 10 },
  price: { fontSize: 48, fontWeight: "bold", color: "#000" },
  priceSub: { fontSize: 16, color: "#666", marginBottom: 20 },
  benefits: { width: "100%", marginTop: 10 },
  benefit: { fontSize: 16, marginVertical: 6, color: "#333" },
  payButton: {
    backgroundColor: "#000",
    width: "100%",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  payText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  terms: { fontSize: 12, color: "#999", textAlign: "center", marginTop: 30 },
});

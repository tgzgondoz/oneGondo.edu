import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const auth = getAuth();
  const db = getDatabase();
  const userId = auth.currentUser?.uid;

  // PayNow link from your HTML
  const PAYNOW_URL = 'https://www.paynow.co.zw/Payment/Link/?q=c2VhcmNoPXRnemdvbmRvenolNDBnbWFpbC5jb20mYW1vdW50PTEwLjAwJnJlZmVyZW5jZT1HMTAwMSZsPTE%3d';

  const subscriptionPlans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$9.99',
      description: 'Access all courses for one month',
      color: '#000'
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$99.99',
      description: 'Save 16% - Best value',
      color: '#000',
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime Access',
      price: '$299.99',
      description: 'One-time payment, never pay again',
      color: '#000'
    }
  ];

  useEffect(() => {
    // Set default selected plan
    if (subscriptionPlans.length > 0 && !selectedPlan) {
      setSelectedPlan(subscriptionPlans[1]); // Default to yearly plan
    }
  }, []);

  const handlePayment = async (plan) => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to make a payment');
      return;
    }

    setSelectedPlan(plan);
    
    Alert.alert(
      'Pay with PayNow',
      'Open payment page in:',
      [
        {
          text: 'WebView',
          onPress: () => setShowWebView(true)
        },
        {
          text: 'Browser',
          onPress: () => Linking.openURL(PAYNOW_URL)
            .catch(err => Alert.alert('Error', 'Cannot open browser'))
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handlePaymentSuccess = async () => {
    if (!userId || !selectedPlan) return;

    try {
      // Calculate expiry date
      const expiryDate = new Date();
      if (selectedPlan.id === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (selectedPlan.id === 'yearly') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (selectedPlan.id === 'lifetime') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      }

      // Save subscription to database
      const subscriptionRef = ref(db, `users/${userId}/subscription`);
      await set(subscriptionRef, {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        subscribedDate: Date.now(),
        expiryDate: expiryDate.getTime(),
        status: 'active'
      });

      setShowWebView(false);
      
      Alert.alert(
        'Payment Successful!',
        `You now have access to ${selectedPlan.name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Courses')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving subscription:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  const handleWebViewNavigation = (navState) => {
    const { url } = navState;
    
    // Check for success patterns
    if (url.includes('success') || url.includes('thank') || url.includes('confirmed')) {
      handlePaymentSuccess();
    }
    
    // Check for cancellation
    if (url.includes('cancel') || url.includes('error')) {
      setShowWebView(false);
      Alert.alert('Payment Cancelled', 'Payment was cancelled');
    }
  };

  if (showWebView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity onPress={() => setShowWebView(false)}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>PayNow Payment</Text>
        </View>
        <WebView
          source={{ uri: PAYNOW_URL }}
          onNavigationStateChange={handleWebViewNavigation}
          style={styles.webView}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Subscribe</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Choose Your Plan</Text>
          <Text style={styles.heroSubtitle}>Unlock all courses and features</Text>
        </View>

        <View style={styles.plansContainer}>
          {subscriptionPlans.map(plan => (
            <View key={plan.id} style={styles.planCard}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
              <Text style={styles.price}>{plan.price}</Text>
              
              <TouchableOpacity
                style={[styles.subscribeButton, { backgroundColor: plan.color }]}
                onPress={() => handlePayment(plan)}
              >
                <Text style={styles.subscribeButtonText}>Select Plan</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By subscribing, you agree to our Terms and Privacy Policy.
            Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  heroSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  plansContainer: {
    padding: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  subscribeButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 15,
  },
  webView: {
    flex: 1,
  },
});
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SignIn } from '@clerk/clerk-expo';
import { useAuth } from '../../components/AuthContext';

export default function ClerkSignInScreen() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SignIn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
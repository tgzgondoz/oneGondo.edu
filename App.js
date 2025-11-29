// App.js
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import Dashboard from './src/screens/Dashboard';
import Students from './src/screens/Students';
import StudentProfile from './src/screens/StudentProfile';
import Courses from './src/screens/Courses';
import Tests from './src/screens/Tests';
import Tutorials from './src/screens/Tutorials';
import Uploads from './src/screens/Uploads';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Dashboard">
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Students" component={Students} />
          <Stack.Screen name="StudentProfile" component={StudentProfile} />
          <Stack.Screen name="Courses" component={Courses} />
          <Stack.Screen name="Tests" component={Tests} />
          <Stack.Screen name="Tutorials" component={Tutorials} />
          <Stack.Screen name="Uploads" component={Uploads} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}
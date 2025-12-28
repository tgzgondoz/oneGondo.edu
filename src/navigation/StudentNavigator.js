import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DashboardScreen from '../screens/student/DashboardScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import CoursesScreen from '../screens/student/CoursesScreen';
import CourseDetailScreen from '../screens/student/CourseDetailScreen';
import CourseMaterialsScreen from '../screens/student/CourseMaterialsScreen';
import QuizAttemptsScreen from '../screens/student/QuizAttemptsScreen';
import TakeQuizScreen from '../screens/student/TakeQuizScreen';
import QuizResultsScreen from '../screens/student/QuizResultsScreen';
import VideoPlayerScreen from '../screens/student/VideoPlayerScreen';
import PaymentScreen from '../screens/student/PaymentScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Courses Stack Navigator
function CoursesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="CoursesMain" 
        component={CoursesScreen} 
      />
      <Stack.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen} 
      />
      <Stack.Screen 
        name="CourseMaterials" 
        component={CourseMaterialsScreen} 
      />
      <Stack.Screen 
        name="QuizAttempts" 
        component={QuizAttemptsScreen} 
      />
      <Stack.Screen 
        name="TakeQuiz" 
        component={TakeQuizScreen} 
      />
      <Stack.Screen 
        name="QuizResults" 
        component={QuizResultsScreen} 
      />
      <Stack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen} 
      />
    </Stack.Navigator>
  );
}

// Profile Stack Navigator - Now includes Payment screen
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{
          headerShown: true,
          title: 'Subscribe',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Main Student Bottom Tab Navigator
export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />

      <Tab.Screen 
        name="Courses" 
        component={CoursesStack} 
        options={{ title: 'Courses' }}
      />

      <Tab.Screen 
        name="Profile" 
        component={ProfileStack} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens - CORRECTED PATHS based on file structure
import DashboardScreen from '../screens/student/DashboardScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import CoursesScreen from '../screens/student/CoursesScreen';
import CourseDetailScreen from '../screens/student/CourseDetailScreen';
import CourseMaterialsScreen from '../screens/student/CourseMaterialsScreen';
import QuizAttemptsScreen from '../screens/student/QuizAttemptsScreen';
import TakeQuizScreen from '../screens/student/TakeQuizScreen';
import QuizResultsScreen from '../screens/student/QuizResultsScreen';
import VideoPlayerScreen from '../screens/student/VideoPlayerScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Courses Stack Navigator
function CoursesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CoursesMain" 
        component={CoursesScreen} 
        options={{ 
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen} 
        options={({ route }) => ({ 
          title: route.params?.courseTitle || 'Course Details',
        })}
      />
      <Stack.Screen 
        name="CourseMaterials" 
        component={CourseMaterialsScreen} 
        options={{ 
          title: 'Course Materials',
        }}
      />
      <Stack.Screen 
        name="QuizAttempts" 
        component={QuizAttemptsScreen} 
        options={{ 
          title: 'Quizzes & Tests',
        }}
      />
      <Stack.Screen 
        name="TakeQuiz" 
        component={TakeQuizScreen} 
        options={({ route }) => ({ 
          title: route.params?.quizTitle || 'Take Quiz',
        })}
      />
      <Stack.Screen 
        name="QuizResults" 
        component={QuizResultsScreen} 
        options={{ 
          title: 'Quiz Results',
        }}
      />
      <Stack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || 'Video Player',
        })}
      />
    </Stack.Navigator>
  );
}

// Main Student Navigator
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
        tabBarActiveTintColor: '#2E86AB',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
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
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
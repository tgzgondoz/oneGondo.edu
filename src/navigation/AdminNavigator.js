// navigation/AdminNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import CourseManagementScreen from '../screens/admin/CourseManagementScreen';
import CreateCourseScreen from '../screens/admin/CreateCourseScreen';

const Tab = createBottomTabNavigator();
const CourseStack = createStackNavigator();
const DashboardStack = createStackNavigator();

// Stack Navigator for Dashboard with additional screens
function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen 
        name="DashboardMain" 
        component={AdminDashboardScreen}
      />
      {/* Add other dashboard-related screens here if needed */}
    </DashboardStack.Navigator>
  );
}

// Stack Navigator for Courses with CreateCourseScreen
function CourseStackNavigator() {
  return (
    <CourseStack.Navigator screenOptions={{ headerShown: false }}>
      <CourseStack.Screen 
        name="CourseManagementMain" 
        component={CourseManagementScreen}
      />
      <CourseStack.Screen 
        name="CreateCourse" 
        component={CreateCourseScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
    </CourseStack.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'library' : 'library-outline';
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
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={UserManagementScreen}
        options={{
          tabBarLabel: 'Users',
          headerShown: true,
          headerTitle: 'User Management',
          headerStyle: {
            backgroundColor: '#2E86AB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Tab.Screen 
        name="Courses" 
        component={CourseStackNavigator}
        options={{
          tabBarLabel: 'Courses',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerShown: true,
          headerTitle: 'Admin Profile',
          headerStyle: {
            backgroundColor: '#2E86AB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Tab.Navigator>
  );
}
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
import AddSectionScreen from '../screens/admin/AddSectionScreen';
import EditLessonScreen from '../screens/admin/EditLessonScreen';

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

// Stack Navigator for Courses with CreateCourseScreen and AddSectionScreen
function CourseStackNavigator() {
  return (
    <CourseStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
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
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
      <CourseStack.Screen 
        name="AddSection" 
        component={AddSectionScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
      <CourseStack.Screen 
        name="EditLesson" 
        component={EditLessonScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 0.5, 0.9, 1],
                outputRange: [0, 0.25, 0.7, 1],
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          }),
        }}
      />
    </CourseStack.Navigator>
  );
}

// Stack Navigator for User Management
function UserStackNavigator() {
  return (
    <CourseStack.Navigator screenOptions={{ headerShown: false }}>
      <CourseStack.Screen 
        name="UserManagementMain" 
        component={UserManagementScreen}
      />
    </CourseStack.Navigator>
  );
}

// Stack Navigator for Profile
function ProfileStackNavigator() {
  return (
    <CourseStack.Navigator screenOptions={{ headerShown: false }}>
      <CourseStack.Screen 
        name="ProfileMain" 
        component={AdminProfileScreen}
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
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 5,
        },
        tabBarIconStyle: {
          marginTop: 5,
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
        component={UserStackNavigator}
        options={{
          tabBarLabel: 'Users',
          headerShown: false,
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
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}
// src/screens/Dashboard.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Dashboard = () => {
  const navigation = useNavigation();

  const features = [
    {
      title: 'Students',
      description: 'Manage student profiles and progress',
      icon: '👨‍🎓',
      screen: 'Students',
      color: 'bg-blue-500'
    },
    {
      title: 'Courses',
      description: 'View and manage course offerings',
      icon: '📚',
      screen: 'Courses',
      color: 'bg-green-500'
    },
    {
      title: 'Tests',
      description: 'Create and manage assessments',
      icon: '📝',
      screen: 'Tests',
      color: 'bg-purple-500'
    },
    {
      title: 'Tutorials',
      description: 'Educational resources and materials',
      icon: '🎓',
      screen: 'Tutorials',
      color: 'bg-orange-500'
    },
    {
      title: 'Uploads',
      description: 'Share files and documents',
      icon: '📁',
      screen: 'Uploads',
      color: 'bg-red-500'
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text mb-2">
          College Management System
        </Text>
        <Text className="text-lg text-gray-600">
          Welcome, Tutor! Manage your students and courses efficiently.
        </Text>
      </View>

      <View className="space-y-4">
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            className={`p-6 rounded-2xl ${feature.color} shadow-lg`}
            onPress={() => navigation.navigate(feature.screen)}
          >
            <View className="flex-row items-center">
              <Text className="text-3xl mr-4">{feature.icon}</Text>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-1">
                  {feature.title}
                </Text>
                <Text className="text-white text-opacity-90">
                  {feature.description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Stats */}
      <View className="mt-8 bg-card p-6 rounded-2xl shadow-sm">
        <Text className="text-xl font-bold text-text mb-4">Quick Stats</Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">45</Text>
            <Text className="text-gray-600">Students</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-accent">12</Text>
            <Text className="text-gray-600">Courses</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-purple-500">8</Text>
            <Text className="text-gray-600">Tests</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-orange-500">15</Text>
            <Text className="text-gray-600">Tutorials</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Dashboard;
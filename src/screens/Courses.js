// src/screens/Courses.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const Courses = () => {
  const courses = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      code: 'MATH401',
      students: 25,
      duration: 'Spring 2024',
      instructor: 'Dr. Smith',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Computer Science Fundamentals',
      code: 'CS101',
      students: 45,
      duration: 'Spring 2024',
      instructor: 'Prof. Johnson',
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Physics for Engineers',
      code: 'PHY301',
      students: 30,
      duration: 'Spring 2024',
      instructor: 'Dr. Davis',
      color: 'bg-purple-500'
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-text mb-2">Courses</Text>
        <Text className="text-gray-600">Manage your course offerings</Text>
      </View>

      <View className="space-y-4">
        {courses.map((course) => (
          <View key={course.id} className="bg-card p-6 rounded-2xl shadow-sm">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <Text className="text-lg font-bold text-text mb-1">
                  {course.title}
                </Text>
                <Text className="text-gray-600 text-sm mb-2">
                  {course.code} • {course.duration}
                </Text>
                <Text className="text-gray-600 text-sm">
                  Instructor: {course.instructor}
                </Text>
              </View>
              <View className={`w-12 h-12 ${course.color} rounded-full items-center justify-center`}>
                <Text className="text-white font-bold">
                  {course.title.split(' ').map(word => word[0]).join('')}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center mt-4">
              <View className="flex-row items-center">
                <Text className="text-gray-600 mr-2">Students:</Text>
                <Text className="font-bold text-text">{course.students}</Text>
              </View>
              <View className="flex-row space-x-2">
                <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg">
                  <Text className="text-white text-sm font-medium">View</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-lg">
                  <Text className="text-text text-sm font-medium">Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity className="bg-primary p-4 rounded-xl mt-6 shadow-lg">
        <Text className="text-white text-center font-bold text-lg">
          Create New Course
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Courses;

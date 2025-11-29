// src/screens/StudentProfile.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const StudentProfile = ({ route }) => {
  const { student } = route.params;

  const testAttempts = [
    { id: 1, testName: 'Midterm Exam', score: 85, date: '2024-01-15', status: 'Completed' },
    { id: 2, testName: 'Quiz 1', score: 92, date: '2024-01-08', status: 'Completed' },
    { id: 3, testName: 'Final Project', score: 78, date: '2024-01-22', status: 'Completed' },
  ];

  const notes = [
    { id: 1, title: 'Algebra Notes', date: '2024-01-10', type: 'PDF' },
    { id: 2, title: 'Calculus Formulas', date: '2024-01-12', type: 'DOC' },
    { id: 3, title: 'Physics Lab Guide', date: '2024-01-18', type: 'PDF' },
  ];

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Student Header */}
      <View className="bg-card p-6 rounded-2xl shadow-sm mb-4">
        <View className="items-center mb-4">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">
              {student.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-text">{student.name}</Text>
          <Text className="text-gray-600">{student.email}</Text>
        </View>
        
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-lg font-bold text-text">{student.course}</Text>
            <Text className="text-gray-600">Course</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-text">{student.year}</Text>
            <Text className="text-gray-600">Year</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-text">{student.performance}</Text>
            <Text className="text-gray-600">Grade</Text>
          </View>
        </View>
      </View>

      {/* Test Attempts */}
      <View className="bg-card p-4 rounded-xl shadow-sm mb-4">
        <Text className="text-xl font-bold text-text mb-3">Test Attempts</Text>
        <View className="space-y-3">
          {testAttempts.map((test) => (
            <View key={test.id} className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <View className="flex-1">
                <Text className="font-semibold text-text">{test.testName}</Text>
                <Text className="text-gray-600 text-sm">{test.date}</Text>
              </View>
              <View className="items-end">
                <Text className={`font-bold ${
                  test.score >= 90 ? 'text-green-600' :
                  test.score >= 80 ? 'text-blue-600' :
                  test.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {test.score}%
                </Text>
                <Text className="text-gray-500 text-sm">{test.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Notes & Materials */}
      <View className="bg-card p-4 rounded-xl shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-bold text-text">Notes & Materials</Text>
          <TouchableOpacity className="bg-primary px-3 py-1 rounded-full">
            <Text className="text-white text-sm">Add Note</Text>
          </TouchableOpacity>
        </View>
        <View className="space-y-3">
          {notes.map((note) => (
            <View key={note.id} className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <View className="flex-1">
                <Text className="font-semibold text-text">{note.title}</Text>
                <Text className="text-gray-600 text-sm">{note.date}</Text>
              </View>
              <View className="bg-blue-100 px-2 py-1 rounded">
                <Text className="text-blue-800 text-sm font-medium">{note.type}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-3 mt-6">
        <TouchableOpacity className="flex-1 bg-accent p-4 rounded-xl">
          <Text className="text-white text-center font-bold">Send Message</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-primary p-4 rounded-xl">
          <Text className="text-white text-center font-bold">Assign Test</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StudentProfile;
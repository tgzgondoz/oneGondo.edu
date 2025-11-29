// src/screens/Students.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Students = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const students = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@college.edu',
      course: 'Computer Science',
      year: '3rd Year',
      performance: 'A',
      testsCompleted: 12,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@college.edu',
      course: 'Mathematics',
      year: '2nd Year',
      performance: 'B+',
      testsCompleted: 8,
    },
    {
      id: 3,
      name: 'Mike Chen',
      email: 'mike.chen@college.edu',
      course: 'Physics',
      year: '4th Year',
      performance: 'A-',
      testsCompleted: 15,
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.davis@college.edu',
      course: 'Chemistry',
      year: '1st Year',
      performance: 'B',
      testsCompleted: 5,
    },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-text mb-2">Students</Text>
        <Text className="text-gray-600">Manage and view student profiles</Text>
      </View>

      {/* Search Bar */}
      <View className="bg-card p-4 rounded-xl mb-4 shadow-sm">
        <TextInput
          placeholder="Search students by name or course..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-gray-100 p-3 rounded-lg"
        />
      </View>

      {/* Students List */}
      <View className="space-y-3">
        {filteredStudents.map((student) => (
          <TouchableOpacity
            key={student.id}
            className="bg-card p-4 rounded-xl shadow-sm border border-border"
            onPress={() => navigation.navigate('StudentProfile', { student })}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-text mb-1">
                  {student.name}
                </Text>
                <Text className="text-gray-600 text-sm mb-1">
                  {student.email}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {student.course} • {student.year}
                </Text>
              </View>
              <View className="items-end">
                <View className={`px-3 py-1 rounded-full ${
                  student.performance === 'A' ? 'bg-green-100' :
                  student.performance === 'A-' ? 'bg-green-50' :
                  student.performance === 'B+' ? 'bg-blue-100' : 'bg-yellow-100'
                }`}>
                  <Text className={`font-bold ${
                    student.performance === 'A' ? 'text-green-800' :
                    student.performance === 'A-' ? 'text-green-700' :
                    student.performance === 'B+' ? 'text-blue-800' : 'text-yellow-800'
                  }`}>
                    {student.performance}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm mt-1">
                  {student.testsCompleted} tests
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Student Button */}
      <TouchableOpacity className="bg-primary p-4 rounded-xl mt-6 shadow-lg">
        <Text className="text-white text-center font-bold text-lg">
          Add New Student
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Students;
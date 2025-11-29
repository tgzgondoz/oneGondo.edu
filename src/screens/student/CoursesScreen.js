import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CoursesScreen() {
  const courses = [
    { 
      id: 1, 
      title: 'Mathematics 101', 
      instructor: 'Dr. Smith',
      progress: 75, 
      icon: 'calculator',
      duration: '12 weeks',
      enrolled: true
    },
    { 
      id: 2, 
      title: 'Science Fundamentals', 
      instructor: 'Dr. Johnson',
      progress: 50, 
      icon: 'flask',
      duration: '10 weeks',
      enrolled: true
    },
    { 
      id: 3, 
      title: 'English Literature', 
      instructor: 'Prof. Davis',
      progress: 30, 
      icon: 'book',
      duration: '8 weeks',
      enrolled: true
    },
    { 
      id: 4, 
      title: 'Computer Science', 
      instructor: 'Dr. Wilson',
      progress: 90, 
      icon: 'code',
      duration: '14 weeks',
      enrolled: true
    },
    { 
      id: 5, 
      title: 'History of Art', 
      instructor: 'Prof. Brown',
      progress: 0, 
      icon: 'color-palette',
      duration: '6 weeks',
      enrolled: false
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>My Courses</Text>
          <Text style={styles.subtitle}>Continue your learning journey</Text>
        </View>

        <View style={styles.coursesContainer}>
          {courses.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseIcon}>
                  <Ionicons name={course.icon} size={24} color="#2E86AB" />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseInstructor}>{course.instructor}</Text>
                  <Text style={styles.courseDuration}>{course.duration}</Text>
                </View>
                <View style={[
                  styles.enrollmentBadge,
                  course.enrolled ? styles.enrolled : styles.notEnrolled
                ]}>
                  <Text style={styles.enrollmentText}>
                    {course.enrolled ? 'Enrolled' : 'Available'}
                  </Text>
                </View>
              </View>
              
              {course.enrolled && (
                <View style={styles.progressSection}>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${course.progress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{course.progress}%</Text>
                  </View>
                  <TouchableOpacity style={styles.continueButton}>
                    <Text style={styles.continueButtonText}>
                      {course.progress > 0 ? 'Continue' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  coursesContainer: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  courseDuration: {
    fontSize: 12,
    color: '#2E86AB',
    marginTop: 2,
  },
  enrollmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  enrolled: {
    backgroundColor: '#d4edda',
  },
  notEnrolled: {
    backgroundColor: '#fff3cd',
  },
  enrollmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#2E86AB',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
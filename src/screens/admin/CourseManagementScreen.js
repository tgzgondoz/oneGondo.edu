// screens/admin/CourseManagementScreen.js (using Realtime Database)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, remove, get } from 'firebase/database';

export default function CourseManagementScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const db = getDatabase();

  const fetchCourses = async () => {
    try {
      const coursesRef = ref(db, 'courses');
      onValue(coursesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const courseList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setCourses(courseList);
        } else {
          setCourses([]);
        }
        setLoading(false);
        setRefreshing(false);
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    
    // Cleanup listener on unmount
    return () => {
      // Firebase automatically cleans up listeners
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const deleteCourse = async (courseId) => {
    try {
      Alert.alert(
        'Delete Course',
        'Are you sure you want to delete this course?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await remove(ref(db, `courses/${courseId}`));
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting course:', error);
      Alert.alert('Error', 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E86AB']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Course Management</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateCourse')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Course</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coursesContainer}>
          {courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={64} color="#6c757d" />
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubText}>
                Tap "Add Course" to create your first course
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreateCourse')}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Create First Course</Text>
              </TouchableOpacity>
            </View>
          ) : (
            courses.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseInstructor}>
                    Instructor: {course.instructor || 'Not specified'}
                  </Text>
                  <Text style={styles.courseDetails}>
                    {course.enrolledStudents || 0} students • {course.duration || 'N/A'}
                    {course.price ? ` • $${course.price}` : ' • Free'}
                  </Text>
                  <View style={[styles.status, styles[course.status || 'active']]}>
                    <Text style={styles.statusText}>
                      {course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Active'}
                    </Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CreateCourse', { courseId: course.id })}
                  >
                    <Ionicons name="create-outline" size={20} color="#2E86AB" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => deleteCourse(course.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... keep all the styles from before ...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  coursesContainer: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseInfo: {
    flex: 1,
    marginRight: 10,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  courseDetails: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 8,
  },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  active: {
    backgroundColor: '#d4edda',
  },
  draft: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
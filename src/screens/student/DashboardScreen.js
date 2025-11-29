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

export default function DashboardScreen({ navigation }) {
  const courses = [
    { id: 1, title: 'Mathematics 101', progress: 75, icon: 'calculator' },
    { id: 2, title: 'Science Fundamentals', progress: 50, icon: 'flask' },
    { id: 3, title: 'English Literature', progress: 30, icon: 'book' },
    { id: 4, title: 'Computer Science', progress: 90, icon: 'code' },
  ];

  const announcements = [
    { id: 1, title: 'Exam Schedule', date: '2024-01-15', icon: 'calendar' },
    { id: 2, title: 'New Course Available', date: '2024-01-10', icon: 'megaphone' },
    { id: 3, title: 'Holiday Notice', date: '2024-01-05', icon: 'alert-circle' },
  ];

  const handleCoursePress = (courseId) => {
    navigation.navigate('Courses');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, Student!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color="#2E86AB" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#2E86AB" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#2E86AB" />
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </View>
        </View>

        {/* Ongoing Courses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ongoing Courses</Text>
          {courses.map((course) => (
            <TouchableOpacity 
              key={course.id} 
              style={styles.courseCard}
              onPress={() => handleCoursePress(course.id)}
            >
              <View style={styles.courseHeader}>
                <Ionicons name={course.icon} size={24} color="#2E86AB" />
                <Text style={styles.courseTitle}>{course.title}</Text>
              </View>
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.map((announcement) => (
            <TouchableOpacity key={announcement.id} style={styles.announcementCard}>
              <Ionicons name={announcement.icon} size={20} color="#6c757d" />
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementDate}>{announcement.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6c757d" />
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
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
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  announcementCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementContent: {
    flex: 1,
    marginLeft: 10,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  announcementDate: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
});
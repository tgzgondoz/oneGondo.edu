import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function DashboardScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Student');

  const db = getDatabase();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user data
      if (userId) {
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setUserName(userData.name || userData.email?.split('@')[0] || 'Student');
        }
      }

      // Load enrolled courses
      if (userId) {
        const enrolledRef = ref(db, `users/${userId}/enrolledCourses`);
        const enrolledSnapshot = await get(enrolledRef);
        
        if (enrolledSnapshot.exists()) {
          const enrolledData = enrolledSnapshot.val();
          const coursesArray = [];
          let completedCourses = 0;
          let totalHours = 0;

          // Load course details for each enrolled course
          for (const [courseId, enrollment] of Object.entries(enrolledData)) {
            const courseRef = ref(db, `courses/${courseId}`);
            const courseSnapshot = await get(courseRef);
            
            if (courseSnapshot.exists()) {
              const courseData = courseSnapshot.val();
              
              // Load progress
              const progressRef = ref(db, `users/${userId}/progress/${courseId}`);
              const progressSnapshot = await get(progressRef);
              
              let progress = 0;
              if (progressSnapshot.exists()) {
                const progressData = progressSnapshot.val();
                progress = progressData.overallProgress || 0;
                
                if (progress >= 100) {
                  completedCourses++;
                }
              }

              // Calculate course hours
              const courseHours = courseData.totalHours || 
                (courseData.duration ? parseInt(courseData.duration) : 0);
              totalHours += courseHours;

              coursesArray.push({
                id: courseId,
                title: courseData.title || 'Untitled Course',
                progress: progress,
                instructor: courseData.instructor,
                icon: getCourseIcon(courseData),
                courseHours: courseHours
              });
            }
          }

          setCourses(coursesArray);
          setStats(prev => ({
            ...prev,
            totalCourses: coursesArray.length,
            completedCourses: completedCourses,
            totalHours: totalHours,
            certificates: completedCourses
          }));
        }
      }

      // Load announcements
      const announcementsRef = ref(db, 'announcements');
      const announcementsSnapshot = await get(announcementsRef);
      
      if (announcementsSnapshot.exists()) {
        const announcementsData = announcementsSnapshot.val();
        const announcementsArray = Object.keys(announcementsData).map(key => ({
          id: key,
          ...announcementsData[key]
        })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3); // Get latest 3
        
        setAnnouncements(announcementsArray);
      } else {
        // Default announcements if none in database
        setAnnouncements([
          { id: 1, title: 'Welcome to Learning Platform', date: new Date().toISOString().split('T')[0], icon: 'megaphone', description: 'Start your learning journey today!' },
          { id: 2, title: 'New Features Added', date: '2024-01-10', icon: 'rocket', description: 'Check out the new course materials section' },
          { id: 3, title: 'System Maintenance', date: '2024-01-05', icon: 'alert-circle', description: 'Scheduled maintenance on January 15th' },
        ]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getCourseIcon = (course) => {
    const category = course.category?.toLowerCase() || course.title?.toLowerCase();
    
    if (category.includes('math')) return 'calculator';
    if (category.includes('science')) return 'flask';
    if (category.includes('english') || category.includes('literature')) return 'book';
    if (category.includes('computer') || category.includes('programming') || category.includes('code')) return 'code';
    if (category.includes('art') || category.includes('design')) return 'color-palette';
    if (category.includes('history')) return 'time';
    if (category.includes('business')) return 'business';
    if (category.includes('music')) return 'musical-notes';
    if (category.includes('language')) return 'language';
    
    return 'school';
  };

  const getAnnouncementIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'exam': return 'calendar';
      case 'holiday': return 'alert-circle';
      case 'maintenance': return 'construct';
      case 'new course': return 'rocket';
      default: return 'megaphone';
    }
  };

  const handleCoursePress = (courseId, courseTitle) => {
    navigation.navigate('CourseDetail', { 
      courseId,
      courseTitle: courseTitle || 'Course Details'
    });
  };

  const handleAnnouncementPress = (announcement) => {
    Alert.alert(
      announcement.title,
      announcement.description || 'No additional details available.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {userName}!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Courses', { initialTab: 'enrolled' })}
          >
            <Ionicons name="book" size={24} color="#2E86AB" />
            <Text style={styles.statNumber}>{stats.totalCourses}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </TouchableOpacity>
          
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#2E86AB" />
            <Text style={styles.statNumber}>{stats.totalHours}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="trophy" size={24} color="#2E86AB" />
            <Text style={styles.statNumber}>{stats.certificates}</Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </TouchableOpacity>
        </View>

        {/* Ongoing Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ongoing Courses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Courses', { initialTab: 'enrolled' })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#adb5bd" />
              <Text style={styles.emptyStateText}>No courses enrolled yet</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.browseButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            courses.slice(0, 4).map((course) => (
              <TouchableOpacity 
                key={course.id} 
                style={styles.courseCard}
                onPress={() => handleCoursePress(course.id, course.title)}
              >
                <View style={styles.courseHeader}>
                  <View style={styles.courseIcon}>
                    <Ionicons name={course.icon} size={24} color="#2E86AB" />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                    <Text style={styles.courseInstructor}>{course.instructor || 'Unknown Instructor'}</Text>
                  </View>
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
            ))
          )}
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color="#adb5bd" />
              <Text style={styles.emptyStateText}>No announcements</Text>
            </View>
          ) : (
            announcements.map((announcement) => (
              <TouchableOpacity 
                key={announcement.id} 
                style={styles.announcementCard}
                onPress={() => handleAnnouncementPress(announcement)}
              >
                <Ionicons 
                  name={getAnnouncementIcon(announcement.type)} 
                  size={20} 
                  color="#6c757d" 
                />
                <View style={styles.announcementContent}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementDate}>
                    {new Date(announcement.date).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6c757d" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Courses')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#e7f3ff' }]}>
                <Ionicons name="compass" size={24} color="#2E86AB" />
              </View>
              <Text style={styles.quickActionText}>Browse Courses</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#fff3cd' }]}>
                <Ionicons name="person-circle" size={24} color="#856404" />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Help', 'Contact support for assistance')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#d4edda' }]}>
                <Ionicons name="help-circle" size={24} color="#155724" />
              </View>
              <Text style={styles.quickActionText}>Help</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#f8d7da' }]}>
                <Ionicons name="settings" size={24} color="#721c24" />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
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
    fontSize: 14,
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '600',
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
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  courseInstructor: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
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
  emptyState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 15,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
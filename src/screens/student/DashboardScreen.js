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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function CoreDashboardScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState({
    enrolled: 0,
    completed: 0,
    inProgress: 0
  });

  const auth = getAuth();
  const db = getDatabase();

  useEffect(() => {
    loadUserData();
    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const loadUserData = () => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace('Login');
      return;
    }

    // Set basic user info
    setUserName(user.displayName || user.email?.split('@')[0] || 'Student');
    setUserEmail(user.email || '');
    
    // Load enrolled courses
    loadEnrolledCourses(user.uid);
  };

  const loadEnrolledCourses = (userId) => {
    setLoading(true);
    
    const enrolledRef = ref(db, `users/${userId}/enrolledCourses`);
    
    const unsubscribe = onValue(enrolledRef, (snapshot) => {
      if (snapshot.exists()) {
        const enrolledData = snapshot.val();
        const courseIds = Object.keys(enrolledData);
        
        // Load course details for each enrolled course
        Promise.all(
          courseIds.map(courseId => 
            getCourseDetails(courseId, enrolledData[courseId])
          )
        ).then(coursesData => {
          const validCourses = coursesData.filter(course => course !== null);
          
          // Calculate stats
          const completed = validCourses.filter(c => c.progress === 100).length;
          const inProgress = validCourses.filter(c => c.progress > 0 && c.progress < 100).length;
          
          setStats({
            enrolled: validCourses.length,
            completed: completed,
            inProgress: inProgress
          });
          
          // Sort courses: in-progress first, then not started, then completed
          validCourses.sort((a, b) => {
            if (a.progress === 100 && b.progress < 100) return 1;
            if (a.progress < 100 && b.progress === 100) return -1;
            return b.progress - a.progress;
          });
          
          setCourses(validCourses);
          setLoading(false);
          setRefreshing(false);
        });
      } else {
        setCourses([]);
        setStats({ enrolled: 0, completed: 0, inProgress: 0 });
        setLoading(false);
        setRefreshing(false);
      }
    });

    return unsubscribe;
  };

  const getCourseDetails = async (courseId, enrollment) => {
    try {
      const courseRef = ref(db, `courses/${courseId}`);
      const snapshot = await new Promise((resolve) => {
        onValue(courseRef, resolve, { onlyOnce: true });
      });
      
      if (snapshot.exists()) {
        const courseData = snapshot.val();
        return {
          id: courseId,
          title: courseData.title || 'Untitled Course',
          progress: enrollment.progress || 0,
          category: courseData.category || 'General',
          instructor: courseData.instructor || 'Unknown Instructor',
          color: getCourseColor(courseData.category)
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading course:', error);
      return null;
    }
  };

  const getCourseColor = (category) => {
    const colors = {
      'Math': '#FF6B6B',
      'Science': '#4ECDC4',
      'Programming': '#45B7D1',
      'English': '#96CEB4',
      'History': '#FFEAA7',
      'Art': '#DDA0DD',
      'Business': '#98D8C8',
      'Music': '#F7DC6F',
      'default': '#2E86AB'
    };
    
    if (!category) return colors.default;
    
    for (const [key, color] of Object.entries(colors)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    
    return colors.default;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetail', {
      courseId: course.id,
      courseTitle: course.title
    });
  };

  const handleLogout = () => {
    auth.signOut()
      .then(() => navigation.replace('Login'))
      .catch(error => console.error('Logout error:', error));
  };

  const getProgressText = (progress) => {
    if (progress === 0) return 'Not Started';
    if (progress === 100) return 'Completed';
    return `${progress}% Complete`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
            onRefresh={handleRefresh}
            colors={['#2E86AB']}
          />
        }
      >
        {/* Header with User Info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#6c757d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Learning Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="book-outline" size={28} color="#1976D2" />
              <Text style={[styles.statNumber, { color: '#1976D2' }]}>
                {stats.enrolled}
              </Text>
              <Text style={styles.statLabel}>Enrolled</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="play-circle-outline" size={28} color="#388E3C" />
              <Text style={[styles.statNumber, { color: '#388E3C' }]}>
                {stats.inProgress}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#F57C00" />
              <Text style={[styles.statNumber, { color: '#F57C00' }]}>
                {stats.completed}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* My Courses */}
        <View style={styles.coursesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Courses')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Browse All</Text>
              <Ionicons name="chevron-forward" size={16} color="#2E86AB" />
            </TouchableOpacity>
          </View>
          
          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={60} color="#ddd" />
              <Text style={styles.emptyStateTitle}>No courses yet</Text>
              <Text style={styles.emptyStateText}>
                Enroll in courses to start learning
              </Text>
              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() => navigation.navigate('Courses')}
              >
                <Text style={styles.enrollButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            courses.slice(0, 5).map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => handleCoursePress(course)}
              >
                <View style={[styles.courseIcon, { backgroundColor: course.color + '20' }]}>
                  <Ionicons 
                    name={getCourseIcon(course.category)} 
                    size={24} 
                    color={course.color} 
                  />
                </View>
                
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={styles.courseInstructor} numberOfLines={1}>
                    {course.instructor}
                  </Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${course.progress}%`,
                            backgroundColor: course.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {getProgressText(course.progress)}
                    </Text>
                  </View>
                </View>
                
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#ccc" 
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Courses')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="compass-outline" size={26} color="#1976D2" />
              </View>
              <Text style={styles.actionText}>Browse Courses</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="person-outline" size={26} color="#7B1FA2" />
              </View>
              <Text style={styles.actionText}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function for course icons
function getCourseIcon(category) {
  if (!category) return 'school-outline';
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('math')) return 'calculator-outline';
  if (categoryLower.includes('science') || categoryLower.includes('biology') || categoryLower.includes('chemistry') || categoryLower.includes('physics')) return 'flask-outline';
  if (categoryLower.includes('programming') || categoryLower.includes('code') || categoryLower.includes('computer')) return 'code-outline';
  if (categoryLower.includes('english') || categoryLower.includes('writing') || categoryLower.includes('literature')) return 'book-outline';
  if (categoryLower.includes('history')) return 'time-outline';
  if (categoryLower.includes('art') || categoryLower.includes('design')) return 'color-palette-outline';
  if (categoryLower.includes('business') || categoryLower.includes('economics')) return 'business-outline';
  if (categoryLower.includes('music')) return 'musical-notes-outline';
  if (categoryLower.includes('language')) return 'language-outline';
  
  return 'school-outline';
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E86AB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  logoutButton: {
    padding: 8,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  coursesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '600',
    marginRight: 4,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 80,
  },
  chevron: {
    marginLeft: 10,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  enrollButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enrollButtonText: {
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
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
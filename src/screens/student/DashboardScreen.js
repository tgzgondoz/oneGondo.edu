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

    // Set basic user info with better name formatting
    if (user.displayName) {
      // Capitalize each part of the name
      const formattedName = user.displayName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
        .join(' ');
      setUserName(formattedName);
    } else if (user.email) {
      // Extract name from email and format it nicely
      const nameFromEmail = user.email.split('@')[0];
      const formattedName = nameFromEmail
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      setUserName(formattedName);
    } else {
      setUserName('Student');
    }
    
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
            getCourseDetails(courseId, enrolledData[ourseId])
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
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading course:', error);
      return null;
    }
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
          <ActivityIndicator color="#000" />
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
            colors={['#000']}
          />
        }
      >
        {/* Header with Logout */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Dashboard</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greetingText}>
            Welcome back,{' '}
            <Text style={styles.highlightedName}>{userName}</Text>
          </Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          
          {/* Today's date */}
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Learning Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="book-outline" size={22} color="#000" />
              </View>
              <Text style={styles.statNumber}>
                {stats.enrolled}
              </Text>
              <Text style={styles.statLabel}>Enrolled</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="play-circle-outline" size={22} color="#000" />
              </View>
              <Text style={styles.statNumber}>
                {stats.inProgress}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#000" />
              </View>
              <Text style={styles.statNumber}>
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
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="book-outline" size={48} color="#999" />
              </View>
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
                <View style={styles.courseIcon}>
                  <Ionicons 
                    name={getCourseIcon(course.category)} 
                    size={24} 
                    color="#000" 
                  />
                </View>
                
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <Text style={styles.courseInstructor} numberOfLines={1}>
                    {course.instructor}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${course.progress}%`,
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressPercentage}>{course.progress}%</Text>
                    </View>
                    <Text style={styles.progressText}>
                      {getProgressText(course.progress)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.courseAction}>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color="#999" 
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Learning Platform</Text>
          <Text style={styles.footerSubtext}>Version 2.1.4 • © 2024</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    padding: 8,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  highlightedName: {
    color: '#000',
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  coursesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 4,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    backgroundColor: '#f0f0f0',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  progressContainer: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    minWidth: 40,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  courseAction: {
    paddingLeft: 10,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  enrollButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, off, get } from 'firebase/database'; // Added get back
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function DashboardScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Student');

  const db = getDatabase();
  const auth = getAuth();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadUserData(user.uid);
      } else {
        setUserId(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      // Cleanup database listeners
      if (userId) {
        const userRef = ref(db, `users/${userId}`);
        off(userRef);
      }
    };
  }, []);

  useEffect(() => {
    if (userId) {
      setupRealtimeListeners();
    }
  }, [userId]);

  const loadUserData = (uid) => {
    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserName(userData.name || userData.email?.split('@')[0] || 'Student');
      }
    });
  };

  const setupRealtimeListeners = () => {
    if (!userId) return;

    // Listen to enrolled courses changes
    const enrolledRef = ref(db, `users/${userId}/enrolledCourses`);
    onValue(enrolledRef, (snapshot) => {
      if (snapshot.exists()) {
        const enrolledData = snapshot.val();
        loadCoursesData(enrolledData);
      } else {
        setCourses([]);
        setStats({
          totalCourses: 0,
          completedCourses: 0,
          totalHours: 0,
          certificates: 0
        });
        setLoading(false);
      }
    }, {
      onlyOnce: false // Keep listening for changes
    });
  };

  const loadCoursesData = async (enrolledData) => {
    try {
      const coursesArray = [];
      let completedCourses = 0;
      let totalHours = 0;

      // Load all enrolled courses
      const coursePromises = Object.entries(enrolledData).map(async ([courseId, enrollment]) => {
        const courseRef = ref(db, `courses/${courseId}`);
        const progressRef = ref(db, `users/${userId}/progress/${courseId}`);

        // Get course data
        const courseSnapshot = await get(courseRef);
        if (!courseSnapshot.exists()) return null;

        const courseData = courseSnapshot.val();
        
        // Get progress
        let progress = 0;
        const progressSnapshot = await get(progressRef);
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

        return {
          id: courseId,
          title: courseData.title || 'Untitled Course',
          progress: progress,
          instructor: courseData.instructor,
          icon: getCourseIcon(courseData),
          courseHours: courseHours
        };
      });

      const results = await Promise.all(coursePromises);
      const validCourses = results.filter(course => course !== null);
      
      // Sort by progress (descending) to show ongoing courses first
      validCourses.sort((a, b) => {
        if (a.progress === b.progress) return 0;
        if (a.progress === 100) return 1; // Completed courses at the end
        if (b.progress === 100) return -1;
        return b.progress - a.progress; // Higher progress first
      });

      setCourses(validCourses);
      setStats({
        totalCourses: validCourses.length,
        completedCourses: completedCourses,
        totalHours: totalHours,
        certificates: completedCourses
      });
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading courses data:', error);
      Alert.alert('Error', 'Failed to load courses data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateCourseProgress = (courseId, progressData) => {
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => {
        if (course.id === courseId) {
          const newProgress = progressData.overallProgress || 0;
          return {
            ...course,
            progress: newProgress
          };
        }
        return course;
      });

      // Update stats based on updated courses
      const completedCoursesCount = updatedCourses.filter(course => course.progress >= 100).length;
      setStats(prevStats => ({
        ...prevStats,
        completedCourses: completedCoursesCount,
        certificates: completedCoursesCount
      }));

      return updatedCourses;
    });
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

  const handleCoursePress = (courseId, courseTitle) => {
    navigation.navigate('CourseDetail', { 
      courseId,
      courseTitle: courseTitle || 'Course Details'
    });
  };

  const handleRefresh = () => {
    if (userId) {
      setRefreshing(true);
      const enrolledRef = ref(db, `users/${userId}/enrolledCourses`);
      get(enrolledRef).then((snapshot) => {
        if (snapshot.exists()) {
          loadCoursesData(snapshot.val());
        } else {
          setCourses([]);
          setStats({
            totalCourses: 0,
            completedCourses: 0,
            totalHours: 0,
            certificates: 0
          });
          setRefreshing(false);
        }
      }).catch(error => {
        console.error('Error refreshing:', error);
        setRefreshing(false);
      });
    }
  };

  if (loading && !refreshing) {
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
            onPress={() => {
              // Navigate to enrolled courses and filter completed ones
              navigation.navigate('Courses', { 
                initialTab: 'enrolled',
                showCompletedOnly: true 
              });
            }}
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
    width: '100%',
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
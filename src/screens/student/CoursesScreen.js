import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function CoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [activeTab, setActiveTab] = useState('available');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const db = getDatabase();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      loadCourses();
      loadEnrolledCourses();
      checkUserSubscription();
    }
  }, [userId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesRef = ref(db, 'courses');
      const snapshot = await get(coursesRef);
      
      if (snapshot.exists()) {
        const coursesData = snapshot.val();
        const coursesArray = Object.keys(coursesData).map(key => ({
          id: key,
          ...coursesData[key],
          enrolled: false
        }));
        setCourses(coursesArray);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    if (!userId) return;
    
    try {
      const enrolledRef = ref(db, `users/${userId}/enrolledCourses`);
      const snapshot = await get(enrolledRef);
      
      if (snapshot.exists()) {
        const enrolledData = snapshot.val();
        const enrolledArray = Object.keys(enrolledData).map(key => ({
          courseId: key,
          ...enrolledData[key],
          enrolledDate: enrolledData[key].enrolledDate || Date.now()
        }));
        setEnrolledCourses(enrolledArray);
        
        enrolledArray.forEach(course => {
          loadCourseProgress(course.courseId);
        });
      }
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    }
  };

  const checkUserSubscription = async () => {
    if (!userId) return;
    
    try {
      const subscriptionRef = ref(db, `users/${userId}/subscription`);
      const snapshot = await get(subscriptionRef);
      
      if (snapshot.exists()) {
        const subscriptionData = snapshot.val();
        const now = Date.now();
        const expiry = subscriptionData.expiryDate;
        
        if (expiry > now) {
          setHasSubscription(true);
          setSubscriptionExpiry(expiry);
        } else {
          setHasSubscription(false);
          // Mark subscription as expired in database
          await set(subscriptionRef, {
            ...subscriptionData,
            status: 'expired'
          });
        }
      } else {
        setHasSubscription(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasSubscription(false);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadCourseProgress = async (courseId) => {
    if (!userId) return;
    
    try {
      const progressRef = ref(db, `users/${userId}/progress/${courseId}`);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        const progressData = snapshot.val();
        
        const sections = Object.values(progressData.sections || {});
        const totalLessons = sections.reduce((total, section) => 
          total + (section.totalLessons || 0), 0
        );
        const completedLessons = sections.reduce((total, section) => 
          total + (section.completedLessons || 0), 0
        );
        
        const progressPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
        
        setUserProgress(prev => ({
          ...prev,
          [courseId]: {
            ...progressData,
            progressPercentage,
            completedLessons,
            totalLessons
          }
        }));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
    loadEnrolledCourses();
    checkUserSubscription().finally(() => {
      setRefreshing(false);
    });
  };

  // FIXED: Navigation to Payment screen in ProfileStack
  const navigateToPayment = () => {
    try {
      // Payment screen is in ProfileStack, so we need to navigate to Profile tab first
      navigation.navigate('Profile', { screen: 'Payment' });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation method
      Alert.alert('Navigation Error', 'Unable to open payment screen');
    }
  };

  const enrollInCourse = async (course) => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to enroll');
      return;
    }
    
    // Check if user has active subscription
    if (!hasSubscription) {
      Alert.alert(
        'Subscription Required',
        'You need an active subscription to enroll in courses. Would you like to subscribe?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Subscribe',
            onPress: navigateToPayment
          }
        ]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      const alreadyEnrolled = enrolledCourses.find(ec => ec.courseId === course.id);
      if (alreadyEnrolled) {
        Alert.alert('Info', 'You are already enrolled in this course');
        return;
      }
      
      const enrolledRef = ref(db, `users/${userId}/enrolledCourses/${course.id}`);
      await set(enrolledRef, {
        enrolledDate: Date.now(),
        courseTitle: course.title,
        courseInstructor: course.instructor || 'Unknown',
        courseDuration: course.duration || 'Unknown'
      });
      
      const progressRef = ref(db, `users/${userId}/progress/${course.id}`);
      await set(progressRef, {
        enrolledDate: Date.now(),
        lastAccessed: Date.now(),
        sections: {},
        overallProgress: 0
      });
      
      const newEnrollment = {
        courseId: course.id,
        enrolledDate: Date.now(),
        courseTitle: course.title,
        courseInstructor: course.instructor,
        courseDuration: course.duration
      };
      
      setEnrolledCourses(prev => [...prev, newEnrollment]);
      
      Alert.alert(
        'Success!',
        `You have successfully enrolled in "${course.title}"`,
        [
          {
            text: 'Start Learning',
            onPress: () => navigateToCourse(course.id, course.title)
          },
          {
            text: 'Continue Browsing',
            style: 'cancel'
          }
        ]
      );
      
      setShowCourseDetails(false);
    } catch (error) {
      console.error('Error enrolling:', error);
      Alert.alert('Error', 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const navigateToCourse = (courseId, courseTitle) => {
    if (!courseId) {
      Alert.alert('Error', 'Course information is missing');
      return;
    }
    
    navigation.navigate('CourseDetail', { 
      courseId,
      courseTitle: courseTitle || 'Course Details'
    });
  };

  const viewCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetails(true);
  };

  const getProgressForCourse = (courseId) => {
    return userProgress[courseId]?.progressPercentage || 0;
  };

  const getCompletedLessons = (courseId) => {
    return userProgress[courseId]?.completedLessons || 0;
  };

  const getTotalLessons = (courseId) => {
    return userProgress[courseId]?.totalLessons || 0;
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(ec => ec.courseId === courseId);
  };

  const getIconForCourse = (course) => {
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

  const getEnrolledCourses = () => {
    return enrolledCourses.map(enrollment => {
      const course = courses.find(c => c.id === enrollment.courseId);
      return {
        ...course,
        ...enrollment,
        progress: getProgressForCourse(enrollment.courseId),
        completedLessons: getCompletedLessons(enrollment.courseId),
        totalLessons: getTotalLessons(enrollment.courseId)
      };
    });
  };

  const getAvailableCourses = () => {
    return courses.filter(course => !isEnrolled(course.id));
  };

  const renderSubscriptionInfo = () => {
    if (!userId || hasSubscription || loadingSubscription) return null;
    
    return (
      <View style={styles.subscriptionBanner}>
        <View style={styles.subscriptionBannerContent}>
          <Ionicons name="lock-closed" size={20} color="#000" />
          <View style={styles.subscriptionBannerText}>
            <Text style={styles.subscriptionBannerTitle}>
              Subscription Required
            </Text>
            <Text style={styles.subscriptionBannerSubtitle}>
              Subscribe to unlock all courses and features
            </Text>
          </View>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={navigateToPayment}
          >
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSubscriptionStatus = () => {
    if (!hasSubscription || !subscriptionExpiry) return null;
    
    const expiryDate = new Date(subscriptionExpiry);
    const daysRemaining = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
    
    return (
      <View style={styles.subscriptionStatus}>
        <Ionicons name="checkmark-circle" size={14} color="#000" />
        <Text style={styles.subscriptionStatusText}>
          Subscription active • {daysRemaining} days remaining
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#000" />
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
            colors={['#000']}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Courses</Text>
            {renderSubscriptionStatus()}
            <Text style={styles.subtitle}>
              {activeTab === 'enrolled' 
                ? 'Continue your learning journey' 
                : 'Discover new courses to learn'}
            </Text>
          </View>
          {userId && (
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle" size={32} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {renderSubscriptionInfo()}

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Ionicons 
              name="compass" 
              size={20} 
              color={activeTab === 'available' ? '#000' : '#666'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'available' && styles.activeTabText
            ]}>
              Available ({getAvailableCourses().length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
            onPress={() => setActiveTab('enrolled')}
          >
            <Ionicons 
              name="book" 
              size={20} 
              color={activeTab === 'enrolled' ? '#000' : '#666'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'enrolled' && styles.activeTabText
            ]}>
              My Courses ({enrolledCourses.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coursesContainer}>
          {activeTab === 'available' ? (
            getAvailableCourses().length > 0 ? (
              getAvailableCourses().map((course) => (
                <TouchableOpacity 
                  key={course.id} 
                  style={styles.courseCard}
                  onPress={() => viewCourseDetails(course)}
                >
                  <View style={styles.courseHeader}>
                    <View style={styles.courseIcon}>
                      <Ionicons 
                        name={getIconForCourse(course)} 
                        size={24} 
                        color="#000" 
                      />
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseInstructor}>
                        {course.instructor || 'Unknown Instructor'}
                      </Text>
                      <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color="#666" />
                          <Text style={styles.metaText}>
                            {course.duration || 'Self-paced'}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="layers-outline" size={14} color="#666" />
                          <Text style={styles.metaText}>
                            {course.totalSections || 0} sections
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.courseDescription}>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {course.description || 'No description available'}
                    </Text>
                  </View>
                  
                  {/* FIXED: disabled prop with proper boolean conversion */}
                  <TouchableOpacity 
                    style={styles.enrollButton}
                    onPress={() => enrollInCourse(course)}
                    disabled={!!userId && !hasSubscription}
                  >
                    <Ionicons 
                      name={hasSubscription ? "add-circle-outline" : "lock-closed"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.enrollButtonText}>
                      {hasSubscription ? 'Enroll Now' : 'Subscribe to Enroll'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={48} color="#999" />
                <Text style={styles.emptyStateTitle}>No Available Courses</Text>
                <Text style={styles.emptyStateText}>
                  {hasSubscription 
                    ? 'All courses are currently enrolled' 
                    : 'Subscribe to view available courses'}
                </Text>
                {!hasSubscription && userId && (
                  <TouchableOpacity 
                    style={styles.browseButton}
                    onPress={navigateToPayment}
                  >
                    <Text style={styles.browseButtonText}>View Subscription Plans</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          ) : (
            getEnrolledCourses().length > 0 ? (
              getEnrolledCourses().map((course) => (
                <TouchableOpacity 
                  key={course.courseId} 
                  style={styles.courseCard}
                  onPress={() => navigateToCourse(course.courseId, course.courseTitle)}
                >
                  <View style={styles.courseHeader}>
                    <View style={styles.courseIcon}>
                      <Ionicons 
                        name={getIconForCourse(course)} 
                        size={24} 
                        color="#000" 
                      />
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{course.courseTitle}</Text>
                      <Text style={styles.courseInstructor}>
                        {course.courseInstructor}
                      </Text>
                      <Text style={styles.courseDuration}>
                        Enrolled on {new Date(course.enrolledDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Your Progress</Text>
                      <Text style={styles.progressPercentage}>
                        {course.progress || 0}%
                      </Text>
                    </View>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${course.progress || 0}%` }
                          ]} 
                        />
                      </View>
                    </View>
                    <Text style={styles.progressDetail}>
                      {course.completedLessons || 0} of {course.totalLessons || 0} lessons completed
                    </Text>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigateToCourse(course.courseId, course.courseTitle)}
                      >
                        <Ionicons name="play-circle" size={20} color="#000" />
                        <Text style={styles.actionButtonText}>
                          {course.progress > 0 ? 'Continue' : 'Start'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={48} color="#999" />
                <Text style={styles.emptyStateTitle}>No Enrolled Courses</Text>
                <Text style={styles.emptyStateText}>
                  {hasSubscription 
                    ? 'Enroll in available courses to start learning'
                    : 'Subscribe to enroll in courses and start learning'}
                </Text>
                {/* FIXED: Simplified onPress handler */}
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => {
                    if (hasSubscription) {
                      setActiveTab('available');
                    } else {
                      navigateToPayment();
                    }
                  }}
                >
                  <Text style={styles.browseButtonText}>
                    {hasSubscription ? 'Browse Courses' : 'View Subscription Plans'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCourseDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCourseDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCourse && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
                  <TouchableOpacity onPress={() => setShowCourseDetails(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.modalCourseIcon}>
                    <Ionicons 
                      name={getIconForCourse(selectedCourse)} 
                      size={48} 
                      color="#000" 
                    />
                  </View>
                  
                  {!hasSubscription && userId && (
                    <View style={styles.subscriptionRequiredAlert}>
                      <Ionicons name="lock-closed" size={20} color="#fff" />
                      <Text style={styles.subscriptionRequiredText}>
                        Subscription required to enroll in this course
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalLabel}>Instructor</Text>
                    <Text style={styles.modalText}>
                      {selectedCourse.instructor || 'Unknown'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalLabel}>Duration</Text>
                    <Text style={styles.modalText}>
                      {selectedCourse.duration || 'Self-paced'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalLabel}>Sections</Text>
                    <Text style={styles.modalText}>
                      {selectedCourse.totalSections || 0} learning sections
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalLabel}>Description</Text>
                    <Text style={styles.modalDescription}>
                      {selectedCourse.description || 'No description available.'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalLabel}>What You'll Learn</Text>
                    {selectedCourse.learningObjectives ? (
                      selectedCourse.learningObjectives.map((objective, index) => (
                        <View key={index} style={styles.objectiveItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#000" />
                          <Text style={styles.objectiveText}>{objective}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.modalText}>
                        Master key concepts and skills in this subject area.
                      </Text>
                    )}
                  </View>
                  
                  {hasSubscription ? (
                    <TouchableOpacity 
                      style={styles.modalEnrollButton}
                      onPress={() => enrollInCourse(selectedCourse)}
                      disabled={loading || (!!userId && !hasSubscription)}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="add-circle" size={24} color="#fff" />
                          <Text style={styles.modalEnrollButtonText}>Enroll Now</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.modalSubscribeButton}
                      onPress={() => {
                        setShowCourseDetails(false);
                        navigateToPayment();
                      }}
                    >
                      <Ionicons name="lock-open" size={24} color="#fff" />
                      <Text style={styles.modalSubscribeButtonText}>
                        {userId ? 'Subscribe to Enroll' : 'Sign In to Subscribe'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.modalCancelButton}
                    onPress={() => setShowCourseDetails(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    padding: 5,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subscriptionStatusText: {
    fontSize: 12,
    color: '#28a745',
    marginLeft: 4,
  },
  subscriptionBanner: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  subscriptionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  subscriptionBannerText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  subscriptionBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  subscriptionBannerSubtitle: {
    fontSize: 12,
    color: '#856404',
    marginTop: 2,
  },
  subscribeButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#000',
  },
  coursesContainer: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
    color: '#000',
  },
  courseInstructor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  courseDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  courseMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  courseDescription: {
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  progressDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 20,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 10,
  },
  modalScroll: {
    padding: 20,
  },
  modalCourseIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionRequiredAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  subscriptionRequiredText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  modalText: {
    fontSize: 16,
    color: '#000',
  },
  modalDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  objectiveText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
    flex: 1,
  },
  modalEnrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  modalEnrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalSubscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  modalSubscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalCancelButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  modalCancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
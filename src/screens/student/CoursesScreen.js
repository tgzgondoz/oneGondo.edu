import React, { useState, useEffect, } from 'react';
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

  const db = getDatabase();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      loadCourses();
      loadEnrolledCourses();
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
    loadEnrolledCourses().finally(() => {
      setRefreshing(false);
    });
  };

  const enrollInCourse = async (course) => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to enroll');
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

  // FIXED: Added null check for courseId
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
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
          <View>
            <Text style={styles.title}>Courses</Text>
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
              <Ionicons name="person-circle" size={32} color="#2E86AB" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Ionicons 
              name="compass" 
              size={20} 
              color={activeTab === 'available' ? '#2E86AB' : '#6c757d'} 
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
              color={activeTab === 'enrolled' ? '#2E86AB' : '#6c757d'} 
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
                        color="#2E86AB" 
                      />
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseInstructor}>
                        {course.instructor || 'Unknown Instructor'}
                      </Text>
                      <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color="#6c757d" />
                          <Text style={styles.metaText}>
                            {course.duration || 'Self-paced'}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="layers-outline" size={14} color="#6c757d" />
                          <Text style={styles.metaText}>
                            {course.totalSections || 0} sections
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>Available</Text>
                    </View>
                  </View>
                  
                  <View style={styles.courseDescription}>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {course.description || 'No description available'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.enrollButton}
                    onPress={() => enrollInCourse(course)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.enrollButtonText}>Enroll Now</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={64} color="#adb5bd" />
                <Text style={styles.emptyStateTitle}>No Available Courses</Text>
                <Text style={styles.emptyStateText}>
                  All courses are currently enrolled or no courses available
                </Text>
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
                        color="#2E86AB" 
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
                    <View style={styles.enrolledBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                      <Text style={styles.enrolledBadgeText}>Enrolled</Text>
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
                        <Ionicons name="play-circle" size={20} color="#2E86AB" />
                        <Text style={styles.actionButtonText}>
                          {course.progress > 0 ? 'Continue' : 'Start'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => navigation.navigate('CourseMaterials', { 
                          courseId: course.courseId,
                          courseTitle: course.courseTitle
                        })}
                      >
                        <Ionicons name="folder-open" size={20} color="#6c757d" />
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                          Materials
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => navigation.navigate('QuizAttempts', { 
                          courseId: course.courseId,
                          courseTitle: course.courseTitle
                        })}
                      >
                        <Ionicons name="help-circle" size={20} color="#6c757d" />
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                          Quizzes
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color="#adb5bd" />
                <Text style={styles.emptyStateTitle}>No Enrolled Courses</Text>
                <Text style={styles.emptyStateText}>
                  Enroll in available courses to start learning
                </Text>
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => setActiveTab('available')}
                >
                  <Text style={styles.browseButtonText}>Browse Courses</Text>
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
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.modalCourseIcon}>
                    <Ionicons 
                      name={getIconForCourse(selectedCourse)} 
                      size={48} 
                      color="#2E86AB" 
                    />
                  </View>
                  
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
                          <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                          <Text style={styles.objectiveText}>{objective}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.modalText}>
                        Master key concepts and skills in this subject area.
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.modalEnrollButton}
                    onPress={() => enrollInCourse(selectedCourse)}
                    disabled={loading}
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
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  profileButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2E86AB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#2E86AB',
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
    color: '#6c757d',
    marginLeft: 4,
  },
  availableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff3cd',
  },
  availableBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#d4edda',
  },
  enrolledBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#155724',
    marginLeft: 4,
  },
  courseDescription: {
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    padding: 12,
    borderRadius: 8,
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
    borderTopColor: '#e9ecef',
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
    color: '#333',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 3,
  },
  progressDetail: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#e7f3ff',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E86AB',
    marginLeft: 4,
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
  },
  secondaryButtonText: {
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  modalInfoSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 22,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  objectiveText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  modalEnrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  modalEnrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalCancelButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalCancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
});
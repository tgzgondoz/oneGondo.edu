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

export default function CourseDetailScreen({ navigation, route }) {
  const { courseId } = route.params || {};
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  
  const db = getDatabase();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
      if (userId) {
        loadUserProgress();
      }
    }
  }, [courseId, userId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Load course details
      const courseRef = ref(db, `courses/${courseId}`);
      const courseSnapshot = await get(courseRef);
      
      if (courseSnapshot.exists()) {
        setCourse({
          id: courseId,
          ...courseSnapshot.val()
        });
        
        // Load sections
        const sectionsRef = ref(db, `courses/${courseId}/sections`);
        const sectionsSnapshot = await get(sectionsRef);
        
        if (sectionsSnapshot.exists()) {
          const sectionsData = sectionsSnapshot.val();
          const sectionsArray = Object.keys(sectionsData).map(key => ({
            id: key,
            ...sectionsData[key]
          }));
          
          // Sort sections by order
          sectionsArray.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSections(sectionsArray);
        }
      }
    } catch (error) {
      console.error('Error loading course details:', error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!userId) return;
    
    try {
      const progressRef = ref(db, `users/${userId}/progress/${courseId}`);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        setProgress(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'quiz': return 'help-circle';
      case 'test': return 'school';
      case 'document': return 'document-text';
      default: return 'folder';
    }
  };

  const getSectionColor = (type) => {
    switch (type) {
      case 'video': return '#dc3545';
      case 'quiz': return '#ffc107';
      case 'test': return '#dc3545';
      case 'document': return '#28a745';
      default: return '#6c757d';
    }
  };

  // FIXED: Updated navigation to use existing screens
  const navigateToSection = (section) => {
    if (section.type === 'video' || section.type === 'document') {
      // Navigate to Course Materials instead of SectionContent
      Alert.alert(
        'Start Learning',
        `Navigate to "${section.title}" materials. All learning materials are available in the Course Materials section.`,
        [
          {
            text: 'Go to Materials',
            onPress: () => navigation.navigate('CourseMaterials', { 
              courseId,
              courseTitle: course.title
            })
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } else if (section.type === 'quiz' || section.type === 'test') {
      // Navigate to quiz
      navigation.navigate('TakeQuiz', {
        courseId,
        sectionId: section.id,
        quizTitle: section.title
      });
    } else {
      // For other types, show materials
      navigation.navigate('CourseMaterials', { 
        courseId,
        courseTitle: course.title
      });
    }
  };

  const getProgressForSection = (sectionId) => {
    return progress.sections?.[sectionId]?.progress || 0;
  };

  const getCompletedLessons = (sectionId) => {
    return progress.sections?.[sectionId]?.completedLessons || 0;
  };

  const getTotalLessons = (sectionId) => {
    return progress.sections?.[sectionId]?.totalLessons || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#dc3545" />
          <Text style={styles.errorText}>Course not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalProgress = progress.overallProgress || 0;
  const totalSections = sections.length;
  const completedSections = sections.filter(section => 
    getProgressForSection(section.id) >= 100
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Course Header */}
          <View style={styles.courseHeader}>
            <View style={styles.courseIcon}>
              <Ionicons name="book" size={32} color="#2E86AB" />
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseInstructor}>
                Instructor: {course.instructor || 'Unknown'}
              </Text>
              <Text style={styles.courseDuration}>
                Duration: {course.duration || 'Self-paced'}
              </Text>
            </View>
          </View>

          {/* Progress Summary */}
          {userId && (
            <View style={styles.progressSummary}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${totalProgress}%` }
                  ]} 
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressStat}>
                  {totalProgress}% Complete
                </Text>
                <Text style={styles.progressStat}>
                  {completedSections}/{totalSections} Sections
                </Text>
              </View>
            </View>
          )}

          {/* Course Description */}
          {course.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{course.description}</Text>
            </View>
          )}

          {/* Sections List */}
          <View style={styles.sectionsContainer}>
            <Text style={styles.sectionsTitle}>Course Sections</Text>
            
            {sections.length === 0 ? (
              <View style={styles.emptySections}>
                <Ionicons name="folder-open-outline" size={48} color="#adb5bd" />
                <Text style={styles.emptySectionsText}>
                  No sections available yet
                </Text>
              </View>
            ) : (
              sections.map(section => {
                const sectionProgress = getProgressForSection(section.id);
                const completed = getCompletedLessons(section.id);
                const total = getTotalLessons(section.id);

                return (
                  <TouchableOpacity
                    key={section.id}
                    style={styles.sectionCard}
                    onPress={() => navigateToSection(section)}
                  >
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionIcon}>
                        <Ionicons 
                          name={getSectionIcon(section.type)} 
                          size={24} 
                          color={getSectionColor(section.type)} 
                        />
                      </View>
                      <View style={styles.sectionInfo}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionDescription}>
                          {section.description || `${section.lessonsCount || 0} lessons`}
                        </Text>
                        {section.type === 'quiz' || section.type === 'test' ? (
                          <Text style={styles.sectionMeta}>
                            {section.totalQuestions || 0} questions • Pass: {section.passingScore || 70}%
                          </Text>
                        ) : section.type === 'video' ? (
                          <Text style={styles.sectionMeta}>
                            {section.totalDuration ? 
                              `${Math.floor(section.totalDuration / 60)} min` : 
                              'Watch time'}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Progress for enrolled users */}
                    {userId && sectionProgress > 0 && (
                      <View style={styles.sectionProgress}>
                        <View style={styles.progressContainer}>
                          <View style={styles.miniProgressBar}>
                            <View 
                              style={[
                                styles.miniProgressFill, 
                                { width: `${sectionProgress}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {sectionProgress}%
                          </Text>
                        </View>
                        <Text style={styles.lessonsCount}>
                          {completed}/{total} lessons
                        </Text>
                      </View>
                    )}

                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => navigateToSection(section)}
                      >
                        <Ionicons 
                          name={
                            section.type === 'quiz' || section.type === 'test' ? 
                            'help-circle' : 'play-circle'
                          } 
                          size={20} 
                          color="#2E86AB" 
                        />
                        <Text style={styles.actionButtonText}>
                          {section.type === 'quiz' || section.type === 'test' ? 
                           'Take Quiz' : 'Start Learning'}
                        </Text>
                      </TouchableOpacity>

                      {section.type !== 'quiz' && section.type !== 'test' && (
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.materialsButton]}
                          onPress={() => navigation.navigate('CourseMaterials', { 
                            courseId,
                            courseTitle: course.title
                          })}
                        >
                          <Ionicons name="folder-open" size={20} color="#6c757d" />
                          <Text style={[styles.actionButtonText, styles.materialsButtonText]}>
                            Materials
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('CourseMaterials', { 
                courseId,
                courseTitle: course.title
              })}
            >
              <Ionicons name="folder-open" size={24} color="#2E86AB" />
              <Text style={styles.quickActionText}>All Materials</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('QuizAttempts', { 
                courseId,
                courseTitle: course.title
              })}
            >
              <Ionicons name="help-circle" size={24} color="#2E86AB" />
              <Text style={styles.quickActionText}>Quizzes</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  courseHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  courseDuration: {
    fontSize: 14,
    color: '#2E86AB',
  },
  progressSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    fontSize: 14,
    color: '#6c757d',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  sectionsContainer: {
    marginBottom: 20,
  },
  sectionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptySections: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptySectionsText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  sectionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  sectionMeta: {
    fontSize: 12,
    color: '#2E86AB',
  },
  sectionProgress: {
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 10,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  lessonsCount: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#e7f3ff',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
    marginLeft: 6,
  },
  materialsButton: {
    backgroundColor: '#f8f9fa',
  },
  materialsButtonText: {
    color: '#6c757d',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '600',
    marginTop: 8,
  },
});
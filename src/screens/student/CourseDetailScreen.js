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

  // FIXED: Updated navigation to use existing screens
  const navigateToSection = (section) => {
    if (section.type === 'video' || section.type === 'document') {
      // Navigate to Course Materials
      Alert.alert(
        'Start Learning',
        `Navigate to "${section.title}" materials.`,
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
          <ActivityIndicator color="#000" />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#666" />
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
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
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseInstructor}>
                {course.instructor || 'Unknown Instructor'}
              </Text>
              <Text style={styles.courseDuration}>
                {course.duration || 'Self-paced'}
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
                <Ionicons name="folder-open-outline" size={48} color="#999" />
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
                          color="#000" 
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
                          color="#000" 
                        />
                        <Text style={styles.actionButtonText}>
                          {section.type === 'quiz' || section.type === 'test' ? 
                           'Take Quiz' : 'Start'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#000',
    marginTop: 16,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  courseHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courseDuration: {
    fontSize: 14,
    color: '#666',
  },
  progressSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    fontSize: 12,
    color: '#666',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  sectionsContainer: {
    marginBottom: 16,
  },
  sectionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  emptySections: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptySectionsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sectionMeta: {
    fontSize: 12,
    color: '#666',
  },
  sectionProgress: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 8,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  lessonsCount: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 6,
  },
});
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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get } from 'firebase/database';

export default function SectionContentScreen({ navigation, route }) {
  const { courseId, sectionId, sectionTitle } = route.params || {};
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState(null);

  const db = getDatabase();

  useEffect(() => {
    if (courseId && sectionId) {
      loadSectionContent();
    }
  }, [courseId, sectionId]);

  const loadSectionContent = async () => {
    try {
      setLoading(true);
      
      // Load section details
      const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      const sectionSnapshot = await get(sectionRef);
      
      if (sectionSnapshot.exists()) {
        setSection({
          id: sectionId,
          ...sectionSnapshot.val()
        });
      }

      // Load lessons for this section
      const lessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
      const snapshot = await get(lessonsRef);
      
      if (snapshot.exists()) {
        const lessonsData = snapshot.val();
        const lessonsArray = Object.keys(lessonsData).map(key => ({
          id: key,
          ...lessonsData[key]
        }));
        
        // Sort by order
        lessonsArray.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(lessonsArray);
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Error loading section content:', error);
      Alert.alert('Error', 'Failed to load section content');
    } finally {
      setLoading(false);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'text': return 'document-text';
      case 'document': return 'document-attach';
      case 'quiz': return 'help-circle';
      default: return 'document';
    }
  };

  const getLessonColor = (type) => {
    switch (type) {
      case 'video': return '#dc3545';
      case 'text': return '#28a745';
      case 'document': return '#17a2b8';
      case 'quiz': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const handleOpenLesson = async (lesson) => {
    if (lesson.type === 'video') {
      if (lesson.url.includes('youtube.com') || lesson.url.includes('youtu.be')) {
        const youtubeUrl = lesson.url.includes('youtube.com') 
          ? lesson.url 
          : `https://youtube.com/watch?v=${lesson.url.split('/').pop()}`;
        
        try {
          const supported = await Linking.canOpenURL(youtubeUrl);
          if (supported) {
            await Linking.openURL(youtubeUrl);
          } else {
            Alert.alert('Error', 'Cannot open YouTube link');
          }
        } catch (error) {
          console.error('Error opening YouTube:', error);
          Alert.alert('Error', 'Failed to open video');
        }
      } else {
        navigation.navigate('VideoPlayer', {
          videoUrl: lesson.url,
          title: lesson.title,
          courseId,
          sectionId,
          lessonId: lesson.id
        });
      }
    } else if (lesson.type === 'document') {
      try {
        const supported = await Linking.canOpenURL(lesson.url);
        if (supported) {
          await Linking.openURL(lesson.url);
        } else {
          Alert.alert('Error', 'Cannot open this document');
        }
      } catch (error) {
        console.error('Error opening document:', error);
        Alert.alert('Error', 'Failed to open document');
      }
    } else if (lesson.type === 'text') {
      navigation.navigate('LessonDetail', {
        courseId,
        sectionId,
        lessonId: lesson.id,
        lessonTitle: lesson.title
      });
    } else if (lesson.type === 'quiz') {
      navigation.navigate('TakeQuiz', {
        courseId,
        sectionId,
        lessonId: lesson.id,
        quizTitle: lesson.title
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sectionTitle || 'Section Content'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Section Info */}
          {section && (
            <View style={styles.sectionInfo}>
              <View style={styles.sectionIcon}>
                <Ionicons 
                  name={
                    section.type === 'video' ? 'videocam' :
                    section.type === 'document' ? 'document-text' :
                    section.type === 'quiz' ? 'help-circle' :
                    section.type === 'test' ? 'school' : 'folder'
                  } 
                  size={32} 
                  color="#2E86AB" 
                />
              </View>
              <View style={styles.sectionDetails}>
                <Text style={styles.sectionName}>{section.title}</Text>
                {section.description && (
                  <Text style={styles.sectionDescription}>
                    {section.description}
                  </Text>
                )}
                <Text style={styles.lessonsCount}>
                  {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                </Text>
              </View>
            </View>
          )}

          {/* Lessons List */}
          <View style={styles.lessonsContainer}>
            <Text style={styles.lessonsTitle}>Lessons</Text>
            
            {lessons.length === 0 ? (
              <View style={styles.emptyLessons}>
                <Ionicons name="book-outline" size={48} color="#adb5bd" />
                <Text style={styles.emptyLessonsText}>
                  No lessons available in this section
                </Text>
              </View>
            ) : (
              lessons.map(lesson => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonItem}
                  onPress={() => handleOpenLesson(lesson)}
                >
                  <View style={styles.lessonIcon}>
                    <Ionicons 
                      name={getLessonIcon(lesson.type)} 
                      size={24} 
                      color={getLessonColor(lesson.type)} 
                    />
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonType}>
                      {lesson.type === 'video' ? 'Video Lesson' :
                       lesson.type === 'text' ? 'Text Lesson' :
                       lesson.type === 'document' ? 'Document' :
                       lesson.type === 'quiz' ? 'Quiz' : 'Lesson'}
                    </Text>
                    {lesson.duration && (
                      <Text style={styles.lessonDuration}>
                        <Ionicons name="time-outline" size={12} />
                        {` ${lesson.duration}`}
                      </Text>
                    )}
                    {lesson.content && (
                      <Text style={styles.lessonPreview} numberOfLines={2}>
                        {lesson.content}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('CourseMaterials', {
                courseId,
                courseTitle: sectionTitle
              })}
            >
              <Ionicons name="folder-open" size={20} color="#2E86AB" />
              <Text style={styles.quickActionText}>All Materials</Text>
            </TouchableOpacity>
            
            {section && (section.type === 'quiz' || section.type === 'test') && (
              <TouchableOpacity 
                style={[styles.quickAction, styles.quizAction]}
                onPress={() => navigation.navigate('TakeQuiz', {
                  courseId,
                  sectionId,
                  quizTitle: section.title
                })}
              >
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={[styles.quickActionText, styles.quizActionText]}>
                  Start {section.type === 'test' ? 'Test' : 'Quiz'}
                </Text>
              </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionInfo: {
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
  sectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  sectionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 20,
  },
  lessonsCount: {
    fontSize: 12,
    color: '#2E86AB',
    fontWeight: '600',
  },
  lessonsContainer: {
    marginBottom: 20,
  },
  lessonsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  lessonType: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#2E86AB',
    marginBottom: 4,
  },
  lessonPreview: {
    fontSize: 12,
    color: '#495057',
    fontStyle: 'italic',
  },
  emptyLessons: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyLessonsText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '600',
    marginLeft: 6,
  },
  quizAction: {
    backgroundColor: '#2E86AB',
  },
  quizActionText: {
    color: '#fff',
  },
});
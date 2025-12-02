// screens/admin/EditLessonScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, update, get, serverTimestamp } from 'firebase/database';

const EditLessonScreen = ({ navigation, route }) => {
  const { courseId, sectionId, lessonId } = route.params || {};
  const [lesson, setLesson] = useState({
    title: '',
    content: '',
    type: 'video',
    duration: '',
    url: '',
    order: 1,
    options: ['', '', '', ''],
    correctAnswer: 'A',
    maxScore: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [lessonType, setLessonType] = useState('video');

  const db = getDatabase();

  useEffect(() => {
    if (lessonId) {
      loadLessonData();
    } else {
      setIsLoadingLesson(false);
    }
  }, [lessonId]);

  const loadLessonData = async () => {
    try {
      const lessonRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
      const snapshot = await get(lessonRef);
      
      if (snapshot.exists()) {
        const lessonData = snapshot.val();
        setLesson({
          ...lesson,
          title: lessonData.title || '',
          content: lessonData.content || '',
          type: lessonData.type || 'video',
          duration: lessonData.duration || '',
          url: lessonData.url || '',
          order: lessonData.order || 1,
          options: lessonData.options || ['', '', '', ''],
          correctAnswer: lessonData.correctAnswer || 'A',
          maxScore: lessonData.maxScore || 10,
        });
        setLessonType(lessonData.type || 'video');
      } else {
        Alert.alert('Error', 'Lesson not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      Alert.alert('Error', 'Failed to load lesson data');
      navigation.goBack();
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const handleInputChange = (field, value) => {
    setLesson(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateQuizOption = (index, value) => {
    const updatedOptions = [...lesson.options];
    updatedOptions[index] = value;
    setLesson(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  const validateLesson = () => {
    if (!lesson.title.trim()) {
      Alert.alert('Error', 'Please enter a lesson title');
      return false;
    }

    if (lessonType === 'video' || lessonType === 'document') {
      if (!lesson.url.trim()) {
        Alert.alert('Error', `Please enter a ${lessonType} URL`);
        return false;
      }
    }

    if (lessonType === 'quiz') {
      const emptyOptions = lesson.options.filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        Alert.alert('Error', 'Please fill all quiz options');
        return false;
      }
      if (!lesson.content.trim()) {
        Alert.alert('Error', 'Please enter the quiz question');
        return false;
      }
    }

    return true;
  };

  const updateLesson = async () => {
    if (!validateLesson()) return;

    setIsLoading(true);

    try {
      const lessonRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
      
      const lessonData = {
        title: lesson.title.trim(),
        content: lesson.content.trim() || '',
        type: lessonType,
        duration: lesson.duration.trim() || '10:00',
        url: lesson.url.trim() || '',
        order: parseInt(lesson.order) || 1,
        updatedAt: serverTimestamp(),
        ...(lessonType === 'quiz' && {
          options: lesson.options.map(opt => opt.trim()),
          correctAnswer: lesson.correctAnswer,
          maxScore: parseInt(lesson.maxScore) || 10,
        }),
        ...((lessonType === 'video' || lessonType === 'document') && {
          fileType: getFileType(lesson.url),
        }),
      };

      await update(lessonRef, lessonData);

      // Also update the section's last updated timestamp
      const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      await update(sectionRef, {
        updatedAt: serverTimestamp(),
      });

      setIsLoading(false);
      Alert.alert(
        'Success',
        'Lesson updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Edit Another',
            onPress: () => {
              // Optionally reset form for editing another lesson
              // Or go back to section edit screen
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      setIsLoading(false);
      console.error('Error updating lesson:', error);
      Alert.alert('Error', 'Failed to update lesson. Please try again.');
    }
  };

  const getFileType = (url) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    return 'file';
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'text': return 'document-text';
      case 'document': return 'document-attach';
      case 'quiz': return 'help-circle';
      default: return 'document';
    }
  };

  const getLessonTypeColor = (type) => {
    switch (type) {
      case 'video': return '#dc3545';
      case 'text': return '#28a745';
      case 'document': return '#17a2b8';
      case 'quiz': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (isLoadingLesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Lesson</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Lesson Form */}
          <View style={styles.form}>
            {/* Lesson Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lesson Type</Text>
              <View style={styles.typeButtons}>
                {['video', 'document', 'text', 'quiz'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      lessonType === type && styles.typeButtonActive
                    ]}
                    onPress={() => setLessonType(type)}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={getLessonTypeIcon(type)} 
                      size={20} 
                      color={lessonType === type ? '#fff' : getLessonTypeColor(type)} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      lessonType === type && styles.typeButtonTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lesson Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lesson Title *</Text>
              <TextInput
                style={styles.input}
                value={lesson.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter lesson title"
                editable={!isLoading}
              />
            </View>

            {/* Content/Question */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {lessonType === 'quiz' ? 'Question *' : 'Content'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={lesson.content}
                onChangeText={(value) => handleInputChange('content', value)}
                placeholder={
                  lessonType === 'quiz' 
                    ? "Enter the quiz question" 
                    : "Enter lesson content or description"
                }
                multiline
                numberOfLines={lessonType === 'quiz' ? 3 : 4}
                editable={!isLoading}
              />
            </View>

            {/* URL for Video/Document */}
            {(lessonType === 'video' || lessonType === 'document') && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {lessonType === 'video' ? 'Video URL *' : 'Document URL *'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={lesson.url}
                  onChangeText={(value) => handleInputChange('url', value)}
                  placeholder={`Enter ${lessonType} URL (YouTube, PDF, etc.)`}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {lesson.url ? (
                  <Text style={styles.urlHint}>
                    Current: {lesson.url.length > 50 ? lesson.url.substring(0, 50) + '...' : lesson.url}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Quiz Options */}
            {lessonType === 'quiz' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quiz Options *</Text>
                  {['A', 'B', 'C', 'D'].map((option, index) => (
                    <View key={option} style={styles.quizOptionRow}>
                      <Text style={styles.quizOptionLabel}>Option {option}:</Text>
                      <TextInput
                        style={styles.quizOptionInput}
                        value={lesson.options[index]}
                        onChangeText={(text) => updateQuizOption(index, text)}
                        placeholder={`Enter option ${option}`}
                        editable={!isLoading}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correct Answer *</Text>
                  <View style={styles.correctAnswerButtons}>
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.correctAnswerButton,
                          lesson.correctAnswer === option && styles.correctAnswerButtonActive
                        ]}
                        onPress={() => handleInputChange('correctAnswer', option)}
                        disabled={isLoading}
                      >
                        <Text style={[
                          styles.correctAnswerButtonText,
                          lesson.correctAnswer === option && styles.correctAnswerButtonTextActive
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Maximum Score</Text>
                  <TextInput
                    style={styles.input}
                    value={lesson.maxScore.toString()}
                    onChangeText={(value) => handleInputChange('maxScore', value)}
                    placeholder="Enter maximum score"
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                </View>
              </>
            )}

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration (Optional)</Text>
              <TextInput
                style={styles.input}
                value={lesson.duration}
                onChangeText={(value) => handleInputChange('duration', value)}
                placeholder="e.g., 10:00 (MM:SS)"
                editable={!isLoading}
              />
            </View>

            {/* Order */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Order in Section</Text>
              <TextInput
                style={styles.input}
                value={lesson.order.toString()}
                onChangeText={(value) => handleInputChange('order', value)}
                placeholder="Lesson order number"
                keyboardType="number-pad"
                editable={!isLoading}
              />
            </View>

            {/* Update Button */}
            <TouchableOpacity 
              style={[styles.updateBtn, isLoading && styles.disabledBtn]}
              onPress={updateLesson}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save" size={24} color="#fff" />
                  <Text style={styles.updateBtnText}>Update Lesson</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert(
                  'Delete Lesson',
                  'Are you sure you want to delete this lesson? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const lessonRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
                          await update(lessonRef, null); // Remove from Firebase
                          
                          // Update section lessons count
                          const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
                          const sectionSnapshot = await get(sectionRef);
                          if (sectionSnapshot.exists()) {
                            const sectionData = sectionSnapshot.val();
                            await update(sectionRef, {
                              lessonsCount: Math.max(0, (sectionData.lessonsCount || 1) - 1),
                              updatedAt: serverTimestamp(),
                            });
                          }
                          
                          Alert.alert('Success', 'Lesson deleted successfully');
                          navigation.goBack();
                        } catch (error) {
                          console.error('Error deleting lesson:', error);
                          Alert.alert('Error', 'Failed to delete lesson');
                        }
                      }
                    }
                  ]
                );
              }}
              disabled={isLoading}
            >
              <Ionicons name="trash-outline" size={24} color="#fff" />
              <Text style={styles.deleteBtnText}>Delete Lesson</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    minWidth: 100,
  },
  typeButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  urlHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  quizOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizOptionLabel: {
    width: 70,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quizOptionInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 14,
  },
  correctAnswerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  correctAnswerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  correctAnswerButtonActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  correctAnswerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  correctAnswerButtonTextActive: {
    color: '#fff',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledBtn: {
    backgroundColor: '#adb5bd',
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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
});

export default EditLessonScreen;
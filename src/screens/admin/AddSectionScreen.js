// AddSectionScreen.js - Updated to always navigate to EditLessonScreen
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, push, set, update, serverTimestamp, get, remove } from 'firebase/database';

const AddSectionScreen = ({ navigation, route }) => {
  const { courseId, sectionId } = route.params || {};
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [sectionOrder, setSectionOrder] = useState('');
  const [sectionType, setSectionType] = useState('video');
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonType, setNewLessonType] = useState('video');
  const [newLessonDuration, setNewLessonDuration] = useState('');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonQuizOptions, setNewLessonQuizOptions] = useState(['', '', '', '']);
  const [newLessonCorrectAnswer, setNewLessonCorrectAnswer] = useState('A');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const db = getDatabase();

  useEffect(() => {
    if (sectionId) {
      setIsEditMode(true);
      loadSectionData();
    } else {
      loadSectionsCount();
    }
  }, [sectionId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (sectionId) {
        loadExistingLessons();
      }
    });

    return unsubscribe;
  }, [navigation, sectionId]);

  const loadSectionData = async () => {
    setIsLoadingLessons(true);
    try {
      const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      const sectionSnapshot = await get(sectionRef);
      
      if (sectionSnapshot.exists()) {
        const sectionData = sectionSnapshot.val();
        setSectionTitle(sectionData.title || '');
        setSectionDescription(sectionData.description || '');
        setSectionOrder(sectionData.order?.toString() || '');
        setSectionType(sectionData.type || 'video');
        
        await loadExistingLessons();
      }
    } catch (error) {
      console.error('Error loading section data:', error);
      Alert.alert('Error', 'Failed to load section data');
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const loadExistingLessons = async () => {
    try {
      const lessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
      const snapshot = await get(lessonsRef);
      
      if (snapshot.exists()) {
        const lessonsData = snapshot.val();
        const lessonsArray = Object.keys(lessonsData).map(key => ({
          id: key,
          ...lessonsData[key],
          firebaseId: key,
        }));
        
        lessonsArray.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(lessonsArray);
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
      Alert.alert('Error', 'Failed to load lessons');
    }
  };

  const loadSectionsCount = async () => {
    try {
      const courseSectionsRef = ref(db, `courses/${courseId}/sections`);
      const snapshot = await get(courseSectionsRef);
      if (snapshot.exists()) {
        const sections = snapshot.val();
        const sectionsCount = Object.keys(sections).length;
        setSectionOrder((sectionsCount + 1).toString());
      } else {
        setSectionOrder('1');
      }
    } catch (error) {
      console.error('Error loading sections count:', error);
      setSectionOrder('1');
    }
  };

  const addNewLesson = async () => {
    if (!newLessonTitle.trim()) {
      Alert.alert('Error', 'Please enter a lesson title');
      return;
    }

    // Validate based on lesson type
    if (newLessonType === 'video' || newLessonType === 'document') {
      if (!newLessonUrl.trim()) {
        Alert.alert('Error', `Please enter a ${newLessonType} URL`);
        return;
      }
    }

    if (newLessonType === 'quiz') {
      const emptyOptions = newLessonQuizOptions.filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        Alert.alert('Error', 'Please fill all quiz options');
        return;
      }
      if (!newLessonContent.trim()) {
        Alert.alert('Error', 'Please enter the quiz question');
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Prepare lesson data
      const lessonData = {
        title: newLessonTitle.trim(),
        content: newLessonContent.trim() || '',
        type: newLessonType,
        duration: newLessonDuration.trim() || '10:00',
        url: newLessonUrl.trim(),
        order: editingLessonId ? 
          lessons.find(l => l.id === editingLessonId)?.order || lessons.length + 1 : 
          lessons.length + 1,
        updatedAt: serverTimestamp(),
        ...(newLessonType === 'quiz' && {
          options: newLessonQuizOptions.map(opt => opt.trim()),
          correctAnswer: newLessonCorrectAnswer,
          maxScore: 10,
        }),
        ...((newLessonType === 'video' || newLessonType === 'document') && {
          fileType: getFileType(newLessonUrl),
        }),
      };

      let lessonFirebaseId = editingLessonId;

      if (isEditMode && sectionId) {
        // Save to Firebase when editing an existing section
        if (editingLessonId && lessons.find(l => l.id === editingLessonId)?.firebaseId) {
          // Update existing Firebase lesson
          const lessonRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons/${editingLessonId}`);
          await update(lessonRef, lessonData);
          lessonFirebaseId = editingLessonId;
        } else {
          // Create new lesson in Firebase
          const sectionLessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
          const newLessonRef = push(sectionLessonsRef);
          lessonFirebaseId = newLessonRef.key;
          await set(newLessonRef, {
            ...lessonData,
            createdAt: serverTimestamp(),
          });
        }

        // Update local state
        const updatedLessons = editingLessonId ? 
          lessons.map(lesson => 
            lesson.id === editingLessonId ? 
            { ...lessonData, id: editingLessonId, firebaseId: lessonFirebaseId } : lesson
          ) : 
          [...lessons, { ...lessonData, id: Date.now().toString(), firebaseId: lessonFirebaseId }];
        
        setLessons(updatedLessons);
        
        // Update section lessons count
        const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
        await update(sectionRef, {
          lessonsCount: updatedLessons.length,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Local only (for new sections not saved yet)
        const newLesson = {
          ...lessonData,
          id: editingLessonId || Date.now().toString(),
        };

        if (editingLessonId) {
          setLessons(lessons.map(lesson => 
            lesson.id === editingLessonId ? newLesson : lesson
          ));
        } else {
          setLessons([...lessons, newLesson]);
        }
      }

      Alert.alert('Success', editingLessonId ? 'Lesson updated successfully!' : 'Lesson added successfully');
      resetLessonForm();
    } catch (error) {
      console.error('Error saving lesson:', error);
      Alert.alert('Error', 'Failed to save lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetLessonForm = () => {
    setNewLessonTitle('');
    setNewLessonContent('');
    setNewLessonType(sectionType === 'quiz' || sectionType === 'test' ? 'quiz' : 'video');
    setNewLessonDuration('');
    setNewLessonUrl('');
    setNewLessonQuizOptions(['', '', '', '']);
    setNewLessonCorrectAnswer('A');
    setShowLessonModal(false);
    setEditingLessonId(null);
  };

  const editLesson = (lesson) => {
    if (isEditMode && sectionId) {
      // For Firebase lessons, navigate to EditLessonScreen
      navigation.navigate('EditLesson', {
        courseId,
        sectionId,
        lessonId: lesson.firebaseId || lesson.id,
      });
    } else {
      // For local lessons (when creating new section), show modal
      setNewLessonTitle(lesson.title || '');
      setNewLessonContent(lesson.content || '');
      setNewLessonType(lesson.type || 'video');
      setNewLessonDuration(lesson.duration || '');
      setNewLessonUrl(lesson.url || '');
      
      if (lesson.type === 'quiz') {
        setNewLessonQuizOptions(lesson.options || ['', '', '', '']);
        setNewLessonCorrectAnswer(lesson.correctAnswer || 'A');
      }
      
      setEditingLessonId(lesson.id);
      setShowLessonModal(true);
    }
  };

  const deleteLessonFromFirebase = async (lessonId) => {
    if (!lessonId || !sectionId) return;
    
    try {
      setIsLoading(true);
      const lessonRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
      await remove(lessonRef);
      
      // Update local state
      const updatedLessons = lessons.filter(lesson => lesson.firebaseId !== lessonId);
      setLessons(updatedLessons);
      
      // Update section lessons count
      const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      await update(sectionRef, {
        lessonsCount: updatedLessons.length,
        updatedAt: serverTimestamp(),
      });
      
      Alert.alert('Success', 'Lesson deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      Alert.alert('Error', 'Failed to delete lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const removeLesson = (lesson) => {
    if (isEditMode && sectionId && lesson.firebaseId) {
      Alert.alert(
        'Delete Lesson',
        'Are you sure you want to delete this lesson?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => deleteLessonFromFirebase(lesson.firebaseId)
          }
        ]
      );
    } else {
      setLessons(lessons.filter(l => l.id !== lesson.id));
    }
  };

  const createOrUpdateSection = async () => {
    if (!sectionTitle.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    if (lessons.length === 0) {
      Alert.alert('Error', 'Please add at least one lesson');
      return;
    }

    setIsLoading(true);

    try {
      const sectionData = {
        title: sectionTitle.trim(),
        description: sectionDescription.trim() || '',
        type: sectionType,
        order: parseInt(sectionOrder) || 1,
        lessonsCount: lessons.length,
        updatedAt: serverTimestamp(),
        ...(sectionType === 'quiz' && {
          totalQuestions: lessons.length,
          passingScore: 70,
        }),
        ...(sectionType === 'test' && {
          totalQuestions: lessons.length,
          passingScore: 60,
          timeLimit: 3600,
        }),
        ...(sectionType === 'video' && {
          totalDuration: calculateTotalDuration(),
        }),
      };

      let sectionIdToUse = sectionId;

      if (isEditMode) {
        // Update existing section
        const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
        await update(sectionRef, sectionData);
        
        // Check if there are any local-only lessons to save to Firebase
        const localLessons = lessons.filter(lesson => !lesson.firebaseId);
        if (localLessons.length > 0) {
          const savePromises = localLessons.map(async (lesson) => {
            const lessonData = {
              title: lesson.title,
              content: lesson.content,
              type: lesson.type,
              duration: lesson.duration,
              url: lesson.url,
              order: lesson.order,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              ...(lesson.type === 'quiz' && {
                options: lesson.options || [],
                correctAnswer: lesson.correctAnswer || 'A',
                maxScore: lesson.maxScore || 10,
              }),
              ...((lesson.type === 'video' || lesson.type === 'document') && {
                fileType: getFileType(lesson.url),
              }),
            };

            const newLessonRef = push(ref(db, `courses/${courseId}/sections/${sectionId}/lessons`));
            return set(newLessonRef, lessonData);
          });

          await Promise.all(savePromises);
        }
      } else {
        // Create new section
        const courseSectionsRef = ref(db, `courses/${courseId}/sections`);
        const newSectionRef = push(courseSectionsRef);
        sectionIdToUse = newSectionRef.key;

        await set(newSectionRef, {
          ...sectionData,
          createdAt: serverTimestamp(),
        });

        // Save lessons to Firebase
        const lessonsPromises = lessons.map(async (lesson, index) => {
          const lessonData = {
            title: lesson.title,
            content: lesson.content,
            type: lesson.type,
            duration: lesson.duration,
            url: lesson.url,
            order: index + 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...(lesson.type === 'quiz' && {
              options: lesson.options || [],
              correctAnswer: lesson.correctAnswer || 'A',
              maxScore: lesson.maxScore || 10,
            }),
            ...((lesson.type === 'video' || lesson.type === 'document') && {
              fileType: getFileType(lesson.url),
            }),
          };

          const sectionLessonsRef = ref(db, `courses/${courseId}/sections/${sectionIdToUse}/lessons`);
          const newLessonRef = push(sectionLessonsRef);
          return set(newLessonRef, lessonData);
        });

        await Promise.all(lessonsPromises);

        // Update course with section count
        const courseRef = ref(db, `courses/${courseId}`);
        const courseSnapshot = await get(courseRef);
        if (courseSnapshot.exists()) {
          const courseData = courseSnapshot.val();
          const sectionTypeCount = courseData.sectionTypeCount || {};
          sectionTypeCount[sectionType] = (sectionTypeCount[sectionType] || 0) + 1;
          
          await update(courseRef, {
            totalSections: (courseData.totalSections || 0) + 1,
            sectionTypeCount: sectionTypeCount,
            updatedAt: serverTimestamp(),
          });
        }
      }

      setIsLoading(false);
      Alert.alert(
        'Success',
        `${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} section ${isEditMode ? 'updated' : 'created'} successfully!`,
        [
          {
            text: 'Add Another',
            style: 'default',
            onPress: () => {
              if (!isEditMode) {
                setSectionTitle('');
                setSectionDescription('');
                setLessons([]);
                loadSectionsCount();
              } else {
                navigation.goBack();
              }
            },
          },
          {
            text: 'Done',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setIsLoading(false);
      console.error('Error saving section:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} section. Please try again.`);
    }
  };

  const calculateTotalDuration = () => {
    let totalSeconds = 0;
    lessons.forEach(lesson => {
      if (lesson.duration) {
        const [minutes, seconds] = lesson.duration.split(':').map(Number);
        totalSeconds += (minutes * 60) + (seconds || 0);
      }
    });
    return totalSeconds;
  };

  const getFileType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
    if (['mp4', 'mov', 'avi'].includes(extension)) return 'video';
    return 'file';
  };

  const updateQuizOption = (index, value) => {
    const updatedOptions = [...newLessonQuizOptions];
    updatedOptions[index] = value;
    setNewLessonQuizOptions(updatedOptions);
  };

  const getSectionTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return 'help-circle';
      case 'test': return 'school';
      case 'video': return 'videocam';
      case 'document': return 'document-text';
      default: return 'folder';
    }
  };

  const getSectionTypeColor = (type) => {
    switch (type) {
      case 'quiz': return '#ffc107';
      case 'test': return '#dc3545';
      case 'video': return '#dc3545';
      case 'document': return '#28a745';
      default: return '#6c757d';
    }
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

  if (isLoadingLessons) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
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
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit Section' : 'Add New Section'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Section Form */}
          <View style={styles.form}>
            {/* Section Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Section Type *</Text>
              <View style={styles.typeButtons}>
                {['video', 'quiz', 'test', 'document'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      sectionType === type && styles.typeButtonActive
                    ]}
                    onPress={() => setSectionType(type)}
                    disabled={isEditMode}
                  >
                    <Ionicons 
                      name={getSectionTypeIcon(type)} 
                      size={20} 
                      color={sectionType === type ? '#fff' : getSectionTypeColor(type)} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      sectionType === type && styles.typeButtonTextActive,
                      isEditMode && styles.disabledText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Section Title *</Text>
              <TextInput
                style={styles.input}
                value={sectionTitle}
                onChangeText={setSectionTitle}
                placeholder={`Enter ${sectionType} section title`}
                editable={!isLoading}
              />
            </View>

            {/* Section Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={sectionDescription}
                onChangeText={setSectionDescription}
                placeholder="Enter section description"
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>

            {/* Section Order */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Order</Text>
              <TextInput
                style={styles.input}
                value={sectionOrder}
                onChangeText={setSectionOrder}
                placeholder="Section order number"
                keyboardType="number-pad"
                editable={!isLoading}
              />
            </View>

            {/* Lessons Section */}
            <View style={styles.lessonsContainer}>
              <View style={styles.lessonsHeader}>
                <Text style={styles.lessonsTitle}>
                  {sectionType === 'quiz' ? 'Quiz Questions' : 
                   sectionType === 'test' ? 'Test Questions' : 
                   'Lessons'} ({lessons.length})
                </Text>
                <TouchableOpacity 
                  style={styles.addLessonBtn} 
                  onPress={() => setShowLessonModal(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="add-circle" size={24} color="#007bff" />
                  <Text style={styles.addLessonText}>
                    {sectionType === 'quiz' || sectionType === 'test' ? 'Add Question' : 'Add Lesson'}
                  </Text>
                </TouchableOpacity>
              </View>

              {lessons.map((lesson) => (
                <TouchableOpacity 
                  key={lesson.id} 
                  style={styles.lessonItem}
                  onPress={() => editLesson(lesson)}
                  disabled={isLoading}
                >
                  <View style={styles.lessonInfo}>
                    <View style={styles.lessonHeader}>
                      <Ionicons 
                        name={getLessonTypeIcon(lesson.type)} 
                        size={20} 
                        color={getLessonTypeColor(lesson.type)} 
                      />
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      {lesson.firebaseId && (
                        <View style={styles.savedBadge}>
                          <Ionicons name="cloud-done" size={12} color="#28a745" />
                          <Text style={styles.savedBadgeText}>Saved</Text>
                        </View>
                      )}
                    </View>
                    {lesson.content ? (
                      <Text style={styles.lessonContent} numberOfLines={1}>
                        {lesson.content}
                      </Text>
                    ) : null}
                    {lesson.url ? (
                      <Text style={styles.lessonUrl} numberOfLines={1}>
                        {lesson.url}
                      </Text>
                    ) : null}
                    {lesson.type === 'quiz' && (
                      <Text style={styles.quizInfo}>
                        Options: {lesson.options?.length || 0} | Correct: {lesson.correctAnswer}
                      </Text>
                    )}
                    <Text style={styles.lessonDuration}>Duration: {lesson.duration}</Text>
                    <Text style={styles.lessonOrder}>Order: {lesson.order}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeLesson(lesson)}
                    disabled={isLoading}
                  >
                    <Ionicons name="trash-outline" size={24} color="#dc3545" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              {lessons.length === 0 && (
                <View style={styles.emptyLessons}>
                  <Ionicons name={
                    sectionType === 'quiz' ? 'help-circle-outline' :
                    sectionType === 'test' ? 'school-outline' :
                    sectionType === 'video' ? 'videocam-outline' :
                    'document-outline'
                  } size={48} color="#adb5bd" />
                  <Text style={styles.emptyLessonsText}>
                    {sectionType === 'quiz' ? 'No quiz questions added yet.' :
                     sectionType === 'test' ? 'No test questions added yet.' :
                     'No lessons added yet.'}
                  </Text>
                  <Text style={styles.emptyLessonsSubText}>
                    Click "Add {sectionType === 'quiz' || sectionType === 'test' ? 'Question' : 'Lesson'}" to create content.
                  </Text>
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.createBtn, isLoading && styles.disabledBtn]}
              onPress={createOrUpdateSection}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={isEditMode ? "save" : "folder-open"} size={24} color="#fff" />
                  <Text style={styles.createBtnText}>
                    {isEditMode ? 'Update' : 'Create'} {sectionType === 'quiz' ? 'Quiz' : 
                           sectionType === 'test' ? 'Test' : 
                           sectionType === 'video' ? 'Video' : 
                           'Document'} Section
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add/Edit Lesson Modal - Only for local lessons when creating new section */}
      <Modal
        transparent={true}
        visible={showLessonModal}
        animationType="slide"
        onRequestClose={resetLessonForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLessonId ? 'Edit Lesson' : 
                 sectionType === 'quiz' || sectionType === 'test' ? 'Add Quiz Question' : 'Add Lesson'}
              </Text>
              <TouchableOpacity onPress={resetLessonForm}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>
                  {sectionType === 'quiz' || sectionType === 'test' ? 'Question *' : 'Lesson Title *'}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={newLessonTitle}
                  onChangeText={setNewLessonTitle}
                  placeholder={
                    sectionType === 'quiz' || sectionType === 'test' ? 
                    "Enter question" : 
                    "Enter lesson title"
                  }
                  editable={!isLoading}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Lesson Type</Text>
                <View style={styles.typeButtons}>
                  {(sectionType === 'quiz' || sectionType === 'test' ? 
                    ['quiz'] : ['video', 'document', 'text']).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        newLessonType === type && styles.typeButtonActive
                      ]}
                      onPress={() => setNewLessonType(type)}
                      disabled={isLoading}
                    >
                      <Ionicons 
                        name={getLessonTypeIcon(type)} 
                        size={20} 
                        color={newLessonType === type ? '#fff' : getLessonTypeColor(type)} 
                      />
                      <Text style={[
                        styles.typeButtonText,
                        newLessonType === type && styles.typeButtonTextActive
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(newLessonType === 'video' || newLessonType === 'document') && (
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalLabel}>
                    {newLessonType === 'video' ? 'Video URL *' : 'Document URL *'}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newLessonUrl}
                    onChangeText={setNewLessonUrl}
                    placeholder={`Enter ${newLessonType} URL (YouTube, PDF, etc.)`}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>
                  {newLessonType === 'quiz' ? 'Question Details *' : 'Content'}
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={newLessonContent}
                  onChangeText={setNewLessonContent}
                  placeholder={
                    newLessonType === 'quiz' ? 
                    "Enter the full question and any additional information" :
                    "Enter lesson content or description"
                  }
                  multiline
                  numberOfLines={newLessonType === 'quiz' ? 3 : 4}
                  editable={!isLoading}
                />
              </View>

              {newLessonType === 'quiz' && (
                <>
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Quiz Options *</Text>
                    {['A', 'B', 'C', 'D'].map((option, index) => (
                      <View key={option} style={styles.quizOptionRow}>
                        <Text style={styles.quizOptionLabel}>Option {option}:</Text>
                        <TextInput
                          style={styles.quizOptionInput}
                          value={newLessonQuizOptions[index]}
                          onChangeText={(text) => updateQuizOption(index, text)}
                          placeholder={`Enter option ${option}`}
                          editable={!isLoading}
                        />
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Correct Answer *</Text>
                    <View style={styles.correctAnswerButtons}>
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.correctAnswerButton,
                            newLessonCorrectAnswer === option && styles.correctAnswerButtonActive
                          ]}
                          onPress={() => setNewLessonCorrectAnswer(option)}
                          disabled={isLoading}
                        >
                          <Text style={[
                            styles.correctAnswerButtonText,
                            newLessonCorrectAnswer === option && styles.correctAnswerButtonTextActive
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Duration (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newLessonDuration}
                  onChangeText={setNewLessonDuration}
                  placeholder="e.g., 10:00 (MM:SS)"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity 
                style={[styles.modalAddButton, isLoading && styles.disabledBtn]}
                onPress={addNewLesson}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name={editingLessonId ? "save" : "add-circle"} size={24} color="#fff" />
                    <Text style={styles.modalAddButtonText}>
                      {editingLessonId ? 'Update Lesson' : 
                      sectionType === 'quiz' || sectionType === 'test' ? 'Add Question' : 'Add Lesson'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={resetLessonForm}
                disabled={isLoading}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  disabledText: {
    color: '#999',
  },
  lessonsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  lessonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lessonsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addLessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLessonText: {
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 4,
  },
  lessonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savedBadgeText: {
    fontSize: 10,
    color: '#28a745',
    marginLeft: 2,
  },
  lessonContent: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lessonUrl: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 2,
  },
  quizInfo: {
    fontSize: 12,
    color: '#ffc107',
    marginTop: 2,
  },
  lessonDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  lessonOrder: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  emptyLessons: {
    alignItems: 'center',
    padding: 32,
  },
  emptyLessonsText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyLessonsSubText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 4,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  disabledBtn: {
    backgroundColor: '#adb5bd',
  },
  createBtnText: {
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  },
  modalScroll: {
    padding: 20,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    fontSize: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  modalAddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalCancelButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  modalCancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddSectionScreen;
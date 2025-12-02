// Update the CreateCourseScreen.js (with fixes)
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, push, set, update, serverTimestamp, get } from 'firebase/database';

const CreateCourseScreen = ({ navigation, route }) => {
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const courseId = route.params?.courseId;
  const isEditMode = !!courseId;
  const db = getDatabase();

  // Load course data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const courseRef = ref(db, `courses/${courseId}`);
      const snapshot = await get(courseRef);
      if (snapshot.exists()) {
        const courseData = snapshot.val();
        setCourseTitle(courseData.title || '');
        setCourseDescription(courseData.description || '');
        setInstructor(courseData.instructor || '');
        setDuration(courseData.duration || '');
        setPrice(courseData.price?.toString() || '');
        setCategory(courseData.category || '');
        setThumbnailUrl(courseData.thumbnailUrl || '');
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      Alert.alert('Error', 'Failed to load course data');
    }
  };

  const createCourse = async () => {
    if (!courseTitle.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    if (!courseDescription.trim()) {
      Alert.alert('Error', 'Please enter a course description');
      return;
    }

    if (!instructor.trim()) {
      Alert.alert('Error', 'Please enter an instructor name');
      return;
    }

    setIsLoading(true);

    try {
      const courseData = {
        title: courseTitle.trim(),
        description: courseDescription.trim(),
        instructor: instructor.trim(),
        duration: duration.trim() || '12 weeks',
        price: price ? parseFloat(price) : 0,
        category: category.trim() || 'General',
        thumbnailUrl: thumbnailUrl.trim() || '',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalSections: 0,
        enrolledStudents: 0,
      };

      if (isEditMode) {
        // Update existing course
        const courseRef = ref(db, `courses/${courseId}`);
        await update(courseRef, {
          ...courseData,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new course
        const coursesRef = ref(db, 'courses');
        const newCourseRef = push(coursesRef);
        await set(newCourseRef, courseData);
      }

      setIsLoading(false);
      Alert.alert(
        'Success',
        isEditMode ? 'Course updated successfully!' : 'Course created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setIsLoading(false);
      console.error('Error saving course:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} course. Please try again.`);
    }
  };

  // Navigate to Add Section screen
  const navigateToAddSection = () => {
    if (!courseId && !isEditMode) {
      Alert.alert('Error', 'Please save the course first before adding sections');
      return;
    }
    navigation.navigate('AddSection', { courseId: courseId || '' });
  };

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
              {isEditMode ? 'Edit Course' : 'Create New Course'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Course Details Form */}
          <View style={styles.form}>
            {/* Thumbnail URL Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Thumbnail URL (Optional)</Text>
              <TextInput
                style={styles.input}
                value={thumbnailUrl}
                onChangeText={setThumbnailUrl}
                placeholder="Enter image URL (http://...)"
                autoCapitalize="none"
              />
            </View>

            {/* Course Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Course Title *</Text>
              <TextInput
                style={styles.input}
                value={courseTitle}
                onChangeText={setCourseTitle}
                placeholder="Enter course title"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={courseDescription}
                onChangeText={setCourseDescription}
                placeholder="Enter course description"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Instructor */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instructor *</Text>
              <TextInput
                style={styles.input}
                value={instructor}
                onChangeText={setInstructor}
                placeholder="Enter instructor name"
              />
            </View>

            {/* Duration & Price */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="e.g., 12 weeks"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Price ($)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Mathematics, Science"
              />
            </View>

            {/* Create/Update Button */}
            <TouchableOpacity 
              style={[styles.createBtn, isLoading && styles.disabledBtn]}
              onPress={createCourse}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.createBtnText}>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </Text>
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
                  <Text style={styles.createBtnText}>
                    {isEditMode ? 'Update Course' : 'Create Course'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Upload Sections Button (visible in edit mode) */}
            {isEditMode && (
              <TouchableOpacity 
                style={styles.uploadSectionsBtn}
                onPress={navigateToAddSection}
              >
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.uploadSectionsBtnText}>
                  Upload Sections & Content
                </Text>
              </TouchableOpacity>
            )}
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
  row: {
    flexDirection: 'row',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
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
  uploadSectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 40,
  },
  uploadSectionsBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CreateCourseScreen;
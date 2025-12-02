// Update the CreateCourseScreen.js (simplified version)
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
  const [sections, setSections] = useState([]);

  const courseId = route.params?.courseId;
  const isEditMode = !!courseId;
  const db = getDatabase();

  // Load course data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadCourseData();
    }
  }, [courseId]);

  // Also check if sections were passed from AddSectionScreen
  useEffect(() => {
    if (route.params?.sections) {
      setSections(route.params.sections);
    }
  }, [route.params?.sections]);

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
        setSections(courseData.sections || []);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    }
  };

  const navigateToAddSections = () => {
    navigation.navigate('AddSection', {
      courseId: courseId,
      existingSections: sections,
      onSaveSections: (updatedSections) => {
        setSections(updatedSections);
      }
    });
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

    // Removed sections validation - courses can now be saved without sections

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
        status: sections.length > 0 ? 'active' : 'draft', // Set status based on sections
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalSections: sections.length,
        enrolledStudents: 0,
        sections: sections,
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

  const removeSection = (sectionId) => {
    Alert.alert(
      'Remove Section',
      'Are you sure you want to remove this section?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newSections = sections.filter(s => s.id !== sectionId);
            const reorderedSections = newSections.map((section, index) => ({
              ...section,
              order: index + 1
            }));
            setSections(reorderedSections);
          },
        },
      ]
    );
  };

  const renderSection = ({ item, index }) => {
    const getTypeIcon = (type) => {
      switch (type) {
        case 'video': return 'videocam';
        case 'document': return 'document-text';
        case 'quiz': return 'help-circle';
        case 'assignment': return 'clipboard';
        default: return 'videocam';
      }
    };

    return (
      <View style={styles.sectionItem}>
        <View style={styles.sectionHeader}>
          <Ionicons 
            name={getTypeIcon(item.type)} 
            size={20} 
            color="#2E86AB" 
          />
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>
              Section {item.order || index + 1}: {item.title}
            </Text>
            <Text style={styles.sectionType}>
              Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeSectionBtn}
            onPress={() => removeSection(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#dc3545" />
          </TouchableOpacity>
        </View>
        
        {item.type === 'video' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentLabel}>Video URL:</Text>
            <Text style={styles.contentText} numberOfLines={1}>{item.content}</Text>
          </View>
        )}
        
        {item.type === 'document' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentLabel}>Document URL:</Text>
            <Text style={styles.contentText} numberOfLines={1}>{item.content}</Text>
          </View>
        )}
        
        {item.type === 'quiz' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentLabel}>Quiz:</Text>
            <Text style={styles.contentText}>
              {item.questions?.length || 0} questions • {item.totalPoints || 0} total points
            </Text>
          </View>
        )}
        
        {item.type === 'assignment' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentLabel}>Assignment:</Text>
            <Text style={styles.contentText}>
              Due: {item.assignmentDetails?.dueDate || 'Not set'} • {item.assignmentDetails?.maxPoints || 0} points
            </Text>
          </View>
        )}
      </View>
    );
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

            {/* Sections */}
            <View style={styles.sectionsHeader}>
              <View>
                <Text style={styles.label}>Course Sections (Optional)</Text>
                <Text style={styles.sectionCount}>
                  {sections.length} section{sections.length !== 1 ? 's' : ''} added
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.manageSectionsBtn}
                onPress={navigateToAddSections}
              >
                <Ionicons name="settings-outline" size={20} color="#fff" />
                <Text style={styles.manageSectionsText}>
                  {sections.length > 0 ? 'Manage Sections' : 'Add Sections'}
                </Text>
              </TouchableOpacity>
            </View>

            {sections.length > 0 ? (
              <View style={styles.sectionsList}>
                {sections.sort((a, b) => (a.order || 0) - (b.order || 0)).map((item, index) => (
                  <View key={item.id || index}>
                    {renderSection({ item, index })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptySections}>
                <Ionicons name="layers-outline" size={48} color="#6c757d" />
                <Text style={styles.emptyText}>No sections added yet</Text>
                <Text style={styles.emptySubText}>
                  Sections are optional. You can add them later by editing this course.
                </Text>
                <TouchableOpacity 
                  style={styles.addFirstSectionBtn}
                  onPress={navigateToAddSections}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addFirstSectionText}>Add Sections</Text>
                </TouchableOpacity>
              </View>
            )}

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
  sectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  manageSectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  manageSectionsText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  sectionsList: {
    marginBottom: 20,
  },
  sectionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionType: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  sectionContent: {
    marginLeft: 32,
    marginBottom: 10,
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 2,
  },
  contentText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  removeSectionBtn: {
    padding: 4,
  },
  emptySections: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  addFirstSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstSectionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
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
});

export default CreateCourseScreen;
// screens/admin/CreateCourseScreen.js (FIXED VERSION)
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
  Modal,
  FlatList,
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
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [currentSection, setCurrentSection] = useState({
    title: '',
    type: 'video',
    content: '',
  });

  const courseId = route.params?.courseId;
  const isEditMode = !!courseId;
  const db = getDatabase();

  const courseTypes = [
    { id: 1, name: 'Video Lecture', icon: 'videocam', type: 'video' },
    { id: 2, name: 'Document', icon: 'document-text', type: 'document' },
    { id: 3, name: 'Quiz', icon: 'help-circle', type: 'quiz' },
    { id: 4, name: 'Assignment', icon: 'clipboard', type: 'assignment' },
  ];

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
        setSections(courseData.sections || []);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    }
  };

  const addSection = () => {
    console.log('Adding section:', currentSection);
    
    if (!currentSection.title.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    if (!currentSection.content.trim()) {
      Alert.alert('Error', 'Please enter section content');
      return;
    }

    const newSection = {
      ...currentSection,
      id: Date.now().toString(),
      order: sections.length + 1,
      createdAt: new Date().toISOString(),
    };
    
    console.log('New section to add:', newSection);
    setSections(prevSections => [...prevSections, newSection]);
    
    // Reset form
    setCurrentSection({ 
      title: '', 
      type: 'video', 
      content: '' 
    });
    
    // Close modal
    setShowSectionModal(false);
    
    console.log('Sections after addition:', sections.length + 1);
  };

  const createCourse = async () => {
    console.log('Creating course with sections:', sections.length);
    
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

    if (sections.length === 0) {
      Alert.alert('Error', 'Please add at least one section to the course');
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
        totalSections: sections.length,
        enrolledStudents: 0,
        sections: sections, // Store sections directly in the course
      };

      console.log('Course data to save:', courseData);

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
            // Reorder sections
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

  const renderSection = ({ item, index }) => (
    <View style={styles.sectionItem}>
      <View style={styles.sectionHeader}>
        <Ionicons 
          name={courseTypes.find(t => t.type === item.type)?.icon || 'videocam'} 
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
      </View>
      <Text style={styles.sectionContent} numberOfLines={2}>
        {item.content}
      </Text>
      <TouchableOpacity 
        style={styles.removeSectionBtn}
        onPress={() => removeSection(item.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

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
              <Text style={styles.helperText}>
                Enter a direct URL to an image for the course thumbnail
              </Text>
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
                <Text style={styles.label}>Course Sections</Text>
                <Text style={styles.sectionCount}>
                  {sections.length} section{sections.length !== 1 ? 's' : ''} added
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.addSectionBtn}
                onPress={() => setShowSectionModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.addSectionText}>Add Section</Text>
              </TouchableOpacity>
            </View>

            {sections.length > 0 ? (
              <FlatList
                data={sections.sort((a, b) => (a.order || 0) - (b.order || 0))}
                renderItem={renderSection}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.sectionsList}
              />
            ) : (
              <View style={styles.emptySections}>
                <Ionicons name="layers-outline" size={48} color="#6c757d" />
                <Text style={styles.emptyText}>No sections added yet</Text>
                <Text style={styles.emptySubText}>
                  Add videos, documents, quizzes, or assignments
                </Text>
                <TouchableOpacity 
                  style={styles.addFirstSectionBtn}
                  onPress={() => setShowSectionModal(true)}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addFirstSectionText}>Add First Section</Text>
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

      {/* Section Modal */}
      <Modal
        visible={showSectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCurrentSection({ title: '', type: 'video', content: '' });
          setShowSectionModal(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Course Section</Text>
              <TouchableOpacity onPress={() => {
                setCurrentSection({ title: '', type: 'video', content: '' });
                setShowSectionModal(false);
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Section Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Section Type</Text>
                <View style={styles.typeGrid}>
                  {courseTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeOption,
                        currentSection.type === type.type && styles.selectedType,
                      ]}
                      onPress={() => {
                        console.log('Selected type:', type.type);
                        setCurrentSection({ ...currentSection, type: type.type });
                      }}
                    >
                      <Ionicons 
                        name={type.icon} 
                        size={24} 
                        color={currentSection.type === type.type ? '#fff' : '#2E86AB'} 
                      />
                      <Text style={[
                        styles.typeText,
                        currentSection.type === type.type && styles.selectedTypeText,
                      ]}>
                        {type.name}
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
                  value={currentSection.title}
                  onChangeText={(text) => {
                    console.log('Section title changed:', text);
                    setCurrentSection({ ...currentSection, title: text });
                  }}
                  placeholder="Enter section title"
                />
              </View>

              {/* Content/URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {currentSection.type === 'video' ? 'Video URL *' :
                   currentSection.type === 'document' ? 'Document URL *' :
                   currentSection.type === 'quiz' ? 'Quiz Instructions *' :
                   'Assignment Description *'}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={currentSection.content}
                  onChangeText={(text) => {
                    console.log('Section content changed:', text);
                    setCurrentSection({ ...currentSection, content: text });
                  }}
                  placeholder={
                    currentSection.type === 'video' ? 'Enter YouTube/Vimeo URL or video description' :
                    currentSection.type === 'document' ? 'Enter document URL or description' :
                    currentSection.type === 'quiz' ? 'Enter quiz instructions' :
                    'Enter assignment description'
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => {
                    setCurrentSection({ title: '', type: 'video', content: '' });
                    setShowSectionModal(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={addSection}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Section</Text>
                </TouchableOpacity>
              </View>
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
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
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
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addSectionText: {
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
    position: 'relative',
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
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  removeSectionBtn: {
    position: 'absolute',
    right: 10,
    top: 16,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E86AB',
    marginBottom: 10,
  },
  selectedType: {
    backgroundColor: '#2E86AB',
  },
  typeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
    textAlign: 'center',
  },
  selectedTypeText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    padding: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CreateCourseScreen;
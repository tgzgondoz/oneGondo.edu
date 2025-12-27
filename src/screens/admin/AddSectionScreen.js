// screens/admin/AddSectionScreen.js
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
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, push, set, update, remove, onValue, get } from 'firebase/database';

export default function AddSectionScreen({ navigation, route }) {
  const { courseId } = route.params || {};
  const [sections, setSections] = useState([]);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [lessons, setLessons] = useState({});
  const [expandedSection, setExpandedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const db = getDatabase();

  useEffect(() => {
    if (courseId) {
      fetchSections();
    }
  }, [courseId]);

  const fetchSections = () => {
    setLoading(true);
    try {
      const sectionsRef = ref(db, `courses/${courseId}/sections`);
      onValue(sectionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const sectionList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          // Sort by order
          sectionList.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSections(sectionList);
          
          // Fetch lessons for each section
          sectionList.forEach(section => {
            fetchLessonsForSection(section.id);
          });
        } else {
          setSections([]);
        }
        setLoading(false);
        setRefreshing(false);
      });
    } catch (error) {
      console.error('Error fetching sections:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLessonsForSection = (sectionId) => {
    const lessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
    onValue(lessonsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lessonList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by order
        lessonList.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(prev => ({
          ...prev,
          [sectionId]: lessonList
        }));
      } else {
        setLessons(prev => ({
          ...prev,
          [sectionId]: []
        }));
      }
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSections();
  };

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) {
      Alert.alert('Error', 'Please enter section title');
      return;
    }

    setUploading(true);

    try {
      if (editingSection) {
        // Update existing section
        const sectionRef = ref(db, `courses/${courseId}/sections/${editingSection.id}`);
        await update(sectionRef, {
          title: sectionTitle.trim(),
          description: sectionDescription.trim(),
          updatedAt: Date.now()
        });
        Alert.alert('Success', 'Section updated successfully!');
      } else {
        // Create new section
        const sectionsRef = ref(db, `courses/${courseId}/sections`);
        const newSectionRef = push(sectionsRef);
        const sectionOrder = sections.length + 1;
        
        await set(newSectionRef, {
          title: sectionTitle.trim(),
          description: sectionDescription.trim(),
          order: sectionOrder,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lessonsCount: 0
        });
        
        // Update course's total sections count
        const courseRef = ref(db, `courses/${courseId}`);
        const snapshot = await get(courseRef);
        if (snapshot.exists()) {
          const courseData = snapshot.val();
          await update(courseRef, {
            totalSections: (courseData.totalSections || 0) + 1,
            updatedAt: Date.now()
          });
        }
        
        Alert.alert('Success', 'Section created successfully!');
      }

      // Reset form
      setSectionTitle('');
      setSectionDescription('');
      setEditingSection(null);
      setIsModalVisible(false);
      setUploading(false);
      
    } catch (error) {
      console.error('Error saving section:', error);
      Alert.alert('Error', 'Failed to save section');
      setUploading(false);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionDescription(section.description || '');
    setIsModalVisible(true);
  };

  const handleDeleteSection = (sectionId) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section? All lessons in this section will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => deleteSection(sectionId)
        }
      ]
    );
  };

  const deleteSection = async (sectionId) => {
    try {
      const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      await remove(sectionRef);
      
      // Update course's total sections count
      const courseRef = ref(db, `courses/${courseId}`);
      const snapshot = await get(courseRef);
      if (snapshot.exists()) {
        const courseData = snapshot.val();
        await update(courseRef, {
          totalSections: Math.max(0, (courseData.totalSections || 0) - 1),
          updatedAt: Date.now()
        });
      }
      
      Alert.alert('Success', 'Section deleted successfully!');
    } catch (error) {
      console.error('Error deleting section:', error);
      Alert.alert('Error', 'Failed to delete section');
    }
  };

  const toggleSectionExpand = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handleAddLesson = (sectionId) => {
    navigation.navigate('EditLesson', { 
      courseId, 
      sectionId, 
      lessonId: null // Null for new lesson
    });
  };

  const handleEditLesson = (sectionId, lesson) => {
    navigation.navigate('EditLesson', { 
      courseId, 
      sectionId, 
      lessonId: lesson.id 
    });
  };

  const handleDeleteLesson = (sectionId, lessonId) => {
    Alert.alert(
      'Delete Lesson',
      'Are you sure you want to delete this lesson?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => deleteLesson(sectionId, lessonId)
        }
      ]
    );
  };

  const deleteLesson = async (sectionId, lessonId) => {
    try {
      const lessonRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
      await remove(lessonRef);
      
      // Update section lessons count
      const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      const snapshot = await get(sectionRef);
      if (snapshot.exists()) {
        const sectionData = snapshot.val();
        await update(sectionRef, {
          lessonsCount: Math.max(0, (sectionData.lessonsCount || 1) - 1),
          updatedAt: Date.now()
        });
      }
      
      Alert.alert('Success', 'Lesson deleted successfully!');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      Alert.alert('Error', 'Failed to delete lesson');
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video': return 'videocam-outline';
      case 'text': return 'document-text-outline';
      case 'document': return 'document-outline';
      case 'quiz': return 'help-circle-outline';
      default: return 'document-outline';
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

  const renderLessonItem = ({ item, sectionId }) => (
    <View style={styles.lessonItem}>
      <View style={styles.lessonInfo}>
        <Ionicons 
          name={getLessonIcon(item.type)} 
          size={20} 
          color={getLessonColor(item.type)} 
        />
        <View style={styles.lessonDetails}>
          <Text style={styles.lessonTitle}>{item.title}</Text>
          <Text style={styles.lessonMeta}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.duration ? ` • ${item.duration}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.lessonActions}>
        <TouchableOpacity 
          style={styles.lessonActionBtn}
          onPress={() => handleEditLesson(sectionId, item)}
        >
          <Ionicons name="create-outline" size={18} color="#2E86AB" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.lessonActionBtn}
          onPress={() => handleDeleteLesson(sectionId, item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = ({ item }) => (
    <View style={styles.sectionCard}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSectionExpand(item.id)}
      >
        <View style={styles.sectionTitleContainer}>
          <Ionicons 
            name={expandedSection === item.id ? 'chevron-down' : 'chevron-forward'} 
            size={20} 
            color="#6c757d" 
          />
          <Text style={styles.sectionTitle}>{item.title}</Text>
          <Text style={styles.lessonsCount}>
            ({lessons[item.id]?.length || 0} lessons)
          </Text>
        </View>
        <View style={styles.sectionActions}>
          <TouchableOpacity 
            style={styles.sectionActionBtn}
            onPress={() => handleEditSection(item)}
          >
            <Ionicons name="create-outline" size={18} color="#2E86AB" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sectionActionBtn}
            onPress={() => handleDeleteSection(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expandedSection === item.id && (
        <View style={styles.expandedContent}>
          {item.description ? (
            <Text style={styles.sectionDescription}>{item.description}</Text>
          ) : null}
          
          {/* Lessons List */}
          <View style={styles.lessonsContainer}>
            <View style={styles.lessonsHeader}>
              <Text style={styles.lessonsTitle}>Lessons</Text>
              <TouchableOpacity 
                style={styles.addLessonBtn}
                onPress={() => handleAddLesson(item.id)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addLessonText}>Add Lesson</Text>
              </TouchableOpacity>
            </View>
            
            {lessons[item.id]?.length > 0 ? (
              <FlatList
                data={lessons[item.id]}
                renderItem={({ item: lesson }) => renderLessonItem({ item: lesson, sectionId: item.id })}
                keyExtractor={lesson => lesson.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyLessons}>
                <Ionicons name="book-outline" size={40} color="#6c757d" />
                <Text style={styles.emptyLessonsText}>No lessons yet</Text>
                <TouchableOpacity 
                  style={styles.emptyLessonsBtn}
                  onPress={() => handleAddLesson(item.id)}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />
                  <Text style={styles.emptyLessonsBtnText}>Add First Lesson</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading sections...</Text>
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Sections & Lessons</Text>
          <TouchableOpacity 
            style={styles.addSectionBtn}
            onPress={() => {
              setEditingSection(null);
              setSectionTitle('');
              setSectionDescription('');
              setIsModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={80} color="#6c757d" />
              <Text style={styles.emptyTitle}>No Sections Yet</Text>
              <Text style={styles.emptyText}>
                Start by adding your first section to organize course content
              </Text>
              <TouchableOpacity 
                style={styles.emptyBtn}
                onPress={() => setIsModalVisible(true)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.emptyBtnText}>Add First Section</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={sections}
              renderItem={renderSection}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListHeaderComponent={
                <Text style={styles.totalSections}>
                  {sections.length} Section{sections.length !== 1 ? 's' : ''}
                </Text>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Section Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSection ? 'Edit Section' : 'Add New Section'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Section Title *</Text>
                <TextInput
                  style={styles.input}
                  value={sectionTitle}
                  onChangeText={setSectionTitle}
                  placeholder="Enter section title"
                  autoFocus={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={sectionDescription}
                  onChangeText={setSectionDescription}
                  placeholder="Enter section description"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => setIsModalVisible(false)}
                  disabled={uploading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveBtn, uploading && styles.disabledBtn]}
                  onPress={handleSaveSection}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save" size={18} color="#fff" />
                      <Text style={styles.saveBtnText}>
                        {editingSection ? 'Update' : 'Save'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  centerContent: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addSectionBtn: {
    backgroundColor: '#2E86AB',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  totalSections: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 15,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  lessonsCount: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
  },
  sectionActions: {
    flexDirection: 'row',
  },
  sectionActionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  lessonsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  lessonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addLessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addLessonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonDetails: {
    marginLeft: 10,
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lessonMeta: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  lessonActions: {
    flexDirection: 'row',
  },
  lessonActionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  emptyLessons: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyLessonsText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    marginBottom: 12,
  },
  emptyLessonsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyLessonsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
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
    backgroundColor: '#f8f9fa',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#28a745',
    borderRadius: 8,
    marginLeft: 10,
  },
  disabledBtn: {
    backgroundColor: '#adb5bd',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
// screens/admin/AddSectionScreen.js
import React, { useState } from 'react';
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

const AddSectionScreen = ({ navigation, route }) => {
  const { courseId, existingSections = [], onSaveSections } = route.params || {};
  
  const [sections, setSections] = useState(existingSections);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentSection, setCurrentSection] = useState({
    title: '',
    type: 'video',
    content: '',
  });
  
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
  });
  
  const [assignmentDetails, setAssignmentDetails] = useState({
    description: '',
    dueDate: '',
    maxPoints: 100,
    submissionType: 'text',
  });

  const courseTypes = [
    { id: 1, name: 'Video Lecture', icon: 'videocam', type: 'video' },
    { id: 2, name: 'Document', icon: 'document-text', type: 'document' },
    { id: 3, name: 'Quiz', icon: 'help-circle', type: 'quiz' },
    { id: 4, name: 'Assignment', icon: 'clipboard', type: 'assignment' },
  ];

  const addQuestionToQuiz = () => {
    if (!currentQuestion.question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    if (currentQuestion.options.some(opt => !opt.trim())) {
      Alert.alert('Error', 'Please fill in all 4 options');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString(),
    };

    setQuizQuestions([...quizQuestions, newQuestion]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    });
    
    setShowQuizModal(false);
  };

  const removeQuestion = (questionId) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
  };

  const addSection = () => {
    if (!currentSection.title.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }

    let sectionData = { ...currentSection };

    // Add type-specific data
    switch (currentSection.type) {
      case 'quiz':
        if (quizQuestions.length === 0) {
          Alert.alert('Error', 'Please add at least one question to the quiz');
          return;
        }
        sectionData.questions = quizQuestions;
        sectionData.totalPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);
        break;
      
      case 'assignment':
        if (!assignmentDetails.description.trim()) {
          Alert.alert('Error', 'Please enter assignment description');
          return;
        }
        sectionData.assignmentDetails = assignmentDetails;
        break;
      
      case 'video':
      case 'document':
        if (!currentSection.content.trim()) {
          Alert.alert('Error', `Please enter ${currentSection.type} URL`);
          return;
        }
        break;
    }

    const newSection = {
      ...sectionData,
      id: Date.now().toString(),
      order: sections.length + 1,
      createdAt: new Date().toISOString(),
    };

    setSections(prevSections => [...prevSections, newSection]);
    
    // Reset all section-specific states
    setCurrentSection({ 
      title: '', 
      type: 'video', 
      content: '' 
    });
    setQuizQuestions([]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    });
    setAssignmentDetails({
      description: '',
      dueDate: '',
      maxPoints: 100,
      submissionType: 'text',
    });
    
    setShowSectionModal(false);
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

  const handleSaveSections = () => {
    if (sections.length === 0) {
      Alert.alert('Warning', 'No sections added. The course will have no content.');
    }
    
    if (onSaveSections) {
      onSaveSections(sections);
      navigation.goBack();
    } else {
      // Navigate back to previous screen with the sections data
      navigation.navigate({
        name: 'CreateCourse',
        params: { sections: sections },
        merge: true,
      });
    }
  };

  const renderQuizQuestion = ({ item, index }) => (
    <View style={styles.questionItem}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>Q{index + 1}:</Text>
        <Text style={styles.questionText}>{item.question}</Text>
        <TouchableOpacity onPress={() => removeQuestion(item.id)}>
          <Ionicons name="trash-outline" size={16} color="#dc3545" />
        </TouchableOpacity>
      </View>
      <View style={styles.optionsList}>
        {item.options.map((option, optIndex) => (
          <Text key={optIndex} style={[
            styles.optionText,
            optIndex === item.correctAnswer && styles.correctOption
          ]}>
            {String.fromCharCode(65 + optIndex)}. {option}
            {optIndex === item.correctAnswer && ' ✓'}
          </Text>
        ))}
      </View>
      <Text style={styles.pointsText}>Points: {item.points}</Text>
    </View>
  );

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
      
      <TouchableOpacity 
        style={styles.removeSectionBtn}
        onPress={() => removeSection(item.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

  const renderSectionForm = () => {
    switch (currentSection.type) {
      case 'video':
        return (
          <View style={styles.typeForm}>
            <Text style={styles.label}>Video URL *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentSection.content}
              onChangeText={(text) => setCurrentSection({ ...currentSection, content: text })}
              placeholder="Enter YouTube/Vimeo/Video URL"
              multiline
              numberOfLines={2}
            />
            <Text style={styles.helperText}>
              Enter the full URL of the video (YouTube, Vimeo, or direct video link)
            </Text>
          </View>
        );

      case 'document':
        return (
          <View style={styles.typeForm}>
            <Text style={styles.label}>Document URL *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentSection.content}
              onChangeText={(text) => setCurrentSection({ ...currentSection, content: text })}
              placeholder="Enter PDF/Document URL"
              multiline
              numberOfLines={2}
            />
            <Text style={styles.helperText}>
              Enter the URL of the document (PDF, Google Docs, etc.)
            </Text>
          </View>
        );

      case 'quiz':
        return (
          <View style={styles.typeForm}>
            <Text style={styles.label}>Quiz Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={currentSection.content}
              onChangeText={(text) => setCurrentSection({ ...currentSection, content: text })}
              placeholder="Enter quiz instructions (optional)"
              multiline
              numberOfLines={2}
            />
            
            <View style={styles.quizHeader}>
              <Text style={styles.label}>Quiz Questions</Text>
              <TouchableOpacity 
                style={styles.addQuestionBtn}
                onPress={() => setShowQuizModal(true)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addQuestionText}>Add Question</Text>
              </TouchableOpacity>
            </View>
            
            {quizQuestions.length > 0 ? (
              <FlatList
                data={quizQuestions}
                renderItem={renderQuizQuestion}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.questionsList}
              />
            ) : (
              <Text style={styles.emptyQuizText}>
                No questions added yet. Tap "Add Question" to add quiz questions.
              </Text>
            )}
          </View>
        );

      case 'assignment':
        return (
          <View style={styles.typeForm}>
            <Text style={styles.label}>Assignment Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={assignmentDetails.description}
              onChangeText={(text) => setAssignmentDetails({ ...assignmentDetails, description: text })}
              placeholder="Enter assignment description and requirements"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Due Date</Text>
                <TextInput
                  style={styles.input}
                  value={assignmentDetails.dueDate}
                  onChangeText={(text) => setAssignmentDetails({ ...assignmentDetails, dueDate: text })}
                  placeholder="e.g., Dec 31, 2024"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Max Points</Text>
                <TextInput
                  style={styles.input}
                  value={assignmentDetails.maxPoints.toString()}
                  onChangeText={(text) => setAssignmentDetails({ ...assignmentDetails, maxPoints: parseInt(text) || 100 })}
                  placeholder="100"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <Text style={styles.label}>Submission Type</Text>
            <View style={styles.submissionType}>
              {['text', 'file', 'both'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.submissionOption,
                    assignmentDetails.submissionType === type && styles.selectedSubmission,
                  ]}
                  onPress={() => setAssignmentDetails({ ...assignmentDetails, submissionType: type })}
                >
                  <Text style={[
                    styles.submissionText,
                    assignmentDetails.submissionType === type && styles.selectedSubmissionText,
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
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
              Manage Course Sections
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Sections Management */}
          <View style={styles.form}>
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

            {/* Save Button */}
            <TouchableOpacity 
              style={[styles.saveBtn, isLoading && styles.disabledBtn]}
              onPress={handleSaveSections}
              disabled={isLoading}
            >
              <Ionicons name="save" size={24} color="#fff" />
              <Text style={styles.saveBtnText}>
                Save Sections ({sections.length})
              </Text>
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
                        setCurrentSection({ 
                          title: currentSection.title, 
                          type: type.type, 
                          content: '' 
                        });
                        setQuizQuestions([]);
                        setAssignmentDetails({
                          description: '',
                          dueDate: '',
                          maxPoints: 100,
                          submissionType: 'text',
                        });
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
                  onChangeText={(text) => setCurrentSection({ ...currentSection, title: text })}
                  placeholder="Enter section title"
                />
              </View>

              {/* Type-specific form */}
              {renderSectionForm()}

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

      {/* Quiz Question Modal */}
      <Modal
        visible={showQuizModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Quiz Question</Text>
              <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Question *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={currentQuestion.question}
                  onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, question: text })}
                  placeholder="Enter the question"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Options *</Text>
                {[0, 1, 2, 3].map((index) => (
                  <View key={index} style={styles.optionRow}>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                    >
                      <Ionicons 
                        name={currentQuestion.correctAnswer === index ? "radio-button-on" : "radio-button-off"} 
                        size={20} 
                        color="#2E86AB" 
                      />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={currentQuestion.options[index]}
                      onChangeText={(text) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[index] = text;
                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Points</Text>
                <TextInput
                  style={styles.input}
                  value={currentQuestion.points.toString()}
                  onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, points: parseInt(text) || 10 })}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => setShowQuizModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={addQuestionToQuiz}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Question</Text>
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
  saveBtn: {
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
  saveBtnText: {
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
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
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
  typeForm: {
    marginBottom: 20,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addQuestionText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  questionsList: {
    marginTop: 10,
  },
  questionItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginRight: 8,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  optionsList: {
    marginLeft: 20,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  correctOption: {
    color: '#28a745',
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  emptyQuizText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    padding: 8,
    marginRight: 8,
  },
  submissionType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  submissionOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E86AB',
    marginHorizontal: 4,
  },
  selectedSubmission: {
    backgroundColor: '#2E86AB',
  },
  submissionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E86AB',
  },
  selectedSubmissionText: {
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

export default AddSectionScreen;
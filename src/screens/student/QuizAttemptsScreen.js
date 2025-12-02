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
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get, set, push, serverTimestamp } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function QuizResultsScreen({ navigation, route }) {
  const { attemptId, courseId, sectionId } = route.params || {};
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const db = getDatabase();
  const userId = getAuth().currentUser?.uid;

  useEffect(() => {
    if (attemptId && courseId && sectionId) {
      loadQuizResults();
    }
  }, [attemptId, courseId, sectionId]);

  const loadQuizResults = async () => {
    try {
      setLoading(true);
      
      // Load attempt data
      const attemptRef = ref(db, `users/${userId}/quizAttempts/${courseId}/${attemptId}`);
      const attemptSnapshot = await get(attemptRef);
      
      if (attemptSnapshot.exists()) {
        const attemptData = attemptSnapshot.val();
        setAttempt(attemptData);
        
        // Load section details
        const sectionRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
        const sectionSnapshot = await get(sectionRef);
        
        if (sectionSnapshot.exists()) {
          setQuiz(sectionSnapshot.val());
          
          // Load questions for this quiz
          const questionsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
          const questionsSnapshot = await get(questionsRef);
          
          if (questionsSnapshot.exists()) {
            const questionsData = questionsSnapshot.val();
            const questionsArray = Object.keys(questionsData).map(key => ({
              id: key,
              ...questionsData[key],
              userAnswer: attemptData.answers?.[key]?.userAnswer,
              isCorrect: attemptData.answers?.[key]?.isCorrect,
            }));
            setQuestions(questionsArray.sort((a, b) => (a.order || 0) - (b.order || 0)));
          }
        }
      }
    } catch (error) {
      console.error('Error loading quiz results:', error);
      Alert.alert('Error', 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const retakeQuiz = () => {
    navigation.navigate('TakeQuiz', {
      courseId,
      sectionId,
      quizTitle: quiz?.title || 'Quiz',
      totalQuestions: questions.length,
      passingScore: quiz?.passingScore || 70,
      isRetake: true,
    });
  };

  const viewQuestionDetails = (question) => {
    setSelectedQuestion(question);
    setShowQuestionModal(true);
  };

  const getAnswerLetter = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  const getScoreColor = (score, passingScore = 70) => {
    if (score >= passingScore) return '#28a745';
    if (score >= passingScore * 0.7) return '#ffc107';
    return '#dc3545';
  };

  const getPerformanceMessage = (score, passingScore = 70) => {
    if (score >= passingScore) {
      const messages = [
        "Excellent work! You've mastered this material.",
        "Great job! You have a solid understanding.",
        "Well done! You passed with flying colors."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else {
      const messages = [
        "Keep practicing! Review the material and try again.",
        "You're getting there! Focus on the areas you missed.",
        "Don't give up! Use this as a learning opportunity."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!attempt || !quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Results</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#dc3545" />
          <Text style={styles.errorText}>Unable to load quiz results</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuizResults}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const correctCount = questions.filter(q => q.isCorrect).length;
  const totalQuestions = questions.length;
  const score = attempt.score || 0;
  const passingScore = quiz.passingScore || 70;
  const passed = score >= passingScore;
  const timeTaken = attempt.timeTaken ? `${Math.round(attempt.timeTaken / 60)} min ${attempt.timeTaken % 60} sec` : 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Results Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreText, { color: getScoreColor(score, passingScore) }]}>
              {score}%
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          
          <View style={styles.summaryDetails}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: passed ? '#d4edda' : '#f8d7da' }]}>
              <Text style={[styles.statusText, { color: passed ? '#155724' : '#721c24' }]}>
                {passed ? 'PASSED' : 'NOT PASSED'}
              </Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                <Text style={styles.statValue}>{correctCount}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={20} color="#dc3545" />
                <Text style={styles.statValue}>{totalQuestions - correctCount}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={20} color="#2E86AB" />
                <Text style={styles.statValue}>{timeTaken}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={20} color="#ffc107" />
                <Text style={styles.statValue}>{passingScore}%</Text>
                <Text style={styles.statLabel}>To Pass</Text>
              </View>
            </View>
            
            <Text style={styles.performanceMessage}>
              {getPerformanceMessage(score, passingScore)}
            </Text>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={20} color="#2E86AB" />
            <Text style={styles.cardTitle}>Performance Breakdown</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${score}%`,
                    backgroundColor: getScoreColor(score, passingScore)
                  }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>0%</Text>
              <Text style={styles.passingLabel}>Pass: {passingScore}%</Text>
              <Text style={styles.progressLabel}>100%</Text>
            </View>
          </View>
          
          <View style={styles.percentageCircles}>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageValue}>{Math.round((correctCount / totalQuestions) * 100)}%</Text>
              <Text style={styles.percentageLabel}>Accuracy</Text>
            </View>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageValue}>{score}%</Text>
              <Text style={styles.percentageLabel}>Final Score</Text>
            </View>
          </View>
        </View>

        {/* Questions Review */}
        <View style={styles.questionsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={20} color="#2E86AB" />
            <Text style={styles.cardTitle}>Question Review</Text>
          </View>
          
          <Text style={styles.reviewText}>
            Review your answers below. Tap any question to see details.
          </Text>
          
          {questions.map((question, index) => (
            <TouchableOpacity 
              key={question.id}
              style={[
                styles.questionItem,
                { borderLeftColor: question.isCorrect ? '#28a745' : '#dc3545' }
              ]}
              onPress={() => viewQuestionDetails(question)}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={[
                  styles.correctnessBadge,
                  { backgroundColor: question.isCorrect ? '#d4edda' : '#f8d7da' }
                ]}>
                  <Ionicons 
                    name={question.isCorrect ? "checkmark" : "close"} 
                    size={14} 
                    color={question.isCorrect ? '#155724' : '#721c24'} 
                  />
                  <Text style={[
                    styles.correctnessText,
                    { color: question.isCorrect ? '#155724' : '#721c24' }
                  ]}>
                    {question.isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
              </View>
              <Text style={styles.questionTitle} numberOfLines={2}>
                {question.title}
              </Text>
              <View style={styles.questionFooter}>
                <Text style={styles.pointsText}>
                  Points: {question.isCorrect ? '1/1' : '0/1'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6c757d" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.retakeButton, !passed && styles.primaryButton]}
            onPress={retakeQuiz}
          >
            <Ionicons name="refresh" size={20} color={passed ? "#2E86AB" : "#fff"} />
            <Text style={[styles.retakeButtonText, { color: passed ? "#2E86AB" : "#fff" }]}>
              {passed ? 'Retake Quiz' : 'Try Again'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backToQuizzesButton}
            onPress={() => navigation.navigate('QuizAttempts', { courseId })}
          >
            <Ionicons name="list-circle" size={20} color="#2E86AB" />
            <Text style={styles.backToQuizzesText}>Back to Quizzes</Text>
          </TouchableOpacity>
          
          {passed && (
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.navigate('CourseMaterial', { courseId })}
            >
              <Ionicons name="arrow-forward" size={20} color="#fff" />
              <Text style={styles.continueText}>Continue Course</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Question Details Modal */}
      <Modal
        transparent={true}
        visible={showQuestionModal}
        animationType="slide"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Question Details</Text>
              <TouchableOpacity onPress={() => setShowQuestionModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedQuestion && (
              <ScrollView style={styles.modalScroll}>
                <View style={[
                  styles.questionStatus,
                  { backgroundColor: selectedQuestion.isCorrect ? '#d4edda' : '#f8d7da' }
                ]}>
                  <Ionicons 
                    name={selectedQuestion.isCorrect ? "checkmark-circle" : "close-circle"} 
                    size={24} 
                    color={selectedQuestion.isCorrect ? '#155724' : '#721c24'} 
                  />
                  <Text style={[
                    styles.questionStatusText,
                    { color: selectedQuestion.isCorrect ? '#155724' : '#721c24' }
                  ]}>
                    {selectedQuestion.isCorrect ? 'Answered Correctly' : 'Answered Incorrectly'}
                  </Text>
                </View>
                
                <View style={styles.questionContent}>
                  <Text style={styles.modalQuestionTitle}>{selectedQuestion.title}</Text>
                  {selectedQuestion.content && (
                    <Text style={styles.modalQuestionContent}>{selectedQuestion.content}</Text>
                  )}
                </View>
                
                <View style={styles.answersSection}>
                  <Text style={styles.answersTitle}>Options:</Text>
                  {selectedQuestion.options?.map((option, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.optionItem,
                        selectedQuestion.correctAnswer === getAnswerLetter(index) && styles.correctOption,
                        selectedQuestion.userAnswer === getAnswerLetter(index) && !selectedQuestion.isCorrect && styles.incorrectOption
                      ]}
                    >
                      <View style={styles.optionHeader}>
                        <Text style={styles.optionLetter}>{getAnswerLetter(index)}</Text>
                        {selectedQuestion.correctAnswer === getAnswerLetter(index) && (
                          <View style={styles.correctIndicator}>
                            <Ionicons name="checkmark" size={14} color="#155724" />
                            <Text style={styles.correctText}>Correct Answer</Text>
                          </View>
                        )}
                        {selectedQuestion.userAnswer === getAnswerLetter(index) && !selectedQuestion.isCorrect && (
                          <View style={styles.yourAnswerIndicator}>
                            <Ionicons name="person" size={14} color="#721c24" />
                            <Text style={styles.yourAnswerText}>Your Answer</Text>
                          </View>
                        )}
                        {selectedQuestion.userAnswer === getAnswerLetter(index) && selectedQuestion.isCorrect && (
                          <View style={styles.correctIndicator}>
                            <Ionicons name="checkmark" size={14} color="#155724" />
                            <Text style={styles.correctText}>Your Correct Answer</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.explanationSection}>
                  <Text style={styles.explanationTitle}>Explanation:</Text>
                  <Text style={styles.explanationText}>
                    {selectedQuestion.isCorrect 
                      ? "You selected the correct answer. Well done!" 
                      : "Review this question to understand why the correct answer is what it is."}
                  </Text>
                </View>
              </ScrollView>
            )}
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
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#e9ecef',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  summaryDetails: {
    width: '100%',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  performanceMessage: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  passingLabel: {
    fontSize: 12,
    color: '#2E86AB',
    fontWeight: '600',
  },
  percentageCircles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  percentageCircle: {
    alignItems: 'center',
  },
  percentageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  questionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  questionItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  correctnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  correctnessText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  questionTitle: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionButtons: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#2E86AB',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2E86AB',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backToQuizzesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  backToQuizzesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E86AB',
    marginLeft: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    padding: 20,
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  questionContent: {
    marginBottom: 20,
  },
  modalQuestionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalQuestionContent: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  answersSection: {
    marginBottom: 20,
  },
  answersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#f8f9fa',
  },
  correctOption: {
    borderColor: '#d4edda',
    backgroundColor: '#d4edda',
  },
  incorrectOption: {
    borderColor: '#f8d7da',
    backgroundColor: '#f8d7da',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  correctIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  correctText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  yourAnswerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yourAnswerText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  explanationSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
});
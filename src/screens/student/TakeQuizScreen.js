import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get, set, push, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export default function TakeQuizScreen({ navigation, route }) {
  const { courseId, sectionId, quizTitle } = route.params || {};
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [passed, setPassed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const db = getDatabase();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (courseId && sectionId) {
      loadQuiz();
    }
  }, [courseId, sectionId]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, quizCompleted]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      
      // Load quiz details from section
      const quizRef = ref(db, `courses/${courseId}/sections/${sectionId}`);
      const quizSnapshot = await get(quizRef);
      
      if (quizSnapshot.exists()) {
        const quizData = quizSnapshot.val();
        setQuizDetails({
          title: quizData.title || quizTitle,
          description: quizData.description,
          duration: 30, // Default 30 minutes
          passingScore: quizData.passingScore || 70,
          totalQuestions: quizData.lessonsCount || 0
        });
        setTimeLeft(30 * 60); // 30 minutes in seconds
        setTotalQuestions(quizData.lessonsCount || 0);
      }
      
      // Load quiz questions from lessons
      const lessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
      const lessonsSnapshot = await get(lessonsRef);
      
      if (lessonsSnapshot.exists()) {
        const lessonsData = lessonsSnapshot.val();
        
        // Filter for quiz lessons and convert to questions
        const quizQuestions = [];
        Object.keys(lessonsData).forEach(key => {
          const lesson = lessonsData[key];
          if (lesson.type === 'quiz') {
            quizQuestions.push({
              id: key,
              text: lesson.content || lesson.title,
              options: lesson.options || [],
              correctAnswer: convertAnswerToIndex(lesson.correctAnswer),
              points: lesson.maxScore || 10,
              order: lesson.order || 0,
              selectedAnswer: null
            });
          }
        });
        
        // Sort by order
        quizQuestions.sort((a, b) => a.order - b.order);
        
        // Randomize if needed
        if (quizDetails?.randomizeQuestions) {
          quizQuestions.sort(() => Math.random() - 0.5);
        }
        
        setQuestions(quizQuestions);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const convertAnswerToIndex = (answer) => {
    if (!answer) return 0;
    const indexMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    return indexMap[answer.toUpperCase()] || 0;
  };

  const convertIndexToAnswer = (index) => {
    const letters = ['A', 'B', 'C', 'D'];
    return letters[index] || 'A';
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Time\'s Up!',
      'The time for this quiz has ended. Your answers will be submitted automatically.',
      [{ text: 'Submit Now', onPress: submitQuiz }]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    const currentQuestion = questions.find(q => q.id === questionId);
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        answerIndex,
        isCorrect,
        timestamp: Date.now()
      }
    }));
    
    // Update UI
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, selectedAnswer: answerIndex }
        : q
    ));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to submit quiz');
      return;
    }

    setSubmitting(true);
    
    try {
      // Calculate score
      let correctAnswers = 0;
      const submittedAnswers = [];
      
      questions.forEach(question => {
        const answer = answers[question.id];
        const isCorrect = answer ? answer.isCorrect : false;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        submittedAnswers.push({
          questionId: question.id,
          questionText: question.text,
          selectedAnswer: answer ? convertIndexToAnswer(answer.answerIndex) : null,
          correctAnswer: convertIndexToAnswer(question.correctAnswer),
          isCorrect: isCorrect,
          options: question.options
        });
      });
      
      const percentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
      const passedQuiz = percentage >= (quizDetails?.passingScore || 70);
      
      setScore(correctAnswers);
      setPassed(passedQuiz);
      
      // Save quiz result
      const resultId = push(ref(db, `users/${userId}/quizResults`)).key;
      const resultRef = ref(db, `users/${userId}/quizResults/${resultId}`);
      
      const resultData = {
        courseId,
        sectionId,
        quizTitle: quizDetails?.title || quizTitle,
        score: correctAnswers,
        totalQuestions: questions.length,
        percentage: percentage.toFixed(2),
        passed: passedQuiz,
        answers: submittedAnswers,
        submittedAt: Date.now(),
        durationUsed: (quizDetails?.duration || 30) * 60 - timeLeft,
        timeLimit: quizDetails?.duration || 30
      };
      
      await set(resultRef, resultData);
      
      // Update section progress if passed
      if (passedQuiz) {
        const progressRef = ref(db, `users/${userId}/progress/${courseId}/sections/${sectionId}`);
        
        await update(progressRef, {
          quizCompleted: true,
          quizScore: percentage,
          quizPassed: true,
          completedAt: Date.now(),
          lastUpdated: Date.now()
        });
        
        // Also update overall course progress
        const courseProgressRef = ref(db, `users/${userId}/progress/${courseId}`);
        const courseProgressSnapshot = await get(courseProgressRef);
        
        if (courseProgressSnapshot.exists()) {
          const courseProgress = courseProgressSnapshot.val();
          const completedSections = courseProgress.completedSections || 0;
          
          await update(courseProgressRef, {
            completedSections: completedSections + 1,
            lastUpdated: Date.now()
          });
        }
      }
      
      setQuizCompleted(true);
      setShowResults(true);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    const unanswered = questions.filter(q => !answers[q.id]).length;
    
    if (unanswered > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: submitQuiz }
        ]
      );
    } else {
      Alert.alert(
        'Submit Quiz',
        'Are you sure you want to submit your answers?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitQuiz }
        ]
      );
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const unansweredCount = questions.filter(q => !answers[q.id]).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{quizTitle || 'Quiz'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle" size={64} color="#adb5bd" />
          <Text style={styles.emptyTitle}>No Questions Available</Text>
          <Text style={styles.emptyText}>
            This quiz doesn't have any questions yet.
          </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {quizDetails?.title || quizTitle || 'Quiz'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={20} color="#dc3545" />
          <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Question Area */}
      <ScrollView style={styles.questionContainer}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
            </Text>
            {currentQuestion.points && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>
                  {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.questionText}>
            {currentQuestion.text}
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map((option, index) => {
            const isSelected = answers[currentQuestion.id]?.answerIndex === index;
            const hasAnswered = answers[currentQuestion.id] !== undefined;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionSelected,
                  hasAnswered && !isSelected && styles.optionNotSelected
                ]}
                onPress={() => handleAnswerSelect(currentQuestion.id, index)}
                disabled={quizCompleted}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionIndicator,
                    isSelected && styles.optionIndicatorSelected
                  ]}>
                    <Text style={[
                      styles.optionLetter,
                      isSelected && styles.optionLetterSelected
                    ]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color="#28a745" 
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentQuestionIndex === 0 && styles.navButtonDisabled
            ]}
            onPress={prevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              currentQuestionIndex === questions.length - 1 && styles.submitButton
            ]}
            onPress={
              currentQuestionIndex === questions.length - 1 
                ? confirmSubmit 
                : nextQuestion
            }
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.navButtonText}>
                  {currentQuestionIndex === questions.length - 1 
                    ? 'Submit Quiz' 
                    : 'Next Question'}
                </Text>
                <Ionicons 
                  name={
                    currentQuestionIndex === questions.length - 1 
                      ? 'checkmark-done' 
                      : 'arrow-forward'
                  } 
                  size={20} 
                  color="#fff" 
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quiz Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Quiz Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{questions.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.answeredStat]}>
                {questions.length - unansweredCount}
              </Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.unansweredStat]}>
                {unansweredCount}
              </Text>
              <Text style={styles.statLabel}>Unanswered</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {quizDetails?.passingScore || 70}%
              </Text>
              <Text style={styles.statLabel}>To Pass</Text>
            </View>
          </View>
          
          {/* Question Navigator */}
          <View style={styles.questionNavigator}>
            <Text style={styles.navigatorTitle}>Jump to Question:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.questionIndicators}>
                {questions.map((_, index) => {
                  const isAnswered = answers[questions[index].id] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.questionIndicator,
                        isCurrent && styles.questionIndicatorCurrent,
                        isAnswered && styles.questionIndicatorAnswered
                      ]}
                      onPress={() => setCurrentQuestionIndex(index)}
                      disabled={quizCompleted}
                    >
                      <Text style={[
                        styles.questionIndicatorText,
                        isCurrent && styles.questionIndicatorTextCurrent,
                        isAnswered && styles.questionIndicatorTextAnswered
                      ]}>
                        {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[
              styles.resultHeader,
              passed ? styles.passedHeader : styles.failedHeader
            ]}>
              <Ionicons 
                name={passed ? "checkmark-circle" : "close-circle"} 
                size={64} 
                color="#fff" 
              />
              <Text style={styles.resultTitle}>
                {passed ? 'Quiz Passed!' : 'Quiz Failed'}
              </Text>
              <Text style={styles.resultScore}>
                Score: {score}/{questions.length} ({((score/questions.length)*100).toFixed(1)}%)
              </Text>
            </View>
            
            <ScrollView style={styles.resultsScroll}>
              <View style={styles.resultDetails}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Correct Answers:</Text>
                  <Text style={styles.resultStatValue}>{score}</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Total Questions:</Text>
                  <Text style={styles.resultStatValue}>{questions.length}</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Percentage:</Text>
                  <Text style={styles.resultStatValue}>
                    {questions.length > 0 ? ((score/questions.length)*100).toFixed(1) : 0}%
                  </Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Passing Score:</Text>
                  <Text style={styles.resultStatValue}>
                    {quizDetails?.passingScore || 70}%
                  </Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatLabel}>Status:</Text>
                  <Text style={[
                    styles.resultStatValue,
                    passed ? {color: '#28a745'} : {color: '#dc3545'}
                  ]}>
                    {passed ? 'PASSED' : 'FAILED'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.reviewButton]}
                  onPress={() => {
                    setShowResults(false);
                    // Navigate to quiz review screen if you have one
                    // navigation.navigate('QuizReview', { 
                    //   courseId, 
                    //   sectionId, 
                    //   questions, 
                    //   answers 
                    // });
                  }}
                >
                  <Ionicons name="eye" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Review Answers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.continueButton]}
                  onPress={() => {
                    setShowResults(false);
                    navigation.goBack();
                  }}
                >
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => {
                setShowResults(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Keep all your existing styles as they are
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginRight: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E86AB',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsBadge: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionSelected: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  optionNotSelected: {
    opacity: 0.7,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionIndicatorSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  optionLetterSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#155724',
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  prevButton: {
    backgroundColor: '#6c757d',
  },
  nextButton: {
    backgroundColor: '#2E86AB',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    marginBottom: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  answeredStat: {
    color: '#28a745',
  },
  unansweredStat: {
    color: '#dc3545',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  questionNavigator: {
    marginTop: 10,
  },
  navigatorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 10,
  },
  questionIndicators: {
    flexDirection: 'row',
  },
  questionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  questionIndicatorCurrent: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  questionIndicatorAnswered: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  questionIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  questionIndicatorTextCurrent: {
    color: '#fff',
  },
  questionIndicatorTextAnswered: {
    color: '#155724',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#2E86AB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  resultHeader: {
    padding: 30,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  passedHeader: {
    backgroundColor: '#28a745',
  },
  failedHeader: {
    backgroundColor: '#dc3545',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  resultScore: {
    fontSize: 20,
    color: '#fff',
    marginTop: 8,
  },
  resultsScroll: {
    maxHeight: 400,
  },
  resultDetails: {
    padding: 20,
  },
  resultStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  resultStatLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  resultStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
  },
  reviewButton: {
    backgroundColor: '#6c757d',
  },
  continueButton: {
    backgroundColor: '#2E86AB',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeModalButton: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
});
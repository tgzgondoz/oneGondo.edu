import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';

export default function QuizAttemptsScreen({ navigation, route }) {
  const { courseId } = route.params || {};
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('');

  const db = getDatabase();
  const userId = getAuth().currentUser?.uid;

  useEffect(() => {
    if (courseId && userId) {
      loadCourseQuizzes();
      loadUserAttempts();
    }
  }, [courseId, userId]);

  const loadCourseQuizzes = async () => {
    try {
      // Load course title
      const courseRef = ref(db, `courses/${courseId}`);
      const courseSnapshot = await get(courseRef);
      if (courseSnapshot.exists()) {
        setCourseTitle(courseSnapshot.val().title || 'Quizzes');
      }

      // Load quiz sections
      const sectionsRef = ref(db, `courses/${courseId}/sections`);
      const sectionsSnapshot = await get(sectionsRef);
      
      if (sectionsSnapshot.exists()) {
        const sectionsData = sectionsSnapshot.val();
        let quizSections = [];
        
        for (const [sectionId, sectionData] of Object.entries(sectionsData)) {
          if (sectionData.type === 'quiz' || sectionData.type === 'test') {
            // Load quiz questions
            const lessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
            const lessonsSnapshot = await get(lessonsRef);
            
            if (lessonsSnapshot.exists()) {
              const lessonsData = lessonsSnapshot.val();
              const quizCount = Object.keys(lessonsData).length;
              
              quizSections.push({
                id: sectionId,
                ...sectionData,
                quizCount,
                totalQuestions: sectionData.totalQuestions || quizCount,
                passingScore: sectionData.passingScore || 70,
              });
            }
          }
        }
        
        setQuizzes(quizSections);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      Alert.alert('Error', 'Failed to load quizzes');
    }
  };

  const loadUserAttempts = async () => {
    if (!userId) return;
    
    try {
      const attemptsRef = ref(db, `users/${userId}/quizAttempts/${courseId}`);
      const snapshot = await get(attemptsRef);
      
      if (snapshot.exists()) {
        const attemptsData = snapshot.val();
        const attemptsArray = Object.keys(attemptsData).map(key => ({
          attemptId: key,
          ...attemptsData[key],
        }));
        setAttempts(attemptsArray);
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  const getAttemptForQuiz = (sectionId) => {
    return attempts.find(attempt => attempt.sectionId === sectionId);
  };

  const startQuiz = (quiz) => {
    navigation.navigate('TakeQuiz', {
      courseId,
      sectionId: quiz.id,
      quizTitle: quiz.title,
      totalQuestions: quiz.quizCount || quiz.totalQuestions,
      passingScore: quiz.passingScore,
    });
  };

  const viewQuizResults = (attempt) => {
    navigation.navigate('QuizResults', {
      attemptId: attempt.attemptId,
      courseId,
      sectionId: attempt.sectionId,
    });
  };

  const getScoreColor = (score, passingScore = 70) => {
    if (score >= passingScore) return '#28a745';
    if (score >= passingScore * 0.7) return '#ffc107';
    return '#dc3545';
  };

  const getStatusBadge = (score, passingScore = 70) => {
    if (score >= passingScore) return { text: 'Passed', color: '#d4edda', textColor: '#155724' };
    return { text: 'Failed', color: '#f8d7da', textColor: '#721c24' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
          <Text style={styles.loadingText}>Loading quizzes...</Text>
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
          {courseTitle || 'Quizzes'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <Ionicons name="help-circle" size={32} color="#2E86AB" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Course Quizzes</Text>
              <Text style={styles.summaryText}>
                {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} available
              </Text>
            </View>
          </View>

          {quizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={64} color="#adb5bd" />
              <Text style={styles.emptyStateTitle}>No Quizzes Available</Text>
              <Text style={styles.emptyStateText}>
                This course doesn't have any quizzes or tests yet.
              </Text>
            </View>
          ) : (
            quizzes.map(quiz => {
              const attempt = getAttemptForQuiz(quiz.id);
              const hasAttempt = !!attempt;
              const score = attempt?.score || 0;
              const status = getStatusBadge(score, quiz.passingScore);

              return (
                <View key={quiz.id} style={styles.quizCard}>
                  <View style={styles.quizHeader}>
                    <View style={styles.quizIcon}>
                      <Ionicons 
                        name={quiz.type === 'test' ? 'school' : 'help-circle'} 
                        size={24} 
                        color={quiz.type === 'test' ? '#dc3545' : '#ffc107'} 
                      />
                    </View>
                    <View style={styles.quizInfo}>
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
                      <Text style={styles.quizDescription}>
                        {quiz.description || `${quiz.quizCount || quiz.totalQuestions} questions`}
                      </Text>
                      <View style={styles.quizMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="help-circle-outline" size={14} color="#6c757d" />
                          <Text style={styles.metaText}>
                            {quiz.quizCount || quiz.totalQuestions} questions
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#6c757d" />
                          <Text style={styles.metaText}>
                            Pass: {quiz.passingScore}%
                          </Text>
                        </View>
                      </View>
                    </View>
                    {hasAttempt && (
                      <View style={[styles.scoreBadge, { backgroundColor: status.color }]}>
                        <Text style={[styles.scoreText, { color: status.textColor }]}>
                          {score}%
                        </Text>
                      </View>
                    )}
                  </View>

                  {hasAttempt ? (
                    <View style={styles.attemptInfo}>
                      <View style={styles.attemptHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                          <Text style={[styles.statusText, { color: status.textColor }]}>
                            {status.text}
                          </Text>
                        </View>
                        <Text style={styles.attemptDate}>
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.attemptDetails}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Score</Text>
                          <Text style={[styles.detailValue, { color: getScoreColor(score, quiz.passingScore) }]}>
                            {score}%
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Correct</Text>
                          <Text style={styles.detailValue}>
                            {attempt.correctAnswers || 0}/{attempt.totalQuestions || quiz.quizCount}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Time</Text>
                          <Text style={styles.detailValue}>
                            {attempt.timeTaken ? `${Math.round(attempt.timeTaken / 60)}min` : 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.viewResultsButton}
                          onPress={() => viewQuizResults(attempt)}
                        >
                          <Ionicons name="stats-chart" size={20} color="#fff" />
                          <Text style={styles.viewResultsText}>View Results</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.retakeButton}
                          onPress={() => startQuiz(quiz)}
                        >
                          <Ionicons name="refresh" size={20} color="#2E86AB" />
                          <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.startQuizButton}
                      onPress={() => startQuiz(quiz)}
                    >
                      <Ionicons name="play-circle" size={24} color="#fff" />
                      <Text style={styles.startQuizText}>
                        {quiz.type === 'test' ? 'Start Test' : 'Start Quiz'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          {attempts.length > 0 && (
            <View style={styles.attemptsSummary}>
              <Text style={styles.summaryTitle}>Attempts Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{attempts.length}</Text>
                  <Text style={styles.statLabel}>Total Attempts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {attempts.filter(a => a.score >= 70).length}
                  </Text>
                  <Text style={styles.statLabel}>Passed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)}%
                  </Text>
                  <Text style={styles.statLabel}>Avg Score</Text>
                </View>
              </View>
            </View>
          )}
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  summaryInfo: {
    marginLeft: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  quizCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  quizIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quizDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  quizMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  attemptInfo: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 15,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attemptDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  attemptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewResultsButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    padding: 10,
    borderRadius: 6,
  },
  viewResultsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  retakeText: {
    color: '#2E86AB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  startQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    padding: 12,
    borderRadius: 8,
  },
  startQuizText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  attemptsSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
});

// Import getAuth
import { getAuth } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Optional: For user count from Auth

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState([
    { id: 1, title: 'Total Students', value: '...', icon: 'people', color: '#2E86AB' },
    { id: 2, title: 'Active Courses', value: '...', icon: 'book', color: '#A23B72' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getDatabase();
        
        // 1. Fetch all courses from Realtime Database
        const coursesRef = ref(db, 'courses');
        const coursesSnapshot = await get(coursesRef);
        const courseCount = coursesSnapshot.exists() ? Object.keys(coursesSnapshot.val()).length : 0;
        
        // 2. (Option A) Count users from Realtime Database (if you store them under 'users')
        const usersRef = ref(db, 'users');
        const usersSnapshot = await get(usersRef);
        const userCount = usersSnapshot.exists() ? Object.keys(usersSnapshot.val()).length : 0;
        
        // 2. (Option B) OR, count users from Firebase Authentication
        // This is more complex on the frontend. The user list you showed is typically accessed via the Admin SDK on a backend.
        // For a frontend approximation, you could listen to the auth state, but it only gives the current user.
        // const auth = getAuth();
        // onAuthStateChanged(auth, (user) => { ... }); // Not suitable for total count.

        // 3. Update the stats state with the fetched counts
        setStats([
          { id: 1, title: 'Total Students', value: userCount.toString(), icon: 'people', color: '#2E86AB' },
          { id: 2, title: 'Active Courses', value: courseCount.toString(), icon: 'book', color: '#A23B72' },
        ]);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally, set error state for the user
        setStats([
          { id: 1, title: 'Total Students', value: 'Err', icon: 'people', color: '#2E86AB' },
          { id: 2, title: 'Active Courses', value: 'Err', icon: 'book', color: '#A23B72' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  const quickActions = [
    { id: 1, title: 'Add Course', icon: 'add-circle', screen: 'CreateCourse' }, // Changed likely target
    { id: 3, title: 'Analytics', icon: 'analytics', screen: 'Analytics' },
  ];

  const handleQuickAction = (screen) => {
    navigation.navigate(screen);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, Admin!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* ... rest of your JSX (Quick Actions, Recent Activity) remains exactly the same ... */}
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.actionCard}
                onPress={() => handleQuickAction(action.screen)}
              >
                <Ionicons name={action.icon} size={32} color="#2E86AB" />
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Ionicons name="person-add" size={20} color="#2E86AB" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New student registration</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="book" size={20} color="#A23B72" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Course "Mathematics 101" updated</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Course "Physics 101" published</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
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
  centered: {
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '47%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  activityContent: {
    flex: 1,
    marginLeft: 10,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
});
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../components/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const menuItems = [
    { icon: 'person', label: 'Account' },
    { icon: 'settings', label: 'Settings' },
    { icon: 'help-circle', label: 'Help & Support' },
    { icon: 'shield-checkmark', label: 'Privacy Policy' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Student'}</Text>
        <Text style={styles.email}>{user?.email || 'student@onegondo.edu'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Student Account</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={item.label}
            style={[
              styles.menuItem,
              index !== menuItems.length - 1 && styles.menuItemBorder
            ]}
          >
            <Ionicons name={item.icon} size={20} color="#666" />
            <Text style={styles.menuText}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>oneGondo.edu</Text>
        <Text style={styles.footerSubtext}>Version 2.1.4</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#000" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    padding: 8,
  },
  userSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  roleText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  menu: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 30,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});
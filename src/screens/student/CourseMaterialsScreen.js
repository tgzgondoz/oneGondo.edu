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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, get } from 'firebase/database';

export default function CourseMaterialsScreen({ navigation, route }) {
  const { courseId, courseTitle: paramCourseTitle } = route.params || {};
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('');

  const db = getDatabase();

  useEffect(() => {
    if (courseId) {
      loadCourseMaterials();
    }
  }, [courseId]);

  const loadCourseMaterials = async () => {
    try {
      setLoading(true);
      
      if (paramCourseTitle) {
        setCourseTitle(paramCourseTitle);
      } else {
        const courseRef = ref(db, `courses/${courseId}`);
        const courseSnapshot = await get(courseRef);
        if (courseSnapshot.exists()) {
          setCourseTitle(courseSnapshot.val().title || 'Course Materials');
        }
      }

      const sectionsRef = ref(db, `courses/${courseId}/sections`);
      const sectionsSnapshot = await get(sectionsRef);
      
      if (sectionsSnapshot.exists()) {
        const sectionsData = sectionsSnapshot.val();
        let allMaterials = [];
        
        for (const [sectionId, sectionData] of Object.entries(sectionsData)) {
          const lessonsRef = ref(db, `courses/${courseId}/sections/${sectionId}/lessons`);
          const lessonsSnapshot = await get(lessonsRef);
          
          if (lessonsSnapshot.exists()) {
            const lessonsData = lessonsSnapshot.val();
            
            for (const [lessonId, lessonData] of Object.entries(lessonsData)) {
              if (lessonData.type === 'video' || lessonData.type === 'document') {
                allMaterials.push({
                  id: lessonId,
                  sectionId,
                  ...lessonData,
                  sectionTitle: sectionData.title || 'Untitled Section',
                  sectionType: sectionData.type,
                  order: lessonData.order || 0,
                });
              }
            }
          }
        }
        
        allMaterials.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.title.localeCompare(b.title);
        });
        
        setMaterials(allMaterials);
      } else {
        setMaterials([]);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      Alert.alert('Error', 'Failed to load course materials');
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type, url = '') => {
    switch (type) {
      case 'video': return 'videocam';
      case 'document':
        const fileType = getFileTypeFromUrl(url);
        switch (fileType) {
          case 'pdf': return 'document-text';
          case 'word': return 'document-text';
          case 'powerpoint': return 'easel';
          case 'excel': return 'stats-chart';
          default: return 'document';
        }
      default: return 'document';
    }
  };

  const getFileTypeFromUrl = (url = '') => {
    if (!url || typeof url !== 'string' || url.trim() === '') return 'unknown';
    try {
      const extension = url.split('.').pop().toLowerCase();
      if (['pdf'].includes(extension)) return 'pdf';
      if (['doc', 'docx'].includes(extension)) return 'word';
      if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
      if (['xls', 'xlsx'].includes(extension)) return 'excel';
      if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) return 'video';
      return 'file';
    } catch (error) {
      return 'unknown';
    }
  };

  const getFileTypeName = (url = '') => {
    const type = getFileTypeFromUrl(url);
    switch (type) {
      case 'pdf': return 'PDF Document';
      case 'word': return 'Word Document';
      case 'powerpoint': return 'PowerPoint';
      case 'excel': return 'Excel Spreadsheet';
      case 'video': return 'Video File';
      default: return 'File';
    }
  };

  const handleOpenMaterial = async (material) => {
    if (!material.url) {
      Alert.alert('Error', 'This material is not available or has no URL');
      return;
    }

    if (material.type === 'video') {
      const url = material.url || '';
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const youtubeUrl = url.includes('youtube.com') 
          ? url 
          : `https://youtube.com/watch?v=${url.split('/').pop()}`;
        
        try {
          const supported = await Linking.canOpenURL(youtubeUrl);
          if (supported) {
            await Linking.openURL(youtubeUrl);
          } else {
            Alert.alert('Error', 'Cannot open YouTube link');
          }
        } catch (error) {
          console.error('Error opening YouTube:', error);
          Alert.alert('Error', 'Failed to open video');
        }
      } else {
        navigation.navigate('VideoPlayer', {
          videoUrl: material.url,
          title: material.title,
          courseId,
          lessonId: material.id
        });
      }
    } else if (material.type === 'document') {
      try {
        const supported = await Linking.canOpenURL(material.url);
        if (supported) {
          await Linking.openURL(material.url);
        } else {
          Alert.alert('Error', 'Cannot open this document');
        }
      } catch (error) {
        console.error('Error opening document:', error);
        Alert.alert('Error', 'Failed to open document');
      }
    }
  };

  const groupBySection = () => {
    const grouped = {};
    materials.forEach(material => {
      if (!grouped[material.sectionId]) {
        grouped[material.sectionId] = {
          title: material.sectionTitle,
          materials: []
        };
      }
      grouped[material.sectionId].materials.push(material);
    });
    return grouped;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#000" />
          <Text style={styles.loadingText}>Loading materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedMaterials = groupBySection();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {courseTitle || 'Course Materials'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Course Materials</Text>
            <Text style={styles.summaryText}>
              {materials.length} {materials.length === 1 ? 'item' : 'items'} available
            </Text>
          </View>

          {materials.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#999" />
              <Text style={styles.emptyStateTitle}>No Materials Available</Text>
              <Text style={styles.emptyStateText}>
                This course doesn't have any videos or documents yet.
              </Text>
            </View>
          ) : (
            Object.entries(groupedMaterials).map(([sectionId, section]) => (
              <View key={sectionId} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                
                {section.materials.map(material => (
                  <TouchableOpacity
                    key={material.id}
                    style={styles.materialItem}
                    onPress={() => handleOpenMaterial(material)}
                  >
                    <View style={styles.materialIcon}>
                      <Ionicons 
                        name={getMaterialIcon(material.type, material.url || '')} 
                        size={24} 
                        color="#000" 
                      />
                    </View>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialTitle}>{material.title}</Text>
                      <Text style={styles.materialType}>
                        {material.type === 'video' ? 'Video' : getFileTypeName(material.url || '')}
                      </Text>
                      {material.duration && (
                        <Text style={styles.materialDuration}>
                          {material.duration}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="open-outline" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  materialType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  materialDuration: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
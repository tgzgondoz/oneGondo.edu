import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VideoPlayerScreen({ navigation, route }) {
  const { videoUrl, title } = route.params || {};
  const [loading, setLoading] = React.useState(false);

  const handleVideoPlay = async () => {
    if (!videoUrl) {
      Alert.alert('Error', 'No video URL provided');
      return;
    }

    setLoading(true);
    try {
      // Check if the URL can be opened
      const supported = await Linking.canOpenURL(videoUrl);
      
      if (supported) {
        // Open the video in default browser/player
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert(
          'Cannot Open Video',
          `Unable to open video URL. Please make sure you have a video player app installed.
          
URL: ${videoUrl}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening video:', error);
      Alert.alert('Error', 'Failed to open video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVideoSourceInfo = () => {
    if (!videoUrl) return 'No video URL';
    
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      return 'YouTube Video';
    } else if (videoUrl.includes('vimeo.com')) {
      return 'Vimeo Video';
    } else if (videoUrl.endsWith('.mp4') || videoUrl.endsWith('.mov') || videoUrl.includes('video')) {
      return 'Video File';
    } else {
      return 'External Video';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Video Player'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="videocam-outline" size={80} color="#2E86AB" />
        
        <Text style={styles.title}>
          {title || 'Video Content'}
        </Text>
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoSource}>
            Source: {getVideoSourceInfo()}
          </Text>
          {videoUrl && (
            <Text style={styles.videoUrl} numberOfLines={2}>
              {videoUrl}
            </Text>
          )}
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to watch:</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.instructionText}>Tap "Play Video" below</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.instructionText}>Video will open in your device's video player</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.instructionText}>Use your device's controls to play/pause</Text>
          </View>
        </View>
        
        {videoUrl ? (
          <TouchableOpacity
            style={styles.playButton}
            onPress={handleVideoPlay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#fff" />
                <Text style={styles.playButtonText}>Play Video</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="warning" size={24} color="#dc3545" />
            <Text style={styles.noVideoText}>No video URL available</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Course Materials</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  videoInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  videoSource: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: '600',
    marginBottom: 5,
  },
  videoUrl: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 5,
  },
  instructions: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 10,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
    flex: 1,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  noVideoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
  },
  noVideoText: {
    color: '#856404',
    fontSize: 16,
    marginLeft: 10,
  },
  backButton: {
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6c757d',
    fontSize: 16,
  },
});
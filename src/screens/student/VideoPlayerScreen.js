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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Video Player'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="videocam-outline" size={64} color="#000" />
        
        <Text style={styles.title}>
          {title || 'Video Content'}
        </Text>
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoSource}>
            {getVideoSourceInfo()}
          </Text>
          {videoUrl && (
            <Text style={styles.videoUrl} numberOfLines={2}>
              {videoUrl}
            </Text>
          )}
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
            <Ionicons name="warning" size={24} color="#666" />
            <Text style={styles.noVideoText}>No video URL available</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.backButton2}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Materials</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  videoInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  videoSource: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginBottom: 5,
  },
  videoUrl: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noVideoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  noVideoText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  backButton2: {
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
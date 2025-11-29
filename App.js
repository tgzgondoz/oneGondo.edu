import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { TailwindProvider } from 'tailwindcss-react-native';

export default function App() {
  return (
    <TailwindProvider>
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg text-blue-600 font-bold mb-4">
          Welcome to Your App!
        </Text>
        <Text className="text-base text-gray-600 text-center px-4">
          Open up App.js to start working on your app!
        </Text>
        <StatusBar style="auto" />
      </View>
    </TailwindProvider>
  );
}
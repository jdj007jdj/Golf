# Mobile Application Architecture - React Native CLI

## Technology Stack

### Core Technologies
- **Framework**: React Native (CLI approach, not Expo)
- **Language**: TypeScript
- **State Management**: Redux Toolkit / Zustand
- **Navigation**: React Navigation v6
- **Styling**: StyleSheet + styled-components
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form
- **Testing**: Jest + React Native Testing Library

### Development Requirements
- **Android**: Android Studio, Java 17, Android SDK
- **iOS**: Xcode 14+, CocoaPods, macOS (for iOS development)
- **Node.js**: v18+
- **React Native CLI**: Latest version

## Project Structure

```
project-root/
├── android/                    # Native Android project
│   ├── app/
│   ├── gradle/
│   └── build.gradle
├── ios/                        # Native iOS project
│   ├── [Application Project Name]/
│   ├── [Application Project Name].xcodeproj/
│   └── Podfile
├── src/                        # React Native source
│   ├── components/
│   │   ├── common/            # Shared components
│   │   └── features/          # Feature-specific
│   ├── screens/               # Screen components
│   ├── navigation/            # Navigation config
│   ├── services/              # API services
│   ├── store/                 # Redux store
│   ├── hooks/                 # Custom hooks
│   ├── utils/                 # Utilities
│   ├── types/                 # TypeScript types
│   └── constants/             # App constants
├── __tests__/                 # Test files
├── assets/                    # Images, fonts
├── index.js                   # Entry point
├── App.tsx                    # Root component
├── app.json                   # App configuration
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── package.json
```

## Development Setup

### Prerequisites Installation

#### macOS (for iOS development)
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node and Watchman
brew install node watchman

# Install Ruby (for CocoaPods)
brew install ruby
gem install cocoapods

# Install Java 17
brew install openjdk@17

# Install Android Studio (download from website)
# Configure ANDROID_HOME in ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### Windows (with WSL2)
```bash
# In WSL2 Ubuntu
sudo apt update
sudo apt install -y openjdk-17-jdk nodejs npm watchman

# Install Android Studio on Windows
# Configure environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# For WSL2, additional networking setup required
# See troubleshooting section
```

### Project Creation

```bash
# Create new React Native project
npx react-native init MyApp --template react-native-template-typescript
cd MyApp

# iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Verify setup
npx react-native doctor
```

## Code Standards

### Component Structure
```typescript
/**
 * @file screens/HomeScreen.tsx
 * @description Main home screen component
 */

import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

interface HomeScreenProps {
  navigation: any; // Use proper navigation types
}

/**
 * Home screen component
 * @param {HomeScreenProps} props - Component props
 * @returns {JSX.Element} Rendered screen
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Load initial data
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.content}>
          <Text style={styles.title}>Welcome {user?.name}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

## Navigation Setup

```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

## State Management

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## API Service Layer

```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'
  : 'https://api.production.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor for auth
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

## Testing Strategy

### Unit Testing
```typescript
// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../src/components/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Build & Deployment

### Android
```bash
# Debug build
npx react-native run-android

# Release build
cd android
./gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/app-release.apk

# Bundle for Play Store
./gradlew bundleRelease
# AAB location: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS
```bash
# Debug build
npx react-native run-ios

# Release build (requires Apple Developer account)
# 1. Open ios/[ProjectName].xcworkspace in Xcode
# 2. Select Generic iOS Device
# 3. Product → Archive
# 4. Upload to App Store Connect
```

## Performance Optimization

1. **Use React.memo for expensive components**
2. **Implement FlatList for long lists**
3. **Optimize images (use WebP format)**
4. **Enable Hermes for Android**
5. **Use lazy loading for screens**
6. **Minimize bridge calls**

## Security Best Practices

- [ ] Store sensitive data in Keychain (iOS) / Keystore (Android)
- [ ] Implement certificate pinning
- [ ] Obfuscate code with ProGuard (Android)
- [ ] Use HTTPS only
- [ ] Validate all inputs
- [ ] Implement biometric authentication
- [ ] Regular dependency updates

## Common Issues & Solutions

### Metro Bundler Issues
```bash
# Clear cache
npx react-native start --reset-cache

# Clean and rebuild
cd android && ./gradlew clean
cd ios && rm -rf build/ && pod install
```

### Build Failures
```bash
# Android
cd android && ./gradlew clean
rm -rf ~/.gradle/caches/

# iOS
cd ios && rm -rf Pods/ Podfile.lock && pod install
rm -rf ~/Library/Developer/Xcode/DerivedData
```

## Debugging Tools

1. **React Native Debugger** - Standalone debugger
2. **Flipper** - Mobile debugging platform
3. **Reactotron** - Desktop app for debugging
4. **Chrome DevTools** - For JS debugging
5. **Xcode Instruments** - iOS performance profiling
6. **Android Studio Profiler** - Android performance profiling
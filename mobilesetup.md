# React Native Mobile Development Environment Setup Guide

This guide documents the complete process for setting up a React Native Android development environment, including all the critical steps and troubleshooting required for successful native module compilation and APK building.

## Environment Overview

### Tested Configuration
- **OS**: Linux 6.6.87.2-microsoft-standard-WSL2
- **Node.js**: 22.16.0 (latest LTS)
- **React Native**: 0.76.5
- **React Native CLI**: 16.0.3 (v17+ incompatible with Node.js 22)
- **Metro Bundler**: 0.82.5
- **Android Gradle Plugin**: 8.1.4
- **Gradle**: 8.6
- **NDK**: 27.1.12297006
- **Java**: OpenJDK 21

## Critical Version Compatibility

### React Native CLI Version
- **Use v16.0.3** - Latest version compatible with Node.js 22.x
- **Avoid v17+** - Has compatibility issues with Node.js 22.x
- Error symptom: "Cannot read properties of undefined (reading 'handle')"

```bash
npm install -g @react-native-community/cli@16.0.3
```

### Metro Bundler
- **Use v0.82.5** - Works well with CLI v16.0.3
- Stable configuration for React Native 0.76.5

## Android SDK Requirements

### SDK Versions
- **compileSdkVersion**: 35 (required for androidx.core 1.15.0)
- **targetSdkVersion**: 34
- **minSdkVersion**: 24
- **buildToolsVersion**: 34.0.0

### NDK Configuration
- **NDK Version**: 27.1.12297006 (verify with existing installation)
- **Architectures**: armeabi-v7a, arm64-v8a, x86, x86_64

### Gradle Memory Configuration
```properties
# gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## React Native Android Dependencies

### Maven Central Configuration
React Native 0.71+ distributes Android artifacts via Maven Central, not npm:

```gradle
// android/build.gradle
allprojects {
    repositories {
        mavenCentral {
            // React Native 0.71+ requires Maven Central for Android artifacts
            // No exclusions needed for React Native 0.76+
        }
        google()
        maven { url 'https://www.jitpack.io' }
    }
}
```

### Native Module Autolinking
Ensure autolinking is properly configured:

```gradle
// android/settings.gradle
reactSettings {
    autolinkLibrariesFromCommand()
}
```

### Critical Build Configuration
```gradle
// android/app/build.gradle
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

android {
    namespace "com.golfmobile"
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    buildFeatures {
        buildConfig true
    }
    
    defaultConfig {
        applicationId "com.golfmobile"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        buildConfigField "boolean", "IS_NEW_ARCHITECTURE_ENABLED", isNewArchitectureEnabled().toString()
    }
}

dependencies {
    implementation "com.facebook.react:react-android:0.76.5"  // From Maven Central
    
    // Native module dependencies from autolinking
    implementation project(':react-native-async-storage_async-storage')
    implementation project(':react-native-community_netinfo')
    implementation project(':react-native-device-info')
    implementation project(':react-native-geolocation-service')
    implementation project(':react-native-keychain')
    implementation project(':react-native-maps')
    implementation project(':react-native-permissions')
    implementation project(':react-native-safe-area-context')
    implementation project(':react-native-screens')
    implementation project(':react-native-vector-icons')
}
```

## Common Build Issues and Solutions

### 1. CompileSdk Version Conflicts
**Error**: androidx.core dependency requires compileSdk 35
**Solution**: Update compileSdkVersion from 34 to 35:
```gradle
// android/build.gradle
ext {
    compileSdkVersion = 35
}
```

### 2. React Configuration Deprecation
**Error**: "Using old project.ext.react configuration"
**Current Fix**: Continue using project.ext.react format (new format not yet supported):
```gradle
project.ext.react = [
    enableHermes: true
]
```

### 3. MainActivity Deprecated Methods
**Error**: isConcurrentRootEnabled() override not found
**Solution**: Remove deprecated override (enabled by default in RN 0.76+):
```java
// Remove this deprecated method:
// @Override
// protected boolean isConcurrentRootEnabled() { ... }
```

### 4. Native Module Compilation Missing
**Symptoms**: PackageList.java cannot import native module classes
**Solution**: Add explicit dependencies in app/build.gradle:
```gradle
dependencies {
    // Add each native module as explicit dependency
    implementation project(':react-native-async-storage_async-storage')
    // ... etc for all modules
}
```

### 5. Kotlin Plugin Missing
**Error**: org/jetbrains/kotlin/gradle/dsl/KotlinTopLevelExtension
**Solution**: Add Kotlin plugin to buildscript:
```gradle
// android/build.gradle
dependencies {
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.20")
}
```

## Build Process Steps

### 1. Verify Native Module Compilation
```bash
cd android
./gradlew app:compileDebugJavaWithJavac
```

### 2. Build Complete APK
```bash
./gradlew assembleDebug
```

### 3. Verify APK Output
```bash
ls -la app/build/outputs/apk/debug/
# Should show: app-debug.apk (typically 100-150MB)
```

### 4. Verify PackageList Generation
```bash
find . -name "PackageList.java" -type f
# Should find: ./app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java
```

## Native Modules Supported

The following native modules are configured and tested:

1. **@react-native-async-storage/async-storage** - Local storage
2. **@react-native-community/netinfo** - Network status
3. **react-native-device-info** - Device information
4. **react-native-geolocation-service** - GPS location
5. **react-native-keychain** - Secure storage
6. **react-native-maps** - Map integration
7. **react-native-permissions** - Permission management
8. **react-native-safe-area-context** - Safe area handling
9. **react-native-screens** - Native navigation
10. **react-native-vector-icons** - Icon library

## Disabled Modules

These modules are disabled due to compilation issues:
- **react-native-nitro-sqlite**: Android platform disabled in react-native.config.js
- **react-native-gesture-handler**: Android platform disabled in react-native.config.js

## Testing and Validation

### Build Validation Commands
```bash
# Test Java compilation
./gradlew app:compileDebugJavaWithJavac

# Test complete APK build
./gradlew assembleDebug

# Clean build (if needed)
./gradlew clean
```

### Expected Build Output
- No compilation errors
- All native modules compile successfully
- APK generated in app/build/outputs/apk/debug/
- PackageList.java contains all native module imports

## Development Workflow

### Initial Setup
1. Install Node.js 22.x LTS
2. Install React Native CLI v16.0.3
3. Configure Android SDK with API 35
4. Install NDK 27.1.12297006
5. Set Gradle memory to 4GB

### Build Process
1. Run Metro bundler: `npx react-native start`
2. Build APK: `cd android && ./gradlew assembleDebug`
3. Install APK: `adb install app/build/outputs/apk/debug/app-debug.apk`
4. Connect to Metro for development

### Troubleshooting Checklist
- [ ] React Native CLI version is 16.0.3
- [ ] compileSdkVersion is 35
- [ ] All native modules have explicit dependencies
- [ ] Kotlin plugin is included
- [ ] Gradle memory is sufficient (4GB)
- [ ] Maven Central has no exclusions
- [ ] Autolinking is configured

## Architecture Documentation

This setup supports the Golf Tracking App architecture with:
- Production-ready build configuration
- All required native modules for GPS, maps, storage
- Optimized for development and release builds
- Compatible with latest React Native and Android toolchain

## Future Maintenance

When updating React Native versions:
1. Check CLI compatibility with Node.js version
2. Verify compileSdk requirements for new androidx versions
3. Test native module compilation after updates
4. Update this guide with any new compatibility requirements

Last verified: 2025-01-12 with React Native 0.76.5
#!/bin/bash
echo "🔧 Optimized Build Process for MapLibre Migration"
echo "================================================"

# Clean up
echo "1️⃣ Cleaning up old processes and caches..."
./gradlew --stop
pkill -f gradle 2>/dev/null || true
rm -rf ~/.gradle/caches/transforms-3/
rm -rf ~/.gradle/caches/jars-9/*.lock*
rm -rf android/app/build/
rm -rf android/build/

# Set environment
echo "2️⃣ Setting environment variables..."
export GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx4096m -XX:+UseParallelGC"
export _JAVA_OPTIONS="-Xmx4096m"

# Build step by step
echo "3️⃣ Building MapLibre module first..."
./gradlew :maplibre_maplibre-react-native:assembleDebug --no-daemon --max-workers=2

echo "4️⃣ Building app module..."
./gradlew :app:assembleDebug --no-daemon --max-workers=2 --continue

echo "5️⃣ Checking for APK..."
find android -name "app-debug.apk" -type f 2>/dev/null

echo "Build process complete!"
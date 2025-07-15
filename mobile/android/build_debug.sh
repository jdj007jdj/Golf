#!/bin/bash
echo "Starting simplified build process..."
echo "Step 1: Stopping all gradle daemons"
./gradlew --stop

echo "Step 2: Clearing gradle caches"
rm -rf ~/.gradle/caches/modules-2/files-2.1/org.maplibre*
rm -rf ~/.gradle/caches/transforms-3/

echo "Step 3: Building with no daemon and limited workers"
./gradlew assembleDebug --no-daemon --max-workers=2 --console=plain 2>&1 | tee build_output.log
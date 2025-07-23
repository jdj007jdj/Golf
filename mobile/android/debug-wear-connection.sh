#!/bin/bash

echo "🔍 Wear OS Connection Debugger"
echo "=============================="

# Get device IDs
echo -e "\n📱 Checking connected devices..."
DEVICES=$(adb devices | grep -E "device$" | cut -f1)
DEVICE_COUNT=$(echo "$DEVICES" | wc -l)

if [ $DEVICE_COUNT -lt 2 ]; then
    echo "❌ Error: Need both phone and watch connected"
    echo "   Found $DEVICE_COUNT device(s)"
    exit 1
fi

# Identify phone and watch
PHONE_ID=""
WATCH_ID=""

for device in $DEVICES; do
    MODEL=$(adb -s $device shell getprop ro.product.model 2>/dev/null | tr -d '\r\n')
    if [[ $MODEL == *"Watch"* ]] || [[ $MODEL == *"Wear"* ]]; then
        WATCH_ID=$device
        echo "⌚ Watch found: $device ($MODEL)"
    else
        PHONE_ID=$device
        echo "📱 Phone found: $device ($MODEL)"
    fi
done

if [ -z "$WATCH_ID" ]; then
    echo "❌ Could not identify watch device"
    echo "   Please specify manually: WATCH_ID=<device-id> ./debug-wear-connection.sh"
    exit 1
fi

echo -e "\n🔧 Step 1: Check if apps are installed"
echo "---------------------------------------"

# Check phone app
PHONE_APP=$(adb -s $PHONE_ID shell pm list packages | grep com.minimalapp)
if [ -n "$PHONE_APP" ]; then
    echo "✅ Phone app installed: com.minimalapp"
else
    echo "❌ Phone app NOT installed"
fi

# Check wear app
WEAR_APP=$(adb -s $WATCH_ID shell pm list packages | grep com.golfapp.wear)
if [ -n "$WEAR_APP" ]; then
    echo "✅ Wear app installed: com.golfapp.wear"
else
    echo "❌ Wear app NOT installed"
fi

echo -e "\n🔧 Step 2: Check Wearable services"
echo "-----------------------------------"

# Check if Wearable services are running on watch
echo "Checking watch services..."
adb -s $WATCH_ID shell dumpsys activity services | grep -E "WearableListenerService|MinimalWearableService|DirectMessageService" | head -10

echo -e "\n🔧 Step 3: Monitor logs in real-time"
echo "------------------------------------"
echo "Starting log monitoring..."
echo "1. Send a test message from phone app"
echo "2. Look for 'MESSAGE RECEIVED' or 'Failed to deliver' messages"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Clear existing logs
adb -s $WATCH_ID logcat -c
adb -s $PHONE_ID logcat -c

# Start monitoring both devices
echo "=== WATCH LOGS ==="
adb -s $WATCH_ID logcat -v time | grep -E "WearableListenerService|MinimalWear|DirectMessage|GolfWear|MESSAGE|Failed to deliver" --line-buffered &
WATCH_PID=$!

echo -e "\n=== PHONE LOGS ==="
adb -s $PHONE_ID logcat -v time | grep -E "WearableModule|TEST:" --line-buffered &
PHONE_PID=$!

# Wait for user to stop
read -p "Press Enter to stop monitoring..."

# Kill background processes
kill $WATCH_PID 2>/dev/null
kill $PHONE_PID 2>/dev/null

echo -e "\n✅ Debug session complete"
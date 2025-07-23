#!/bin/bash

# Wear OS Testing Helper Script

echo "🎯 Golf App - Wear OS Testing Helper"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "settings.gradle" ]; then
    echo -e "${RED}Error: Run this script from mobile/android directory${NC}"
    exit 1
fi

# Function to check if emulator is running
check_emulator() {
    local device=$1
    if adb devices | grep -q "$device"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for device
wait_for_device() {
    local device=$1
    echo -e "${YELLOW}Waiting for $device...${NC}"
    adb -s $device wait-for-device
    echo -e "${GREEN}$device is ready!${NC}"
}

# Main menu
echo ""
echo "Select an option:"
echo "1) Build both apps (Phone + Wear)"
echo "2) Install apps on emulators"
echo "3) Build and install everything"
echo "4) Clean build"
echo "5) View logs (Phone)"
echo "6) View logs (Wear)"
echo "7) Check connection status"
echo "8) Clear app data"
echo "9) Full test setup (build, install, launch)"
echo ""
read -p "Enter choice [1-9]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Building apps...${NC}"
        ./gradlew :app:assembleDebug :wear:assembleDebug
        echo -e "${GREEN}Build complete!${NC}"
        echo "Phone APK: app/build/outputs/apk/debug/app-debug.apk"
        echo "Wear APK: wear/build/outputs/apk/debug/wear-debug.apk"
        ;;
        
    2)
        # Get device list
        devices=($(adb devices | grep -E "emulator-[0-9]+" | cut -f1))
        
        if [ ${#devices[@]} -lt 2 ]; then
            echo -e "${RED}Error: Need at least 2 emulators running${NC}"
            echo "Found devices: ${devices[@]}"
            exit 1
        fi
        
        PHONE_DEVICE=${devices[0]}
        WEAR_DEVICE=${devices[1]}
        
        echo -e "${YELLOW}Installing on Phone ($PHONE_DEVICE)...${NC}"
        adb -s $PHONE_DEVICE install -r app/build/outputs/apk/debug/app-debug.apk
        
        echo -e "${YELLOW}Installing on Wear ($WEAR_DEVICE)...${NC}"
        adb -s $WEAR_DEVICE install -r wear/build/outputs/apk/debug/wear-debug.apk
        
        echo -e "${GREEN}Installation complete!${NC}"
        ;;
        
    3)
        $0 1  # Build
        $0 2  # Install
        ;;
        
    4)
        echo -e "${YELLOW}Cleaning build directories...${NC}"
        ./gradlew clean
        echo -e "${GREEN}Clean complete!${NC}"
        ;;
        
    5)
        devices=($(adb devices | grep -E "emulator-[0-9]+" | cut -f1))
        PHONE_DEVICE=${devices[0]}
        echo -e "${YELLOW}Showing logs from Phone ($PHONE_DEVICE)...${NC}"
        echo "Press Ctrl+C to stop"
        adb -s $PHONE_DEVICE logcat | grep -E "WearableModule|WearableService|ReactNative"
        ;;
        
    6)
        devices=($(adb devices | grep -E "emulator-[0-9]+" | cut -f1))
        WEAR_DEVICE=${devices[1]}
        echo -e "${YELLOW}Showing logs from Wear ($WEAR_DEVICE)...${NC}"
        echo "Press Ctrl+C to stop"
        adb -s $WEAR_DEVICE logcat | grep -E "MainActivity|Fragment|GPS"
        ;;
        
    7)
        devices=($(adb devices | grep -E "emulator-[0-9]+" | cut -f1))
        PHONE_DEVICE=${devices[0]}
        echo -e "${YELLOW}Checking Wearable connection status...${NC}"
        adb -s $PHONE_DEVICE shell dumpsys activity services | grep -A 10 -i wearable
        ;;
        
    8)
        devices=($(adb devices | grep -E "emulator-[0-9]+" | cut -f1))
        PHONE_DEVICE=${devices[0]}
        WEAR_DEVICE=${devices[1]}
        
        echo -e "${YELLOW}Clearing app data...${NC}"
        adb -s $PHONE_DEVICE shell pm clear com.minimalapp
        adb -s $WEAR_DEVICE shell pm clear com.golfapp.wear
        echo -e "${GREEN}App data cleared!${NC}"
        ;;
        
    9)
        echo -e "${YELLOW}Running full test setup...${NC}"
        
        # Build
        $0 1
        
        # Install
        $0 2
        
        # Clear data
        $0 8
        
        # Launch apps
        devices=($(adb devices | grep -E "emulator-[0-9]+" | cut -f1))
        PHONE_DEVICE=${devices[0]}
        WEAR_DEVICE=${devices[1]}
        
        echo -e "${YELLOW}Launching apps...${NC}"
        adb -s $PHONE_DEVICE shell am start -n com.minimalapp/.MainActivity
        sleep 2
        adb -s $WEAR_DEVICE shell am start -n com.golfapp.wear/.MainActivity
        
        echo -e "${GREEN}Full test setup complete!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Start Metro bundler: cd .. && npm start"
        echo "2. In phone app, start a round"
        echo "3. Test watch features"
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
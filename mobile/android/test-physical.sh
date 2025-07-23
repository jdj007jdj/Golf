#!/bin/bash

# Physical Device Testing Helper Script
# For testing with real Android phone and Samsung Watch

echo "🎯 Golf App - Physical Device Testing"
echo "====================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to get device name
get_device_name() {
    local device=$1
    local name=$(adb -s $device shell getprop ro.product.model 2>/dev/null | tr -d '\r\n')
    echo "$name"
}

# Get all connected devices
echo -e "${YELLOW}Scanning for devices...${NC}"
DEVICES=($(adb devices | grep -v "List" | grep "device" | cut -f1))

if [ ${#DEVICES[@]} -eq 0 ]; then
    echo -e "${RED}No devices found! Please check:${NC}"
    echo "1. USB debugging is enabled on phone"
    echo "2. Watch WiFi debugging is enabled"
    echo "3. For watch: adb connect [WATCH_IP]:5555"
    exit 1
fi

# Display found devices
echo -e "${GREEN}Found ${#DEVICES[@]} device(s):${NC}"
for i in "${!DEVICES[@]}"; do
    device=${DEVICES[$i]}
    name=$(get_device_name $device)
    echo "$((i+1)). $device - $name"
done

# Select devices
if [ ${#DEVICES[@]} -eq 1 ]; then
    echo -e "${YELLOW}Only one device found. Please connect your watch via WiFi:${NC}"
    echo "On watch: Settings → Developer options → Debug over WiFi"
    echo "Then run: adb connect [WATCH_IP]:5555"
    exit 1
fi

# Auto-select if only 2 devices
if [ ${#DEVICES[@]} -eq 2 ]; then
    PHONE=${DEVICES[0]}
    WATCH=${DEVICES[1]}
    echo -e "${GREEN}Auto-selected:${NC}"
    echo "Phone: $PHONE - $(get_device_name $PHONE)"
    echo "Watch: $WATCH - $(get_device_name $WATCH)"
else
    # Manual selection for 3+ devices
    echo ""
    read -p "Select PHONE device number: " phone_num
    PHONE=${DEVICES[$((phone_num-1))]}
    
    echo ""
    read -p "Select WATCH device number: " watch_num
    WATCH=${DEVICES[$((watch_num-1))]}
fi

# Menu
echo ""
echo -e "${BLUE}=== Testing Menu ===${NC}"
echo "1) Quick Install (both apps)"
echo "2) Build & Install Everything"
echo "3) Phone Logs (Wearable)"
echo "4) Watch Logs"
echo "5) Test Connection"
echo "6) Grant Permissions"
echo "7) Clear App Data"
echo "8) Battery Stats"
echo "9) Full Test Setup"
echo ""
read -p "Select option [1-9]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Installing apps...${NC}"
        if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
            echo "Installing on phone..."
            adb -s $PHONE install -r app/build/outputs/apk/debug/app-debug.apk
        else
            echo -e "${RED}Phone APK not found! Build first.${NC}"
        fi
        
        if [ -f "wear/build/outputs/apk/debug/wear-debug.apk" ]; then
            echo "Installing on watch..."
            adb -s $WATCH install -r wear/build/outputs/apk/debug/wear-debug.apk
        else
            echo -e "${RED}Watch APK not found! Build first.${NC}"
        fi
        ;;
        
    2)
        echo -e "${YELLOW}Building apps...${NC}"
        ./gradlew :app:assembleDebug :wear:assembleDebug
        
        echo -e "${YELLOW}Installing on phone...${NC}"
        adb -s $PHONE install -r app/build/outputs/apk/debug/app-debug.apk
        
        echo -e "${YELLOW}Installing on watch...${NC}"
        adb -s $WATCH install -r wear/build/outputs/apk/debug/wear-debug.apk
        
        echo -e "${GREEN}Complete!${NC}"
        ;;
        
    3)
        echo -e "${YELLOW}Phone Wearable Logs (Ctrl+C to stop)${NC}"
        adb -s $PHONE logcat -v time | grep -E "WearableModule|WearableService|WearableListener|ReactNative.*Wearable"
        ;;
        
    4)
        echo -e "${YELLOW}Watch Logs (Ctrl+C to stop)${NC}"
        adb -s $WATCH logcat -v time | grep -E "MainActivity|Fragment|GPS|golf"
        ;;
        
    5)
        echo -e "${YELLOW}Testing connection...${NC}"
        
        # Check if apps are installed
        echo -e "${BLUE}Checking installations:${NC}"
        phone_installed=$(adb -s $PHONE shell pm list packages | grep com.minimalapp)
        watch_installed=$(adb -s $WATCH shell pm list packages | grep com.golfapp.wear)
        
        if [ -n "$phone_installed" ]; then
            echo -e "${GREEN}✓ Phone app installed${NC}"
        else
            echo -e "${RED}✗ Phone app NOT installed${NC}"
        fi
        
        if [ -n "$watch_installed" ]; then
            echo -e "${GREEN}✓ Watch app installed${NC}"
        else
            echo -e "${RED}✗ Watch app NOT installed${NC}"
        fi
        
        # Check Wearable service
        echo -e "${BLUE}Checking Wearable service:${NC}"
        adb -s $PHONE shell dumpsys activity services | grep -i wearable | head -5
        ;;
        
    6)
        echo -e "${YELLOW}Granting permissions...${NC}"
        
        # Phone permissions
        echo "Phone permissions:"
        adb -s $PHONE shell pm grant com.minimalapp android.permission.ACCESS_FINE_LOCATION
        adb -s $PHONE shell pm grant com.minimalapp android.permission.ACCESS_COARSE_LOCATION
        
        # Watch permissions
        echo "Watch permissions:"
        adb -s $WATCH shell pm grant com.golfapp.wear android.permission.ACCESS_FINE_LOCATION
        adb -s $WATCH shell pm grant com.golfapp.wear android.permission.ACCESS_COARSE_LOCATION
        adb -s $WATCH shell pm grant com.golfapp.wear android.permission.BODY_SENSORS
        
        echo -e "${GREEN}Permissions granted!${NC}"
        ;;
        
    7)
        echo -e "${YELLOW}Clearing app data...${NC}"
        adb -s $PHONE shell pm clear com.minimalapp
        adb -s $WATCH shell pm clear com.golfapp.wear
        echo -e "${GREEN}App data cleared!${NC}"
        ;;
        
    8)
        echo -e "${YELLOW}Battery Stats${NC}"
        echo -e "${BLUE}Watch battery info:${NC}"
        adb -s $WATCH shell dumpsys battery | grep -E "level|temperature|status"
        
        echo ""
        echo -e "${BLUE}Watch app battery usage:${NC}"
        adb -s $WATCH shell dumpsys batterystats | grep -A 10 "com.golfapp.wear" | head -15
        ;;
        
    9)
        echo -e "${YELLOW}Running full test setup...${NC}"
        
        # Build
        echo -e "${BLUE}Step 1: Building apps${NC}"
        ./gradlew :app:assembleDebug :wear:assembleDebug
        
        # Clear old data
        echo -e "${BLUE}Step 2: Clearing old data${NC}"
        adb -s $PHONE shell pm clear com.minimalapp 2>/dev/null
        adb -s $WATCH shell pm clear com.golfapp.wear 2>/dev/null
        
        # Install
        echo -e "${BLUE}Step 3: Installing apps${NC}"
        adb -s $PHONE install -r app/build/outputs/apk/debug/app-debug.apk
        adb -s $WATCH install -r wear/build/outputs/apk/debug/wear-debug.apk
        
        # Grant permissions
        echo -e "${BLUE}Step 4: Granting permissions${NC}"
        adb -s $PHONE shell pm grant com.minimalapp android.permission.ACCESS_FINE_LOCATION
        adb -s $WATCH shell pm grant com.golfapp.wear android.permission.ACCESS_FINE_LOCATION
        
        # Setup port forwarding for Metro
        echo -e "${BLUE}Step 5: Setting up Metro port${NC}"
        adb -s $PHONE reverse tcp:8081 tcp:8081
        
        # Launch apps
        echo -e "${BLUE}Step 6: Launching apps${NC}"
        adb -s $PHONE shell am start -n com.minimalapp/.MainActivity
        sleep 2
        adb -s $WATCH shell am start -n com.golfapp.wear/.MainActivity
        
        echo ""
        echo -e "${GREEN}Setup complete!${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Start Metro: cd .. && npm start"
        echo "2. The phone app should be running"
        echo "3. Start a round to test watch integration"
        echo ""
        echo -e "${BLUE}Device IPs for reference:${NC}"
        echo "Phone: $PHONE"
        echo "Watch: $WATCH"
        ;;
        
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
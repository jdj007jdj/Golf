@echo off
echo Installing Golf App on Both Phone and Watch...
echo ============================================
echo.

echo Installing golf.apk on phone (RFCT81BTYZB)...
adb -s RFCT81BTYZB install -r golf.apk
if %errorlevel% neq 0 (
    echo Failed to install phone app!
    echo Make sure golf.apk exists in current directory
    pause
    exit /b %errorlevel%
)
echo Phone app installed successfully!

echo.
echo Installing golfwear.apk on watch (192.168.0.168:40213)...
adb -s 192.168.0.168:40213 install -r golfwear.apk
if %errorlevel% neq 0 (
    echo Failed to install wear app!
    echo Make sure:
    echo 1. Watch is connected (adb devices shows 192.168.0.168:40213)
    echo 2. golfwear.apk exists in current directory
    pause
    exit /b %errorlevel%
)
echo Wear app installed successfully!

echo.
echo ============================================
echo Both apps installed with matching signatures!
echo You can now test the Wearable API communication.
echo ============================================
pause
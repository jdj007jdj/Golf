@echo off
echo Installing Golf App on Wear OS Watch (192.168.0.168:40213)...
echo.

echo Installing golfwear.apk on watch...
adb -s 192.168.0.168:40213 install -r golfwear.apk

if %errorlevel% equ 0 (
    echo.
    echo Wear app installed successfully!
) else (
    echo.
    echo Failed to install wear app!
    echo Make sure:
    echo 1. ADB debugging is enabled on watch
    echo 2. Watch is connected (adb devices should show 192.168.0.168:40213)
    echo 3. golfwear.apk exists in current directory
)

pause
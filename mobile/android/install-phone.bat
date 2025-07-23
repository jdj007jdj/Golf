@echo off
echo Installing Golf App on Phone (RFCT81BTYZB)...
echo.

echo Installing golf.apk on phone...
adb -s RFCT81BTYZB install -r golf.apk

if %errorlevel% equ 0 (
    echo.
    echo Phone app installed successfully!
) else (
    echo.
    echo Failed to install phone app!
    echo Make sure golf.apk exists in current directory
)

pause
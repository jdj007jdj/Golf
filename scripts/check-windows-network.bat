@echo off
echo === Checking Network Configuration ===
echo.

echo Your Windows IP addresses:
ipconfig | findstr /i "ipv4"
echo.

echo Testing backend connectivity:
curl -s http://localhost:3000/health >nul 2>&1 && echo [OK] localhost:3000 || echo [FAIL] localhost:3000
curl -s http://127.0.0.1:3000/health >nul 2>&1 && echo [OK] 127.0.0.1:3000 || echo [FAIL] 127.0.0.1:3000

echo.
echo Checking Windows Firewall rules for port 3000:
netsh advfirewall firewall show rule name=all | findstr /i "3000" >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Firewall rule exists for port 3000
    netsh advfirewall firewall show rule name=all | findstr /i "3000"
) else (
    echo [!] No firewall rule found for port 3000
    echo.
    echo To add a firewall rule, run this command as Administrator:
    echo netsh advfirewall firewall add rule name="Golf Backend Port 3000" dir=in action=allow protocol=TCP localport=3000
)

echo.
echo Checking port listening status:
netstat -an | findstr :3000

echo.
pause
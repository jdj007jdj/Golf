# WSL2 Port Forwarding Script for Golf Backend
# Run this in Windows PowerShell as Administrator

$ports = @(3000)  # Backend port
$wslAddress = bash.exe -c "hostname -I | awk '{print $1}'"
$listenAddress = '0.0.0.0'

# Remove any existing port proxies for these ports
foreach ($port in $ports) {
    Write-Host "Removing existing port proxy for port $port..." -ForegroundColor Yellow
    iex "netsh interface portproxy delete v4tov4 listenport=$port listenaddress=$listenAddress"
}

# Add new port proxies
foreach ($port in $ports) {
    Write-Host "Adding port proxy for port $port..." -ForegroundColor Green
    iex "netsh interface portproxy add v4tov4 listenport=$port listenaddress=$listenAddress connectport=$port connectaddress=$wslAddress"
}

# Display all port proxies
Write-Host "`nCurrent port proxies:" -ForegroundColor Cyan
iex "netsh interface portproxy show v4tov4"

# Test the connection
Write-Host "`nTesting backend connection..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Backend is accessible from Windows!" -ForegroundColor Green
    Write-Host "You can now access the backend from: http://localhost:3000" -ForegroundColor Green
    Write-Host "Or from your phone using: http://$(ipconfig | Select-String -Pattern 'IPv4.*: (192\.168\.\d+\.\d+)' | ForEach-Object { $_.Matches.Groups[1].Value } | Select-Object -First 1):3000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend is not accessible" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
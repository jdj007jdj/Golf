# Fix WSL2 Networking for Golf Backend
# Run as Administrator in PowerShell

Write-Host "Fixing WSL2 networking for Golf backend..." -ForegroundColor Yellow

# Get WSL IP
$wslIp = bash.exe -c "hostname -I | awk '{print $1}'"
Write-Host "WSL IP: $wslIp" -ForegroundColor Cyan

# Remove existing port proxy
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=* 2>$null

# Add port proxy for all interfaces
Write-Host "Setting up port forwarding..." -ForegroundColor Yellow
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp

# Add firewall rule if it doesn't exist
$ruleName = "Golf Backend Port 3000"
$existingRule = netsh advfirewall firewall show rule name="$ruleName" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding firewall rule..." -ForegroundColor Yellow
    netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=3000 profile=any
} else {
    Write-Host "Firewall rule already exists" -ForegroundColor Green
}

# Show current port proxies
Write-Host "`nCurrent port proxies:" -ForegroundColor Cyan
netsh interface portproxy show v4tov4

Write-Host "`nTesting connectivity..." -ForegroundColor Yellow

# Test different endpoints
$endpoints = @(
    "http://localhost:3000/health",
    "http://127.0.0.1:3000/health",
    "http://192.168.0.123:3000/health"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 2
        Write-Host "[OK] $endpoint" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $endpoint - $_" -ForegroundColor Red
    }
}

Write-Host "`nDone! Your Android device should now be able to connect to http://192.168.0.123:3000" -ForegroundColor Green
# stop-all.ps1
# PowerShell script to stop all StockWise Spring Boot processes running on the designated ports

Write-Host "=============================================" -ForegroundColor Red
Write-Host "   StockWise Microservices Shutdown Script   " -ForegroundColor Red
Write-Host "=============================================" -ForegroundColor Red

$ports = @(9090, 8081, 8082, 8083, 8084, 8085, 8086)

Write-Host "Stopping StockWise backend services..." -ForegroundColor Yellow

foreach ($port in $ports) {
    # Find process ID using netstat
    $netstat = netstat -ano | Select-String "LISTENING" | Select-String ":$port "
    if ($netstat) {
        # Extract the process ID from the netstat line
        $pidStr = ($netstat.Line -split '\s+')[-1]
        if ($pidStr -and $pidStr -ne "0") {
            Write-Host "Stopping service on port $port (PID: $pidStr)..." -ForegroundColor Cyan
            Stop-Process -Id $pidStr -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "No process active on port $port" -ForegroundColor Gray
    }
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "Cleanup completed successfully!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

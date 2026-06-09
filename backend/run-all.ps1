# run-all.ps1
# PowerShell script to run all StockWise Spring Boot microservices in separate windows

Write-Host "=============================================" -ForegroundColor Green
Write-Host "   StockWise Microservices Startup Script    " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Start Databases reminder
Write-Host "[Reminder] Please ensure MySQL is running on port 3306 and MongoDB on port 27017." -ForegroundColor Cyan

# Check location
if (-not (Test-Path "pom.xml")) {
    Write-Error "Please run this script from the 'backend' folder."
    exit
}

# 1. Build all services
# Write-Host "Step 1: Building all services with Maven..." -ForegroundColor Yellow
# mvn clean install -DskipTests

# if ($LASTEXITCODE -ne 0) {
#     Write-Error "Build failed. Please resolve compilation/dependency issues first."
#     exit
# }

# 2. Define the services and their paths
$services = @(
    @{ Name = "Auth Service"; Path = "auth-service"; Port = 8081 },
    @{ Name = "Inventory Service"; Path = "inventory-service"; Port = 8082 },
    @{ Name = "Supplier Customer Service"; Path = "supplier-customer-service"; Port = 8083 },
    @{ Name = "Purchase Order Service"; Path = "purchase-order-service"; Port = 8084 },
    @{ Name = "Sales Dispatch Service"; Path = "sales-dispatch-service"; Port = 8085 },
    @{ Name = "Analytics Reports Service"; Path = "analytics-reports-service"; Port = 8086 },
    @{ Name = "API Gateway"; Path = "api-gateway"; Port = 9090 }
)

Write-Host "Step 2: Starting services in separate PowerShell windows..." -ForegroundColor Yellow

foreach ($service in $services) {
    Write-Host "Launching $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($service.Path)'; \$Host.UI.RawUI.WindowTitle = '$($service.Name)'; mvn spring-boot:run"
    Start-Sleep -Seconds 2 # Brief pause to serialize startup
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "All services initiated successfully!" -ForegroundColor Green
Write-Host "To stop all services later, run: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green

@echo off
cd /d "%~dp0"
echo ==========================================
echo       FitProgress Launcher
echo ==========================================
echo.

if not exist "node_modules" (
    echo [WARNING] node_modules not found!
    echo Starting automatic setup...
    call setup.bat
)

echo Updating IP Configuration...
node scripts/update-ip.js

for /f "delims=" %%i in ('node scripts/get-ip.js') do set LOCAL_IP=%%i
echo Detected IP: %LOCAL_IP%

echo.
echo Starting Backend and Frontend...
:: Using call to ensure it runs
start "FitProgress Server & Client" cmd /k "npm run dev"

echo.
echo Starting Mobile App...
echo (Ensure your phone is on the same Wi-Fi)
cd mobile
:: Setting the env var directly in the start command string to ensure it propagates
start "FitProgress Mobile" cmd /k "set REACT_NATIVE_PACKAGER_HOSTNAME=%LOCAL_IP% && npx expo start --clear"
cd ..

echo.
echo ==========================================
echo       All Services Started!
echo ==========================================
echo 1. Server and Client running in one window.
echo 2. Mobile bundler running in another window.
echo.
echo Scan the QR code in the Mobile window with Expo Go.
echo.
echo If windows closed immediately, check for errors.
echo.
pause

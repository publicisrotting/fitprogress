@echo off
cd /d "%~dp0"
echo ==========================================
echo       FitProgress Setup Script
echo ==========================================
echo.
echo Installing Root dependencies...
call npm install

echo.
echo Installing Server dependencies...
cd server
call npm install
cd ..

echo.
echo Installing Mobile dependencies...
cd mobile
call npm install
cd ..

echo.
echo ==========================================
echo       Installation Complete!
echo ==========================================
pause

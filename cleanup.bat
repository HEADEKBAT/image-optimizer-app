@echo off
echo 🧹 Closing Electron processes...
taskkill /f /im electron.exe 2>nul
timeout /t 2 /nobreak >nul
echo 🗑️ Cleaning directories...
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
echo ✅ Cleanup completed!
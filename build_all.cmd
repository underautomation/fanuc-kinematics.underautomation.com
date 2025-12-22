@echo off
echo ==========================================
echo 1. Building .NET Logic (WASM)
echo ==========================================
cd src\RobotLogic
dotnet publish -c Release
if %errorlevel% neq 0 (
    echo .NET Build Failed!
    pause
    exit /b %errorlevel%
)
cd ..\..

echo ==========================================
echo 2. Building React Client (Static Site)
echo ==========================================
cd src\Client
call npm run build
if %errorlevel% neq 0 (
    echo Client Build Failed!
    pause
    exit /b %errorlevel%
)

echo ==========================================
echo FULL BUILD COMPLETE
echo Output is in src/Client/dist
echo ==========================================
pause

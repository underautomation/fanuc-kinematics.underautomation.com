@echo off
echo Building .NET Logic...
cd src\RobotLogic
dotnet publish -c Release
if %errorlevel% neq 0 (
    echo Build Failed!
    if "%CI%"=="" pause
    exit /b %errorlevel%
)
echo .NET Build and Copy Complete.
if "%CI%"=="" pause

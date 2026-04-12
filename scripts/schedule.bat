@echo off
REM Windows Task Scheduler - Daily Job Application Pipeline
REM Run every day at 08:00 AM
REM
REM Setup instructions:
REM 1. Open Task Scheduler (search "Task Scheduler" in Windows)
REM 2. Click "Create Basic Task"
REM 3. Name: "Job Application Pipeline"
REM 4. Trigger: Daily at 08:00 AM
REM 5. Action: Start a program
REM    Program: C:\Windows\System32\cmd.exe
REM    Arguments: /c "C:\Users\hayth\job-agent\scripts\schedule.bat"
REM    Start in: C:\Users\hayth\job-agent
REM
REM Or run this command in PowerShell (as Administrator):
REM schtasks /create /tn "JobApplicationPipeline" /tr "cmd /c C:\Users\hayth\job-agent\scripts\schedule.bat" /sc daily /st 08:00 /ru %USERNAME%

cd /d C:\Users\hayth\job-agent

REM Log file
set LOG_FILE=logs\pipeline_%date:~10,4%-%date:~4,2%-%date:~7,2%.log

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Run the pipeline with logging
echo. >> %LOG_FILE%
echo ========================================== >> %LOG_FILE%
echo Pipeline run: %date% %time% >> %LOG_FILE%
echo ========================================== >> %LOG_FILE%

npx tsx src/pipeline.ts >> %LOG_FILE% 2>&1

REM Check exit code
if %errorlevel% equ 0 (
    echo Success: Pipeline completed at %date% %time% >> %LOG_FILE%
) else (
    echo Error: Pipeline failed with code %errorlevel% at %date% %time% >> %LOG_FILE%
)

exit /b %errorlevel%

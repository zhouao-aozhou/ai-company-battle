@echo off
cd /d "%~dp0"
set "EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
start "" "%EDGE%" "%~dp0index.html"
exit /b 0

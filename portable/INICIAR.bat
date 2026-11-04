@echo off
setlocal
title Rajamine FieldOps
cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo PowerShell nao encontrado. Use Windows 10/11 com PowerShell habilitado.
  pause
  exit /b 1
)

if not exist "%~dp0app\index.html" (
  echo Pasta app nao encontrada. Extraia o ZIP completo antes de iniciar.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1" -Root "%~dp0app" -Port 8080
endlocal

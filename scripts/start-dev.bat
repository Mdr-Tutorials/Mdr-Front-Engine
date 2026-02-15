@echo off
setlocal
set "PROJECT_DIR=D:\Projects\mdr-front-engine"

:: 检查目录
if not exist "%PROJECT_DIR%" (
  echo [ERROR] 目录不存在: %PROJECT_DIR%
  pause
  exit /b 1
)

:: 检查 WT
where wt >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 未找到 Windows Terminal
  pause
  exit /b 1
)

echo [INFO] 正在启动 Windows Terminal...
echo [INFO] 项目目录: %PROJECT_DIR%

:: 使用 cmd /k 保持窗口，方便看错误
wt -w 0 ^
  new-tab --title "mdrcode" -d "%PROJECT_DIR%" cmd /k "echo 测试 mdrcode 环境 && where pnpm && where mdrcode && pause && mdrcode" ^
  ; new-tab --title "dev:web" -d "%PROJECT_DIR%" cmd /k "pnpm run dev:web" ^
  ; new-tab --title "dev:backend" -d "%PROJECT_DIR%" cmd /k "pnpm run dev:backend"

if errorlevel 1 (
  echo [ERROR] Windows Terminal 启动失败，错误码: %errorlevel%
  pause
)

endlocal
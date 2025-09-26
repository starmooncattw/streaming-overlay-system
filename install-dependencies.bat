@echo off
REM Streaming Overlay System - Windows 依賴安裝腳本

echo 🚀 開始安裝 Streaming Overlay System 依賴...

REM 檢查 Node.js 版本
echo 📋 檢查 Node.js 版本...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，請先安裝 Node.js
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set node_version=%%i
echo ✅ Node.js 版本: %node_version%

REM 進入前端目錄
echo 📁 進入前端目錄...
cd frontend

REM 安裝基本依賴
echo 📦 安裝基本依賴...
npm install

REM 安裝缺少的依賴
echo 📦 安裝額外依賴...
npm install uuid @types/uuid

REM 檢查是否存在 .env 文件
echo 🔧 檢查環境變數配置...
if not exist ".env" (
    echo 📝 創建 .env 文件...
    copy .env.example .env
    echo ⚠️  請編輯 .env 文件並配置正確的 Firebase 設定
) else (
    echo ✅ .env 文件已存在
)

REM 顯示完成訊息
echo.
echo 🎉 依賴安裝完成！
echo.
echo 📋 下一步：
echo 1. 編輯 frontend\.env 文件，配置 Firebase 設定
echo 2. 執行 'npm start' 啟動開發服務器
echo 3. 訪問 http://localhost:3000 開始使用
echo.
echo 📚 更多資訊請參考 DEPLOYMENT_GUIDE.md
pause

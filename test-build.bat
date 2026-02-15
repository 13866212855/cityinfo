@echo off
chcp 65001 >nul 2>&1

echo ============================================
echo === 构建测试脚本 ===
echo ============================================
echo.

echo [1/3] 清理旧的构建产物...
if exist dist rmdir /s /q dist
echo [OK] 清理完成
echo.

echo [2/3] 运行TypeScript类型检查...
call npm run build >build.log 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 构建失败！查看 build.log 了解详情
    type build.log
    pause
    exit /b 1
)
echo [OK] 构建成功
echo.

echo [3/3] 检查构建产物...
if not exist dist\index.html (
    echo [ERROR] index.html 未生成
    pause
    exit /b 1
)
if not exist dist\assets (
    echo [ERROR] assets 目录未生成
    pause
    exit /b 1
)
echo [OK] 构建产物完整
echo.

echo ============================================
echo === 测试通过！可以运行 redeploy.bat ===
echo ============================================
echo.
echo 构建产物位置: dist\
dir dist /b
echo.
pause

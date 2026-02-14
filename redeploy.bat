@echo off
chcp 65001 >nul 2>&1

:: Configuration
set IMAGE_NAME=cityinfo
set CONTAINER_NAME=cityinfo
set TEMP_IMAGE_NAME=%IMAGE_NAME%-temp
set HOST_PORT=7733
set CONTAINER_PORT=80
set NETWORK_NAME=mynet

echo ============================================
echo === Docker Redeployment Script ===
echo ============================================
echo Image Name: %IMAGE_NAME%
echo Container Name: %CONTAINER_NAME%
echo Host Port: %HOST_PORT%
echo Container Port: %CONTAINER_PORT%
echo Network: %NETWORK_NAME%
echo ============================================
echo.

:: Step 1: Build new temporary image
echo --- Step 1: Building new temporary image: %TEMP_IMAGE_NAME% ---
docker build -t %TEMP_IMAGE_NAME% .
if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo ERROR: Docker build failed!
    echo ============================================
    pause
    exit /b 1
)
echo [OK] Build successful.
echo.

:: Step 2: Stop and remove existing container
echo --- Step 2: Stopping and removing existing container: %CONTAINER_NAME% ---
docker stop %CONTAINER_NAME% >nul 2>&1
docker rm %CONTAINER_NAME% >nul 2>&1
echo [OK] Container cleanup complete.
echo.

:: Step 3: Remove old image
echo --- Step 3: Removing old image: %IMAGE_NAME% ---
docker rmi %IMAGE_NAME% >nul 2>&1
echo [OK] Old image cleanup complete.
echo.

:: Step 4: Tag temporary image to final name
echo --- Step 4: Tagging temporary image to final name: %IMAGE_NAME% ---
docker tag %TEMP_IMAGE_NAME% %IMAGE_NAME%
docker rmi %TEMP_IMAGE_NAME%
echo [OK] Image renamed successfully.
echo.

:: Step 5: Run new container
echo --- Step 5: Running new container: %CONTAINER_NAME% ---
docker run -d --name %CONTAINER_NAME% -p %HOST_PORT%:%CONTAINER_PORT% --network=%NETWORK_NAME% --restart unless-stopped %IMAGE_NAME%

if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo ERROR: Failed to start container!
    echo ============================================
    echo.
    echo Possible issues:
    echo 1. Port %HOST_PORT% is already in use
    echo 2. Network %NETWORK_NAME% does not exist
    echo.
    echo Check with: docker ps ^& docker network ls
    echo.
    pause
    exit /b 1
)

echo [OK] Container started successfully.
echo.
echo ============================================
echo === Redeployment complete! ===
echo ============================================
echo.
echo Container %CONTAINER_NAME% is now running
echo Access your application at: http://localhost:%HOST_PORT%
echo.
pause


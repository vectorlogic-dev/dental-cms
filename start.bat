@echo off
setlocal

echo 🦷 Dental CMS Launcher
echo -----------------------

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for .env file
if not exist .env (
    echo [INFO] Creating .env file from template...
    echo PORT=5000 > .env
    echo NODE_ENV=development >> .env
    echo MONGODB_URI=mongodb://localhost:27017/dental-cms >> .env
    echo JWT_SECRET=your-super-secret-jwt-key >> .env
    echo JWT_EXPIRE=7d >> .env
    echo CORS_ORIGIN=http://localhost:3000 >> .env
)

:: Check for node_modules
if not exist node_modules (
    echo [INFO] Installing backend dependencies...
    call npm install
)

if not exist client\node_modules (
    echo [INFO] Installing client dependencies...
    cd client
    call npm install
    cd ..
)

:: Summary
echo [SUCCESS] Everything is ready!
echo [INFO] Starting the application (Backend + Frontend)...
echo [INFO] Close this window to stop the servers.
echo -----------------------

npm run dev

pause

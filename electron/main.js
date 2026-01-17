const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';

// Get paths - handle both development and production (packaged) environments
function getAppPath() {
  if (isDev) {
    return path.join(__dirname, '..');
  }
  // In production, resources are unpacked
  if (process.resourcesPath) {
    return path.join(process.resourcesPath, 'app');
  }
  return __dirname.replace(/[\\/]electron$/, '');
}

const appPath = getAppPath();

let mainWindow = null;
let backendProcess = null;
let serverPort = null;
let serverUrl = null;

// Find an available port
async function findAvailablePort(startPort = 5000) {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve);
    });
  });
}

// Get user data directory for database
function getUserDataPath() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return dbDir;
}

// Initialize database on first run
async function initializeDatabase() {
  const dbDir = getUserDataPath();
  const dbPath = path.join(dbDir, 'dental-cms.db');
  const dbUrl = `file:${dbPath}`;
  
  // Check if database already exists
  if (fs.existsSync(dbPath)) {
    console.log('Database already exists, skipping initialization');
    return dbUrl;
  }

  console.log('Initializing database...');
  
  // Set DATABASE_URL for Prisma
  process.env.DATABASE_URL = dbUrl;
  
  // Generate Prisma Client if needed
  try {
    const prismaPath = isDev 
      ? path.join(appPath, 'node_modules', '.bin', 'prisma')
      : path.join(appPath, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
    await exec(`"${prismaPath}" generate`, { cwd: appPath });
  } catch (error) {
    console.error('Error generating Prisma client:', error);
  }

  // Run prisma db push
  try {
    const prismaPath = isDev 
      ? path.join(appPath, 'node_modules', '.bin', 'prisma')
      : path.join(appPath, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
    await exec(`"${prismaPath}" db push --skip-generate`, { 
      cwd: appPath,
      env: { ...process.env, DATABASE_URL: dbUrl }
    });
    console.log('Database initialized successfully');
    
    // Create admin user
    await createAdminUser(dbUrl);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }

  return dbUrl;
}

// Create admin user
async function createAdminUser(dbUrl) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(appPath, 'dist', 'server', 'scripts', 'createAdmin.js');
    const nodePath = process.execPath;
    
    const createAdminProcess = spawn(nodePath, [scriptPath], {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
      cwd: appPath
    });

    createAdminProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Admin user created successfully');
        resolve();
      } else {
        console.log('Admin user may already exist or creation skipped');
        resolve(); // Non-fatal
      }
    });

    createAdminProcess.on('error', (error) => {
      console.error('Error creating admin user:', error);
      resolve(); // Non-fatal - user can create admin manually
    });
  });
}

// Start backend server
async function startBackend() {
  const dbUrl = await initializeDatabase();
  serverPort = await findAvailablePort();
  serverUrl = `http://localhost:${serverPort}`;

  const backendPath = path.join(appPath, 'dist', 'server', 'index.js');
  const nodePath = process.execPath;

  console.log(`Starting backend on port ${serverPort}...`);

  backendProcess = spawn(nodePath, [backendPath], {
    env: {
      ...process.env,
      PORT: serverPort.toString(),
      DATABASE_URL: dbUrl,
      CORS_ORIGIN: serverUrl,
      NODE_ENV: 'production',
      ELECTRON: 'true'
    },
    stdio: isDev ? 'inherit' : 'ignore',
    cwd: appPath
  });

  backendProcess.on('error', (error) => {
    console.error('Backend process error:', error);
    app.quit();
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0 && code !== null) {
      app.quit();
    }
  });

  // Wait for health check
  await waitForHealthCheck(serverUrl);
  
  return serverUrl;
}

// Wait for backend to be ready
async function waitForHealthCheck(url, maxAttempts = 30) {
  const https = require('https');
  const http = require('http');
  const client = url.startsWith('https') ? https : http;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const request = client.get(`${url}/api/health`, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Health check returned ${res.statusCode}`));
          }
        });
        
        request.on('error', reject);
        request.setTimeout(1000, () => {
          request.destroy();
          reject(new Error('Health check timeout'));
        });
      });
      
      console.log('Backend is ready!');
      return;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(`Backend failed to start: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Create loading window
function createLoadingWindow() {
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  const loadingPath = path.join(__dirname, 'loading.html');
  loadingWindow.loadFile(loadingPath);
  loadingWindow.center();

  return loadingWindow;
}

// Create main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
    show: false // Don't show until ready
  });

  // Load the app
  mainWindow.loadURL(serverUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Show loading screen
  const loadingWindow = createLoadingWindow();

  try {
    // Start backend and wait for health check
    await startBackend();
    
    // Close loading window and create main window
    loadingWindow.close();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    loadingWindow.close();
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Stop backend process
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

// IPC handlers
ipcMain.handle('get-server-url', () => {
  return serverUrl;
});

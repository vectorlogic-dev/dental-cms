# Desktop Packaging Plan

## Overview
This document outlines the plan for packaging the Dental CMS as a desktop application using Electron, making it easier to install and test without requiring manual setup of Node.js, databases, and server configurations.

## Technology Stack

### Desktop Wrapper
- **Electron**: Cross-platform desktop application framework
- **electron-builder**: Package and build installers for Windows, macOS, and Linux

### Architecture
1. **Backend Server**: Bundle Node.js runtime + Express server as part of the app
2. **Frontend**: Pre-built React app (Vite build) served from Electron
3. **Database**: SQLite file stored in app data directory
4. **Auto-start**: Backend server starts automatically when app launches

## Implementation Steps

### Phase 1: Electron Setup
1. Install Electron and electron-builder dependencies
   ```bash
   npm install --save-dev electron electron-builder concurrently
   ```

2. Create Electron main process file (`electron/main.js`)
   - Start backend server on launch (background process)
   - Open Electron window pointing to `http://localhost:5000`
   - Handle window lifecycle (close, minimize)
   - Exit backend process when app quits

3. Create Electron preload script for security
   - Expose necessary APIs if needed
   - Ensure secure context isolation

### Phase 2: Build Configuration

1. **Package.json Updates**
   - Add Electron scripts (start, build, dist)
   - Configure electron-builder for Windows/macOS builds
   - Set up build paths and resources

2. **Build Process**
   - Backend: Bundle compiled TypeScript + dependencies
   - Frontend: Use existing Vite build output
   - Include SQLite database template or initialize on first run

3. **App Data Directory**
   - Use Electron `app.getPath('userData')` for database storage
   - Store `database.db` in: `%APPDATA%/dental-cms/` (Windows) or `~/Library/Application Support/dental-cms/` (macOS)
   - Migrate DATABASE_URL to point to user data directory

### Phase 3: Installer Configuration

1. **Windows (NSIS)**
   - Create installer with company info, app icon
   - Include shortcut creation
   - Add uninstaller

2. **macOS (.dmg)**
   - Create DMG with app bundle
   - Code signing (optional for distribution)
   - Gatekeeper compatibility

3. **Linux (AppImage/DEB)**
   - Optional: Create AppImage for universal Linux support

### Phase 4: Auto-Start Server

1. **Backend Integration**
   - Modify server entry point to accept port from environment
   - Use `child_process.spawn()` to run backend in Electron
   - Capture and log server output
   - Handle server crashes gracefully

2. **Startup Flow**
   - Check if backend is running (health check)
   - Wait for server to be ready before opening window
   - Show loading screen while starting

### Phase 5: Database Migration

1. **First Run Setup**
   - Check if database exists in user data directory
   - If not, copy template database or run migrations
   - Create default admin user if needed

2. **Data Persistence**
   - All data stored locally in SQLite file
   - Database path configured via environment variable in Electron

## File Structure

```
dental-cms/
├── electron/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script
│   └── icons/           # App icons for different platforms
├── dist/                # Built backend (existing)
├── client/dist/         # Built frontend (existing)
├── package.json         # Updated with Electron scripts
└── electron-builder.yml # Build configuration
```

## Configuration Files

### electron-builder.yml
```yaml
appId: com.dentalcms.app
productName: Dental CMS
directories:
  buildResources: electron/build
  output: dist-electron
files:
  - dist/**/*
  - client/dist/**/*
  - package.json
  - node_modules/**/*
win:
  target: nsis
  icon: electron/icons/icon.ico
mac:
  target: dmg
  icon: electron/icons/icon.icns
  category: public.app-category.medical
```

## Environment Variables in Electron

- `DATABASE_URL`: Points to SQLite file in user data directory
- `PORT`: Fixed port (e.g., 5000) for local server
- `NODE_ENV`: Set to 'production'
- `CORS_ORIGIN`: Set to `http://localhost:5000`

## Testing

1. **Development Testing**
   - Run Electron app locally: `npm run electron:dev`
   - Test server startup and shutdown
   - Verify database operations in user data directory

2. **Installer Testing**
   - Build installer: `npm run build:desktop`
   - Install on clean system
   - Test first-run initialization
   - Verify data persistence

## Known Considerations

1. **Node.js Runtime**: Electron includes its own Node.js, so no external installation needed
2. **SQLite**: Works well with Electron, no additional dependencies
3. **Port Conflicts**: Use fixed port or detect available port automatically
4. **Auto-updates**: Future enhancement using `electron-updater`
5. **Security**: Ensure backend API remains local-only (127.0.0.1)

## Future Enhancements

- Auto-update functionality
- Tray icon for background operation
- System notifications for appointments
- Backup/restore database functionality
- Multi-window support for different views

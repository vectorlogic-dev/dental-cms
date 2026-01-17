# Desktop Packaging Plan

## Overview
This plan targets a "double-click to install, double-click to run" experience. End users should not need Node.js, database setup, or command-line steps.

## Technology Stack

### Desktop Wrapper
- **Electron**: Cross-platform desktop application framework
- **electron-builder**: Package and build installers for Windows, macOS, and Linux

### Architecture
1. **Backend Server**: Bundle Node.js runtime + Express server inside the app
2. **Frontend**: Pre-built React app served by the backend (no external web server)
3. **Database**: SQLite file stored in the app data directory
4. **Auto-start**: Backend starts automatically on app launch
5. **Zero setup**: First run bootstraps database and optional admin user

## Implementation Steps

### Phase 1: Electron Setup (fast path)
1. Install Electron and electron-builder dependencies
   ```bash
   npm install --save-dev electron electron-builder concurrently
   ```

2. Create Electron main process file (`electron/main.js`)
   - Start backend server on launch (background process)
   - Open Electron window pointing to `http://127.0.0.1:<port>`
   - Handle window lifecycle (close, minimize)
   - Exit backend process when app quits

3. Create Electron preload script for security (minimal, no Node.js in renderer)
   - Expose necessary APIs if needed
   - Ensure secure context isolation

### Phase 2: Build Configuration

1. **Package.json Updates**
   - Add Electron scripts (start, build, dist)
   - Configure electron-builder for Windows/macOS builds
   - Set up build paths and resources

2. **Build Process**
   - Backend: Build TypeScript to `dist/`
   - Frontend: Vite build to `client/dist/`
   - Backend serves `client/dist/` as static assets
   - Initialize SQLite on first run (no pre-seeded DB required)

3. **App Data Directory**
   - Use Electron `app.getPath('userData')` for database storage
   - Store `database.db` in: `%APPDATA%/dental-cms/` (Windows) or `~/Library/Application Support/dental-cms/` (macOS)
   - Set `DATABASE_URL` to that path at runtime

### Phase 3: Installer Configuration (user friendly)

1. **Windows (NSIS)**
   - Create installer with company info, app icon
   - Include shortcut creation
   - Add uninstaller
   - Optional: Start app after install

2. **macOS (.dmg)**
   - Create DMG with app bundle
   - Code signing (optional for distribution)
   - Gatekeeper compatibility
   - Simple drag-to-Applications flow

3. **Linux (AppImage/DEB)**
   - Optional: Create AppImage for universal Linux support

### Phase 4: Auto-Start Server (no port conflicts)

1. **Backend Integration**
   - Modify server entry point to accept port from environment
   - Use `child_process.spawn()` to run backend in Electron
   - Capture and log server output
   - Handle server crashes gracefully

2. **Startup Flow**
   - Pick an available port (or fixed port with fallback)
   - Start backend, poll `/health` until ready
   - Show a simple splash/loading screen during startup

### Phase 5: Database Initialization

1. **First Run Setup**
   - Check if database exists in user data directory
   - If not, run Prisma `db push` and create schema
   - Prompt to create initial admin user (or auto-create with default password and force change)

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
- `PORT`: Use dynamic port (preferred) or fixed port with fallback
- `NODE_ENV`: Set to 'production'
- `CORS_ORIGIN`: Set to `http://127.0.0.1:<port>`

## Testing

1. **Development Testing**
   - Run Electron app locally: `npm run electron:dev`
   - Verify first-run DB creation and admin onboarding
   - Confirm app launches without any CLI steps

2. **Installer Testing**
   - Build installer: `npm run build:desktop`
   - Install on clean system
   - Test first-run initialization
   - Verify data persistence

## Known Considerations

1. **Node.js Runtime**: Electron includes its own Node.js, so no external installation needed
2. **SQLite**: Works well with Electron, no additional dependencies
3. **Port Conflicts**: Prefer dynamic port allocation with health check
4. **Auto-updates**: Future enhancement using `electron-updater`
5. **Security**: Ensure backend API remains local-only (127.0.0.1)

## Future Enhancements

- Auto-update functionality
- Tray icon for background operation
- System notifications for appointments
- Backup/restore database functionality
- Multi-window support for different views

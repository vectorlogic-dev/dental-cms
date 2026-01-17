# Electron Desktop Application

This directory contains the Electron configuration for packaging Dental CMS as a desktop application.

## Structure

- `main.js` - Electron main process that starts the backend server and manages the application window
- `preload.js` - Preload script for secure IPC communication (context isolation enabled)
- `loading.html` - Splash screen shown while the backend server starts
- `icons/` - Application icons for different platforms

## Development

To run the Electron app in development mode:

```bash
npm run electron:dev
```

This will:
1. Build both backend and frontend
2. Start Electron with hot-reload capabilities
3. Open DevTools automatically

## Building Installers

### Windows (NSIS)
```bash
npm run electron:build:win
```

Creates an NSIS installer in `dist-electron/` that:
- Allows custom installation directory
- Creates desktop and Start Menu shortcuts
- Includes uninstaller

### macOS (DMG)
```bash
npm run electron:build:mac
```

Creates a DMG installer in `dist-electron/` for macOS.

### Linux (AppImage)
```bash
npm run electron:build:linux
```

Creates an AppImage in `dist-electron/` for Linux distributions.

## First Run Behavior

On first launch, the app will:
1. Create database directory in OS user data folder:
   - Windows: `%APPDATA%/dental-cms/database/`
   - macOS: `~/Library/Application Support/dental-cms/database/`
   - Linux: `~/.config/dental-cms/database/`
2. Initialize SQLite database (`prisma db push`)
3. Create default admin user:
   - Email: `admin@dentalcms.com`
   - Password: `admin123`
   - ⚠️ User is prompted to change password on first login

## Application Icons

Place your application icons in the `icons/` directory:
- `icon.ico` - Windows icon (256x256 recommended)
- `icon.icns` - macOS icon (512x512 recommended)
- `icon.png` - Linux icon (512x512 recommended)

You can generate these from a single high-resolution PNG using tools like:
- [Electron Icon Maker](https://www.electron.build/icons)
- [Icon Generator](https://icon.kitchen/)

## Security

The Electron app follows security best practices:
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Remote module disabled
- ✅ Minimal preload script (only necessary IPC methods exposed)

## Backend Server

The backend Express server:
- Runs as a separate Node.js process
- Uses dynamic port allocation to avoid conflicts
- Serves the React frontend from `client/dist/` in production
- API routes available at `/api/*`
- Health check endpoint: `/api/health`

## Troubleshooting

### Backend fails to start
- Check if port is already in use (app automatically finds available port)
- Verify database path is writable
- Check Electron console for error messages

### Database initialization fails
- Ensure user data directory is writable
- Check Prisma schema is valid
- Verify `prisma generate` runs successfully

### Window doesn't open
- Check health check is passing (backend must be ready)
- Verify frontend build exists in `client/dist/`
- Check Electron console for errors

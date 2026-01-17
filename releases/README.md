# Release Installers

This directory contains built installers for Dental CMS desktop application.

## Building Installers

### Prerequisites

**For Windows installers (from Linux):**
- Wine must be installed: `sudo apt-get install wine` (Ubuntu/Debian) or `sudo dnf install wine` (Fedora)
- Wine is required to build Windows installers from non-Windows systems

**For macOS installers:**
- Must be built on a macOS machine
- Cannot be built from Linux or Windows

**For Linux installers:**
- Can be built on Linux natively

### Building

**Windows (NSIS installer):**
```bash
npm run electron:build:win
```
Output: `dist-electron/Dental CMS Setup x.x.x.exe`

**macOS (DMG installer):**
```bash
npm run electron:build:mac
```
Output: `dist-electron/Dental CMS-x.x.x.dmg`

**Linux (AppImage):**
```bash
npm run electron:build:linux
```
Output: `dist-electron/Dental CMS-x.x.x.AppImage`

### Current Status

- ⚠️ **Windows installer**: Requires Wine to build from Linux
- ⚠️ **macOS installer**: Requires macOS machine to build
- ✅ **Linux installer**: Can be built on Linux

## Installing the Application

### Windows
1. Download `Dental CMS Setup x.x.x.exe`
2. Run the installer
3. Choose installation directory
4. Launch from Start Menu or Desktop shortcut

Default admin credentials:
- Email: `admin@dentalcms.com`
- Password: `admin123`

### macOS
1. Download `Dental CMS-x.x.x.dmg`
2. Open DMG file
3. Drag "Dental CMS" to Applications folder
4. Launch from Applications

### Linux
1. Download `Dental CMS-x.x.x.AppImage`
2. Make executable: `chmod +x "Dental CMS-x.x.x.AppImage"`
3. Run: `./Dental CMS-x.x.x.AppImage`

## Note

Installers are typically large binary files (100+ MB) and are usually:
- Stored in Git LFS (Large File Storage) for version control
- Or distributed via GitHub Releases instead of the main repository

If adding installers to this repository, consider using Git LFS or placing them in a separate releases repository.

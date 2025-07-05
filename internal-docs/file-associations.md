# File Association Setup for Nodebook.js

This document explains how file associations are implemented for `.nbjs` files in Nodebook.js, allowing users to double-click `.nbjs` files to open them directly in the application.

## Overview

Nodebook.js supports file associations for `.nbjs` (Nodebook.js) files across Windows, macOS, and Linux platforms. When properly configured, users can:

- Double-click `.nbjs` files to open them in Nodebook.js
- See Nodebook.js as the default application for `.nbjs` files
- Open files via "Open with..." context menu
- Launch the app with a file from command line

## Implementation Components

### 1. Package.json Configuration

The `package.json` includes build configuration for file associations:

```json
{
  "build": {
    "fileAssociations": [
      {
        "ext": "nbjs",
        "name": "Nodebook.js Notebook", 
        "description": "Nodebook.js Interactive Notebook",
        "icon": "./build-resources/icons/icon",
        "role": "Editor",
        "isPackage": false
      }
    ],
    "protocols": [
      {
        "name": "nodebook",
        "schemes": ["nodebook"]
      }
    ]
  }
}
```

### 2. Electron Forge Configuration

The `forge.config.ts` is configured to support file associations in installers:

- **Windows**: Uses MakerSquirrel with custom setup configuration
- **macOS**: Includes Info.plist with UTI declarations
- **Linux**: DEB and RPM makers with MIME type support

### 3. Main Process File Handling

The `src/main.ts` implements file opening logic:

- **Single Instance**: Ensures only one app instance runs
- **File Open Events**: Handles `open-file` event (macOS/Linux)
- **Command Line Args**: Processes `.nbjs` files from command line (Windows/Linux)
- **Second Instance**: Forwards files to existing instance

### 4. Platform-Specific Files

#### macOS - Info.plist
Location: `build-resources/Info.plist`

Defines:
- `CFBundleDocumentTypes`: File type associations
- `UTExportedTypeDeclarations`: Universal Type Identifier (UTI) for `.nbjs` files
- MIME type: `application/x-nodebook`
- UTI: `com.nodebook.nbjs`

#### Windows - Registry Configuration
Location: `build-resources/windows-file-associations.reg`

Registers:
- File extension `.nbjs` with `NodebookJS.Document` class
- Default icon and open command
- Context menu entries
- MIME type associations

#### Linux - Desktop Entry
Handled automatically by DEB/RPM makers with MIME type `application/x-nodebook`.

## File Opening Flow

### 1. Application Launch with File

```
User double-clicks file.nbjs
↓
OS launches Nodebook.js with file path
↓
Main process stores file path in `fileToOpen`
↓
Window creates and loads
↓
`did-finish-load` event triggers
↓
IPC message sent to renderer: 'open-file-from-system'
↓
Renderer opens the file
```

### 2. File Opened in Running App

```
User double-clicks file.nbjs (app already running)
↓
OS attempts to launch second instance
↓
Second instance blocked by single instance lock
↓
`second-instance` event fires in main process
↓
Main process focuses existing window
↓
IPC message sent: 'open-file-from-system'
↓
Renderer opens the file
```

### 3. macOS/Linux `open-file` Event

```
User double-clicks file.nbjs
↓
OS fires `open-file` event
↓
Main process handles event
↓
If window exists: immediate IPC message
↓
If no window: store in `fileToOpen` for later
```

## IPC Communication

### Main → Renderer

The main process communicates with the renderer using:

```typescript
mainWindow.webContents.send('open-file-from-system', filePath);
```

### Expected Renderer Handling

The renderer should listen for this event:

```typescript
// In renderer process
window.electronAPI.onOpenFileFromSystem((filePath: string) => {
  // Load and display the notebook file
  loadNotebook(filePath);
});
```

## Installation and Setup

### Automatic Setup (Recommended)

File associations are automatically configured during installation when using the built installers:

- **Windows**: Squirrel installer registers file associations
- **macOS**: App bundle includes Info.plist with UTI declarations  
- **Linux**: DEB/RPM packages register MIME types

### Manual Setup (Development/Testing)

#### Windows
1. Run the provided registry script as Administrator:
   ```cmd
   regedit /s build-resources/windows-file-associations.reg
   ```

#### macOS
File associations are handled by the app bundle's Info.plist automatically.

#### Linux
```bash
# Register MIME type
xdg-mime install application-x-nodebook.xml

# Set as default application
xdg-mime default nodebook.desktop application/x-nodebook
```

## Troubleshooting

### File Associations Not Working

1. **Check Installation**: Ensure app was installed via official installer
2. **Permissions**: On Windows, installer may need administrator privileges
3. **Rebuild Associations**: 
   - Windows: Re-run installer or registry script
   - macOS: Delete and reinstall app
   - Linux: Run `update-desktop-database` and `update-mime-database`

### Debug File Opening

Enable debug logging in main process:

```typescript
const log = anylogger('Main');
log.setLevel('debug');
```

Look for these log messages:
- `File opened via association: ${filePath}`
- `Initial file from command line: ${filePath}`
- `Second instance launched with args: ${commandLine}`
- `Opening file after window ready: ${filePath}`

### Multiple Instances Opening

If multiple app instances open instead of reusing existing window:

1. Check `app.requestSingleInstanceLock()` is called early
2. Verify `second-instance` event handler is registered
3. Ensure proper platform detection in file opening logic

## Development Notes

### Testing File Associations

1. **Build the app**: `npm run make`
2. **Install**: Use generated installer
3. **Test**: Create a test `.nbjs` file and double-click
4. **Verify**: App should open with the file loaded

### Adding New File Types

To support additional file extensions:

1. Update `package.json` build.fileAssociations
2. Modify `Info.plist` for macOS
3. Update Windows registry script
4. Add handling in main process file detection logic

### Platform Differences

- **Windows**: Relies on command line arguments and registry
- **macOS**: Uses `open-file` event and Info.plist UTI declarations
- **Linux**: Uses MIME types and desktop file associations

## Security Considerations

- File paths are validated before processing
- Only `.nbjs` files are handled via associations
- Command line arguments are filtered for security
- File existence is checked before opening

## Future Enhancements

- Support for additional Nodebook formats (`.json` notebooks)
- Protocol handlers for `nodebook://` URLs
- Recent files integration with OS
- Thumbnail generation for `.nbjs` files
- Quick Look/Preview support (macOS)

This implementation provides a robust, cross-platform file association system that enhances the user experience by allowing seamless file opening from the operating system.

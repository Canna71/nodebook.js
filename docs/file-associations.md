# File Association Setup for Nodebook.js

This document explains how file associations are implemented for `.nbjs` files in Nodebook.js, allowing users to double-click `.nbjs` files to open them directly in the application.

## Overview

Nodebook.js supports file associations for `.nbjs` (Nodebook.js) files across Windows, macOS, and Linux platforms. When properly configured, users can:

- Double-click `.nbjs` files to open them in Nodebook.js
- See Nodebook.js as the default application for `.nbjs` files
- Open files via "Open with..." context menu
- Launch the app with a file from command line

## Icon Association

### Cross-Platform Icon Setup

Nodebook.js associates its application icon with `.nbjs` files across all platforms:

#### Windows
- **Registry Configuration**: `build-resources/windows-file-associations.reg`
- **Icon Source**: Application executable icon (index 0)
- **Path**: `"C:\\Program Files\\Nodebook.js\\Nodebook.js.exe",0`
- **Alternative**: User installation path for portable installs

#### macOS  
- **Info.plist Configuration**: `build-resources/Info.plist`
- **Icon Files**: 
  - `CFBundleTypeIconFile`: `document` (references document icon)
  - `UTTypeIconFile`: `document` (for Uniform Type Identifier)
- **Icon Format**: Uses `.icns` file from app bundle
- **Installation Requirement**: App must be in `/Applications/` for proper file association
- **Registration**: Requires Launch Services registration for file associations to work

#### Linux
- **Desktop File**: `build-resources/nodebook.desktop`
- **MIME Type**: `build-resources/application-x-nodebook.xml`
- **Icon Reference**: `Icon=nodebook` (system icon name)
- **Installation**: Icons copied to `/usr/share/icons/` or `~/.local/share/icons/`

### Icon File Structure

```
build-resources/icons/
├── icon.icns          # macOS app bundle icon
├── icon.ico           # Windows executable icon  
├── icon.png           # Linux desktop icon
├── document.icns      # macOS document icon (for .nbjs files)
├── document.ico       # Windows document icon (for .nbjs files)
├── document.png       # Linux document icon (for .nbjs files)
├── icns/              # macOS icon sizes
├── ico/               # Windows icon sizes
└── png/               # PNG variants for Linux
```

### Icon Association Flow

1. **Windows**: Registry points to executable icon resource
2. **macOS**: Info.plist declares icon for document type and UTI
3. **Linux**: Desktop file and MIME type reference system icon

### Custom Document Icons (Optional)

For better visual distinction, you can create separate document icons:

```
build-resources/icons/
├── document.icns      # macOS document icon
├── document.ico       # Windows document icon
└── document.png       # Linux document icon
```

Then update configurations to use document-specific icons instead of application icons.

## Platform-Specific Requirements

### macOS Installation for File Associations

⚠️ **Critical**: On macOS, file associations only work when the app is properly installed in `/Applications/`. Running the app from a ZIP file or other locations will NOT register file associations.

**Required Steps:**
1. Move `Nodebook.js.app` to `/Applications/` folder
2. Register with Launch Services: `sudo lsregister -f /Applications/Nodebook.js.app`
3. Set as default app via "Get Info" or `duti` command

**Why This is Required:**
- macOS Launch Services only recognizes apps in standard installation locations
- File associations, icons, and UTI declarations require proper app bundle registration
- Running from Downloads, Desktop, or ZIP files bypasses system registration

**See:** `MACOS_INSTALL.md` and `docs/macos-file-association-troubleshooting.md` for detailed instructions.

### Windows Installation

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

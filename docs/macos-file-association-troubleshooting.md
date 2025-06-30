# macOS File Association Troubleshooting Guide

## Issue: .nbjs Files Don't Show Icons After Installation

### Problem Description
On macOS, after building and running Nodebook.js from a ZIP file, `.nbjs` files may not display the correct icon or may not open with Nodebook.js when double-clicked.

### Root Causes

1. **Improper Installation**: Running the app from a ZIP file doesn't register file associations properly
2. **Missing Icon Resources**: Document icons may not be bundled correctly
3. **Launch Services Cache**: macOS caches file associations and may need to be refreshed
4. **Code Signing**: Unsigned apps may have limited file association capabilities

### Solutions

#### 1. Proper Installation Process

**For Users:**
```bash
# Download and extract the ZIP file
unzip Nodebook.js-darwin-x64-*.zip

# Move the app to Applications folder (REQUIRED for file associations)
sudo mv "Nodebook.js.app" /Applications/

# Register the app with Launch Services
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -v -f /Applications/Nodebook.js.app

# Clear Launch Services cache
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# Set Nodebook.js as default for .nbjs files
duti -s com.nodebook.app nbjs all
```

**Alternative Manual Method:**
1. Move `Nodebook.js.app` to `/Applications/`
2. Right-click any `.nbjs` file → "Get Info"
3. In "Open with" section, select Nodebook.js
4. Click "Change All..." to apply to all `.nbjs` files

#### 2. Verify File Association Registration

Check if the app is properly registered:

```bash
# Check if Nodebook.js is registered as handler for .nbjs
duti -x nbjs

# Check Launch Services database
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -dump | grep -i nodebook

# List all handlers for .nbjs extension  
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -dump | grep -i "\.nbjs"
```

#### 3. Force Launch Services Refresh

If file associations still don't work:

```bash
# Kill Launch Services and Finder to force refresh
sudo killall lsregister
killall Finder

# Rebuild Launch Services database
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user -f

# Re-register Nodebook.js specifically
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -v -f /Applications/Nodebook.js.app
```

#### 4. Check Icon Bundle

Verify that document icons are included in the app bundle:

```bash
# Check if document icons exist in the app bundle
ls -la "/Applications/Nodebook.js.app/Contents/Resources/"

# Should show:
# - icon.icns (app icon)
# - document.icns (document icon)

# Check Info.plist configuration
plutil -p "/Applications/Nodebook.js.app/Contents/Info.plist" | grep -A 20 CFBundleDocumentTypes
```

### Build-Time Fixes

#### 1. Ensure Document Icons are Bundled

Update `forge.config.ts` to include document icons:

```typescript
// In the MakerZIP configuration for macOS
new MakerZIP({
  // ... existing config
}, ['darwin']),
```

Add a post-package hook to verify icon inclusion:

```typescript
postPackage: async (config, packageResult) => {
  const { platform, outputPaths } = packageResult;
  
  if (platform === 'darwin') {
    console.log('Verifying macOS file association setup...');
    
    for (const outputPath of outputPaths) {
      const appPath = path.join(outputPath, 'Nodebook.js.app');
      const resourcesPath = path.join(appPath, 'Contents', 'Resources');
      
      // Check for required icons
      const requiredIcons = ['icon.icns', 'document.icns'];
      for (const iconFile of requiredIcons) {
        const iconPath = path.join(resourcesPath, iconFile);
        if (await fs.pathExists(iconPath)) {
          console.log(`✅ Found ${iconFile}`);
        } else {
          console.warn(`⚠️ Missing ${iconFile} in app bundle`);
        }
      }
      
      // Verify Info.plist
      const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
      if (await fs.pathExists(infoPlistPath)) {
        console.log('✅ Info.plist found in app bundle');
      } else {
        console.warn('⚠️ Info.plist missing from app bundle');
      }
    }
  }
}
```

#### 2. Copy Document Icons During Build

Ensure document icons are copied to the app bundle:

```typescript
// In packageAfterCopy hook
if (platform === 'darwin') {
  const resourcesDir = path.join(buildPath, 'Contents', 'Resources');
  
  // Copy document icon
  const documentIconSrc = path.join(__dirname, 'build-resources', 'icons', 'document.icns');
  const documentIconDest = path.join(resourcesDir, 'document.icns');
  
  if (await fs.pathExists(documentIconSrc)) {
    await fs.copy(documentIconSrc, documentIconDest);
    console.log('✅ Copied document.icns to app bundle');
  } else {
    console.warn('⚠️ document.icns not found in build resources');
  }
}
```

### Testing File Associations

#### 1. Create Test File

```bash
# Create a test .nbjs file
echo '{"cells": [{"type": "markdown", "content": "# Test Notebook"}]}' > test.nbjs
```

#### 2. Test Opening

```bash
# Test opening with Nodebook.js directly
open -a Nodebook.js test.nbjs

# Test default handler
open test.nbjs

# Test from command line
/Applications/Nodebook.js.app/Contents/MacOS/Nodebook.js test.nbjs
```

#### 3. Verify Icon Display

1. Open Finder
2. Navigate to folder with `.nbjs` files
3. Ensure files show Nodebook.js document icon
4. If not, check icon cache and rebuild Launch Services

### Common Issues and Solutions

#### Issue: "App can't be opened because it's from an unidentified developer"

**Solution:**
```bash
# Remove quarantine attribute
sudo xattr -r -d com.apple.quarantine /Applications/Nodebook.js.app

# Or allow in System Preferences → Security & Privacy
```

#### Issue: Files open with wrong application

**Solution:**
```bash
# Reset file associations
duti -s com.nodebook.app nbjs all

# Or use Get Info method (right-click → Get Info → Change All)
```

#### Issue: Icons not displaying

**Solution:**
```bash
# Clear icon cache
sudo find /private/var/folders -name com.apple.dock.iconcache -delete
sudo find /private/var/folders -name com.apple.iconservices -delete
killall Dock
killall Finder
```

### Developer Notes

#### Code Signing Considerations

File associations work better with signed applications:

```bash
# Sign the app (requires Apple Developer account)
codesign --force --deep --sign "Developer ID Application: Your Name" /Applications/Nodebook.js.app

# Verify signature
codesign -v /Applications/Nodebook.js.app
spctl -a -v /Applications/Nodebook.js.app
```

#### Info.plist Requirements

Ensure Info.plist contains:

```xml
<key>CFBundleDocumentTypes</key>
<array>
    <dict>
        <key>CFBundleTypeExtensions</key>
        <array>
            <string>nbjs</string>
        </array>
        <key>CFBundleTypeIconFile</key>
        <string>document</string>
        <key>CFBundleTypeName</key>
        <string>Nodebook.js Notebook</string>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>LSHandlerRank</key>
        <string>Owner</string>
        <key>LSItemContentTypes</key>
        <array>
            <string>com.nodebook.nbjs</string>
        </array>
    </dict>
</array>
<key>UTExportedTypeDeclarations</key>
<array>
    <dict>
        <key>UTTypeIdentifier</key>
        <string>com.nodebook.nbjs</string>
        <key>UTTypeDescription</key>
        <string>Nodebook.js Interactive Notebook</string>
        <key>UTTypeIconFile</key>
        <string>document</string>
        <key>UTTypeConformsTo</key>
        <array>
            <string>public.data</string>
            <string>public.content</string>
        </array>
        <key>UTTypeTagSpecification</key>
        <dict>
            <key>public.filename-extension</key>
            <array>
                <string>nbjs</string>
            </array>
            <key>public.mime-type</key>
            <array>
                <string>application/x-nodebook</string>
            </array>
        </dict>
    </dict>
</array>
```

### Summary

The key to proper file associations on macOS is:

1. **Proper Installation**: App must be in `/Applications/`
2. **Launch Services Registration**: Use `lsregister` to register the app
3. **Icon Bundle**: Ensure document icons are in the app bundle
4. **Cache Refresh**: Clear Launch Services cache when needed
5. **File Type Declaration**: Proper UTI declaration in Info.plist

Running from a ZIP file will never provide full file association functionality - users must install the app properly for file associations to work.

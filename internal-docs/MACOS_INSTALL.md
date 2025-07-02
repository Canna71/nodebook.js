# Installing Nodebook.js on macOS

## Quick Installation

1. **Download** the latest Nodebook.js release for macOS
2. **Extract** the ZIP file 
3. **Move** `Nodebook.js.app` to your `/Applications/` folder
4. **Register** file associations (see steps below)

## Detailed Installation Steps

### Step 1: Download and Extract

Download the latest macOS release ZIP file and extract it. You'll see `Nodebook.js.app`.

### Step 2: Move to Applications Folder

**Important:** The app must be in `/Applications/` for file associations to work properly.

```bash
# Move the app to Applications (replace with your actual path)
sudo mv ~/Downloads/Nodebook.js.app /Applications/

# Or drag and drop in Finder:
# Open Finder → drag Nodebook.js.app to Applications folder
```

### Step 3: First Launch and Security

When you first run Nodebook.js, macOS may show a security warning:

**If you see "App can't be opened because it's from an unidentified developer":**

1. Go to **System Preferences → Security & Privacy**
2. Click **"Open Anyway"** next to the Nodebook.js warning
3. Or use Terminal: `sudo xattr -r -d com.apple.quarantine /Applications/Nodebook.js.app`

**Alternative Method:**
1. **Right-click** on `Nodebook.js.app`
2. Select **"Open"** from the context menu
3. Click **"Open"** when macOS asks for confirmation

### Step 4: Register File Associations

After the app is in `/Applications/`, register it with the system:

```bash
# Register Nodebook.js with Launch Services
sudo /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/Nodebook.js.app

# Set as default handler for .nbjs files (if duti is installed)
# Install duti: brew install duti
duti -s com.nodebook.app nbjs all
```

**Alternative: Manual File Association**

1. Find any `.nbjs` file (or create one: `echo '{}' > test.nbjs`)
2. Right-click the file → **"Get Info"**
3. In **"Open with"** section, select **Nodebook.js**
4. Click **"Change All..."** to apply to all `.nbjs` files

### Step 5: Refresh System Cache

If file associations don't work immediately:

```bash
# Clear Launch Services cache
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# Restart Finder
killall Finder
```

## Verification

### Test File Opening

1. Create a test file: `echo '{"cells":[]}' > test.nbjs`
2. Double-click `test.nbjs` - it should open in Nodebook.js
3. Or use Terminal: `open test.nbjs`

### Check File Icons

`.nbjs` files should display with Nodebook.js document icons in Finder. If not:

1. Clear icon cache: `sudo find /private/var/folders -name "*.iconcache" -delete`
2. Restart Finder: `killall Finder`

### Verify Registration

```bash
# Check if Nodebook.js is registered for .nbjs files
duti -x nbjs

# Should output something like:
# Nodebook.js
# /Applications/Nodebook.js.app
# com.nodebook.app
```

## Troubleshooting

### Problem: Double-clicking .nbjs files doesn't open Nodebook.js

**Solutions:**
1. Ensure app is in `/Applications/` (not Desktop or Downloads)
2. Re-register with: `sudo lsregister -f /Applications/Nodebook.js.app`
3. Use "Get Info" method to manually set default app
4. Check Security & Privacy settings for app permissions

### Problem: .nbjs files don't show Nodebook.js icons

**Solutions:**
1. Clear icon cache (see commands above)
2. Restart Finder: `killall Finder`
3. Re-register app: `sudo lsregister -f /Applications/Nodebook.js.app`

### Problem: "App is damaged and can't be opened"

**Solution:**
```bash
# Remove quarantine attribute
sudo xattr -r -d com.apple.quarantine /Applications/Nodebook.js.app
```

### Problem: File associations reset after system update

**Solution:**
- Re-run the registration commands
- Use "Get Info" method to restore default app setting

## Advanced: Command Line Usage

Once installed, you can also launch Nodebook.js from Terminal:

```bash
# Open Nodebook.js
open -a Nodebook.js

# Open specific file
open -a Nodebook.js path/to/notebook.nbjs

# Or directly
/Applications/Nodebook.js.app/Contents/MacOS/Nodebook.js path/to/notebook.nbjs
```

## Why File Associations Require /Applications/

macOS Launch Services only properly registers file associations for applications installed in standard locations like `/Applications/`. Running the app from other locations (Downloads, Desktop, ZIP files) will not register file associations correctly.

## 🛡️ Security Notes

macOS requires applications to be **code signed** and **notarized** by Apple for automatic trust. GitHub Actions builds are currently unsigned, which triggers macOS security warnings.

**Your app is safe** - this is just a precautionary measure by macOS for unsigned applications.

## Developer Notes

The installation process sets up:

- **UTI Declaration**: `com.nodebook.nbjs` for `.nbjs` files
- **Document Types**: Declares Nodebook.js as editor for `.nbjs` files  
- **Icons**: Associates document icon with `.nbjs` files
- **MIME Type**: `application/x-nodebook` for web compatibility

For development builds or troubleshooting, see `docs/macos-file-association-troubleshooting.md`.

## Need Help?

If you encounter issues:

1. Check `docs/macos-file-association-troubleshooting.md` for detailed debugging
2. Try the manual "Get Info" method as a fallback
3. Ensure proper app installation in `/Applications/`
4. Report issues with system details (macOS version, security settings)

## 📋 Supported Versions

- **macOS 10.15 (Catalina)** or later
- **Intel Macs** (x64 architecture)
- **Apple Silicon Macs** (ARM64 architecture)

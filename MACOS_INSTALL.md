# Installing Nodebook.js on macOS

## 🍎 macOS Installation Guide

### **If you downloaded from GitHub Releases:**

The GitHub Actions builds are currently **unsigned**, which means macOS will initially block them. Here's how to run the app safely:

#### **Method 1: Right-click to Open (Recommended)**
1. Download and extract the `.zip` file from GitHub Releases
2. **Right-click** on `Nodebook.js.app`
3. Select **"Open"** from the context menu
4. Click **"Open"** when macOS asks for confirmation
5. The app will run and be trusted for future launches

#### **Method 2: System Preferences**
1. Try to open the app normally (it will be blocked)
2. Go to **System Preferences → Security & Privacy → General**
3. You'll see a message about Nodebook.js being blocked
4. Click **"Open Anyway"**
5. Confirm by clicking **"Open"** in the dialog

#### **Method 3: Remove Quarantine (Advanced Users)**
```bash
# Remove the quarantine attribute from the app
xattr -dr com.apple.quarantine /path/to/Nodebook.js.app
```

### **If you built the app locally:**
Apps built on your own Mac should open normally without these steps.

---

## 🛡️ Why This Happens

macOS requires applications to be **code signed** and **notarized** by Apple for automatic trust. GitHub Actions builds are currently unsigned, which triggers macOS security warnings.

**Your app is safe** - this is just a precautionary measure by macOS for unsigned applications.

---

## 🔮 Future Plans

We're working on implementing automatic code signing for GitHub releases to eliminate these security warnings. This will require:

- Apple Developer Program membership
- Code signing certificates 
- Notarization process integration

---

## 📋 Supported Versions

- **macOS 10.15 (Catalina)** or later
- **Intel Macs** (x64 architecture)
- **Apple Silicon Macs** (ARM64 architecture)

Both architectures are available in GitHub Releases.

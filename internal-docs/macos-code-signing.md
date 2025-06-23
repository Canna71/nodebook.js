# macOS Code Signing and Notarization Guide

## The Problem

macOS applications built on GitHub Actions often fail to run due to Apple's security requirements:

- **Local builds work** because they're signed with your developer identity
- **GitHub Actions builds fail** because they lack proper code signing and notarization
- **Users see errors** like "App can't be opened" or "App is damaged"

## Why This Happens

### **macOS Security (Gatekeeper)**
Apple requires all distributed applications to be:
1. **Code signed** with a valid Developer ID
2. **Notarized** by Apple (uploaded to Apple for security scanning)
3. **Stapled** with the notarization ticket

### **Local vs CI Builds**
- **Local builds**: Use your Mac's keychain and developer certificates
- **CI builds**: Run on Linux/macOS runners without access to your certificates
- **Result**: CI builds are unsigned and trigger macOS security warnings

## Current Situation Analysis

### **Your Local Environment**
When you build locally (`pnpm run make`), Electron Forge likely:
- Uses certificates from your macOS Keychain
- Signs the app automatically if certificates are available
- Creates a signed `.app` bundle that macOS trusts

### **GitHub Actions Environment**
When GitHub Actions builds your app:
- No access to your signing certificates
- Creates unsigned `.app` bundles
- Results in apps that macOS blocks by default

## Solutions

### **Option 1: Add Code Signing to GitHub Actions (Recommended)**

#### **Prerequisites**
1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate**
3. **App-specific password** for notarization

#### **Step 1: Export Certificates**
On your Mac:
```bash
# Export Developer ID Application certificate
security find-identity -v -p codesigning

# Export certificate and private key to .p12 file
# (Use Keychain Access app: select certificate → File → Export Items)
```

#### **Step 2: Create GitHub Secrets**
Add these secrets to your repository (Settings → Secrets → Actions):
- `APPLE_CERTIFICATE`: Base64-encoded .p12 certificate file
- `APPLE_CERTIFICATE_PASSWORD`: Password for the .p12 file
- `APPLE_ID`: Your Apple ID email
- `APPLE_APP_PASSWORD`: App-specific password from Apple ID
- `APPLE_TEAM_ID`: Your Apple Developer Team ID

#### **Step 3: Update GitHub Actions Workflow**

Add this to your `build.yml` before the build step:

```yaml
- name: Setup Apple code signing (macOS only)
  if: matrix.platform == 'darwin'
  run: |
    # Create keychain
    security create-keychain -p "temp_password" build.keychain
    security default-keychain -s build.keychain
    security unlock-keychain -p "temp_password" build.keychain
    
    # Import certificate
    echo "${{ secrets.APPLE_CERTIFICATE }}" | base64 --decode > certificate.p12
    security import certificate.p12 -k build.keychain -P "${{ secrets.APPLE_CERTIFICATE_PASSWORD }}" -T /usr/bin/codesign
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "temp_password" build.keychain
    
    # Clean up
    rm certificate.p12
  env:
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

- name: Build and notarize application (macOS)
  if: matrix.platform == 'darwin'
  run: pnpm run make
  env:
    # Existing environment variables
    npm_config_target_arch: ${{ matrix.arch }}
    npm_config_target_platform: ${{ matrix.platform }}
    ELECTRON_SKIP_BINARY_DOWNLOAD: 1
    NODE_OPTIONS: --max_old_space_size=8912
    # Code signing environment variables
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

#### **Step 4: Update Forge Configuration**

Add signing configuration to `forge.config.ts`:

```typescript
const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './build-resources/icons/icon',
    extraResource: [
      "./examples/",
      "./docs/"
    ],
    // Code signing configuration
    osxSign: {
      identity: 'Developer ID Application: Your Name (TEAM_ID)',
      'hardened-runtime': true,
      'gatekeeper-assess': false,
      'entitlements': 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
    },
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID!,
      appleIdPassword: process.env.APPLE_APP_PASSWORD!,
      teamId: process.env.APPLE_TEAM_ID!,
    },
    // Architecture support
    ...(process.env.npm_config_target_arch && {
      arch: process.env.npm_config_target_arch
    }),
    ...(process.env.npm_config_target_platform && {
      platform: process.env.npm_config_target_platform
    })
  },
  // ... rest of config
};
```

#### **Step 5: Create Entitlements File**

Create `entitlements.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
</dict>
</plist>
```

### **Option 2: Distribute Unsigned Apps with Instructions**

If you don't want to set up code signing immediately:

#### **Create User Instructions**
Add a `DISTRIBUTION.md` file:

```markdown
# Installing Nodebook.js on macOS

## For Unsigned Builds (GitHub Actions)

If you downloaded from GitHub releases, the app is unsigned. To run it:

### Method 1: Right-click to open
1. Download the .zip file
2. Extract the .app file
3. **Right-click** on Nodebook.js.app
4. Select **"Open"** from the context menu
5. Click **"Open"** when prompted

### Method 2: System Preferences
1. Try to open the app normally (it will be blocked)
2. Go to **System Preferences** → **Security & Privacy**
3. Click **"Open Anyway"** for Nodebook.js
4. Confirm by clicking **"Open"**

### Method 3: Command Line (Advanced)
```bash
# Remove quarantine attribute
xattr -dr com.apple.quarantine /path/to/Nodebook.js.app

# Alternative: Disable Gatekeeper temporarily (not recommended)
sudo spctl --master-disable
```

## For Signed Builds (Local Development)
Apps built locally with valid certificates should open normally.
```

### **Option 3: Self-Signed Certificate (Development)**

For development/testing purposes:

```bash
# Create self-signed certificate
security create-keychain -p "password" temp.keychain
security default-keychain -s temp.keychain
security unlock-keychain -p "password" temp.keychain

# Generate certificate
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout private.key -out certificate.crt \
  -subj "/CN=Nodebook.js Developer"

# Import to keychain
security import certificate.crt -k temp.keychain
security import private.key -k temp.keychain
```

## Implementation Steps

### **Immediate Solution (Option 2)**
1. Add distribution instructions to your repository
2. Update README with installation notes
3. Include instructions in release notes

### **Long-term Solution (Option 1)**
1. Get Apple Developer account
2. Generate certificates
3. Add secrets to GitHub
4. Update build configuration
5. Test with signed builds

## Troubleshooting

### **Common Issues**

#### **"App is damaged and can't be opened"**
- **Cause**: Unsigned app downloaded from internet
- **Solution**: Use right-click → Open method

#### **"App can't be opened because Apple cannot check it for malicious software"**
- **Cause**: App not notarized
- **Solution**: System Preferences → Security & Privacy → Open Anyway

#### **Build fails with signing errors**
- **Cause**: Invalid certificates or configuration
- **Solution**: Check certificate validity and team ID

### **Debugging Code Signing**

```bash
# Check if app is signed
codesign -dv --verbose=4 /path/to/Nodebook.js.app

# Verify signature
codesign --verify --deep --verbose=2 /path/to/Nodebook.js.app

# Check notarization
xcrun stapler validate /path/to/Nodebook.js.app
```

## Cost Considerations

### **Apple Developer Program**
- **Individual**: $99/year
- **Organization**: $99/year
- **Enterprise**: $299/year (for internal distribution only)

### **Benefits of Signing**
- **User trust**: No security warnings
- **App Store distribution**: Required for Mac App Store
- **Automatic updates**: Better support with signed apps
- **Professional appearance**: Shows commitment to security

## Security Best Practices

### **Certificate Management**
- **Never commit certificates** to version control
- **Use GitHub Secrets** for sensitive data
- **Rotate certificates** before expiration
- **Limit access** to signing secrets

### **Notarization**
- **Required for distribution** outside Mac App Store
- **Automatic security scanning** by Apple
- **Required for macOS 10.15+** Gatekeeper
- **Includes malware detection**

## Alternative Distribution Methods

### **Mac App Store**
- **Pros**: Trusted distribution, automatic updates
- **Cons**: Review process, App Store guidelines
- **Requirements**: Different certificates and entitlements

### **Direct Distribution**
- **Pros**: Full control over distribution
- **Cons**: Users need to trust your certificate
- **Requirements**: Developer ID certificates

### **Enterprise Distribution**
- **Pros**: Internal distribution without App Store
- **Cons**: Limited to organization members
- **Requirements**: Enterprise Developer Program

## Automation Considerations

### **CI/CD Pipeline**
With proper signing setup:
1. **Code push** → GitHub Actions triggered
2. **Build apps** for all platforms
3. **Sign and notarize** macOS apps automatically
4. **Create release** with signed binaries
5. **Users download** trusted applications

### **Release Process**
- **Automated signing** reduces manual steps
- **Consistent certificates** across all builds
- **Notarization status** visible in workflow logs
- **Failed builds** if signing/notarization fails

This comprehensive approach ensures your macOS applications work reliably for all users, whether built locally or through GitHub Actions!

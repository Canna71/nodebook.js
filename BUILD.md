# Building Nodebook.js

## Local Development

### Prerequisites
- Node.js 20+
- pnpm (recommended package manager)

### Setup
```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm start

# Build for current platform
pnpm run make
```

### Cross-Platform Building

You can build for specific platforms and architectures using these commands:

```bash
# macOS builds
pnpm run make:darwin:x64    # Intel Macs
pnpm run make:darwin:arm64  # Apple Silicon Macs

# Windows builds
pnpm run make:win32:x64     # Windows 64-bit

# Linux builds
pnpm run make:linux:x64     # Linux 64-bit
```

## GitHub Actions CI/CD

This project includes automated building and releases through GitHub Actions with memory optimizations and cross-platform support.

### Workflows

1. **CI Build** (`.github/workflows/ci.yml`)
   - Runs on every push to `main`/`develop` and on pull requests
   - Tests building on macOS and Windows
   - Runs package step to verify build works
   - Lightweight testing without full make process

2. **Build and Release** (`.github/workflows/build.yml`)
   - Triggered by version tags (e.g., `v1.0.0`), pushes to main/develop, and manual dispatch
   - Builds for multiple platforms and architectures:
     - macOS x64 (Intel)
     - macOS ARM64 (Apple Silicon)
     - Windows x64
   - **Memory optimizations**: 4GB Node.js heap size for all build steps
   - **Disk space optimization**: Cleans up unnecessary files on Linux runners
   - Creates GitHub releases with built artifacts for tagged versions
   - Uploads build artifacts for all workflow runs

3. **Test Cross-Platform Build** (`.github/workflows/test-build.yml`)
   - Manual trigger only (workflow_dispatch)
   - Allows testing specific platform/architecture combinations
   - Perfect for debugging build issues before releases

### Memory and Performance Optimizations

The workflows include several optimizations to handle large builds:

```yaml
# Node.js memory increase (applied to all steps)
- name: Increase Node.js memory
  run: echo "NODE_OPTIONS=--max_old_space_size=4096" >> $GITHUB_ENV

# Memory settings for each build step
env:
  NODE_OPTIONS: --max_old_space_size=4096

# Disk space cleanup (Linux only)
- name: Free up disk space (Ubuntu/Linux)
  if: runner.os == 'Linux'
  run: |
    sudo rm -rf /usr/share/dotnet
    sudo rm -rf /opt/ghc
    sudo rm -rf "/usr/local/share/boost"
    sudo rm -rf "$AGENT_TOOLSDIRECTORY"
```

### Creating a Release

To create a new release:

1. Update the version in `package.json`
2. Commit your changes
3. Create and push a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically build and create a release

### Finding Build Artifacts

#### During/After Workflow Runs
1. **Go to your GitHub repository**
2. **Click "Actions" tab**
3. **Find your workflow run** (shows as "Build and Release")
4. **Click on the specific workflow run**
5. **Scroll down to "Artifacts" section** at the bottom

You'll see artifacts named:
- `build-darwin-x64` (Intel Mac build)
- `build-darwin-arm64` (Apple Silicon Mac build)
- `build-win32-x64` (Windows build)

#### For Tagged Releases
When you push a version tag, artifacts also appear in:
1. **Repository → "Releases"** (right sidebar)
2. **Direct download links** for end users
3. **Automatic release notes generation**

### Build Artifacts

The build process creates the following artifacts:

- **macOS**: `.zip` files with the app bundle (e.g., `Nodebook.js-darwin-x64-0.8.0.zip`)
- **Windows**: `.exe` installer files using Squirrel (e.g., `Nodebook.js Setup 0.8.0.exe`)
- **Linux**: `.deb` and `.rpm` packages (when building on Linux runners)

### Architecture Support

- **macOS**: Both Intel (x64) and Apple Silicon (ARM64)  
- **Windows**: x64 (ARM64 can be enabled but may have native module compatibility issues)
- **Linux**: x64 (when built on Linux runners)

### Workflow Monitoring

To monitor your builds in real-time:

1. **GitHub Actions page** shows:
   - ✅ Green checkmarks for completed steps
   - 🔄 Spinning icons for currently running steps
   - ❌ Red X's for failed steps

2. **Click on any step** to see detailed logs
3. **Check "Artifacts" section** at the bottom when builds complete

### Troubleshooting

#### Memory Issues
If builds fail with "out of memory" errors:
- ✅ **Already handled**: Workflows set 4GB heap size for all Node.js processes
- ✅ **Already handled**: Memory settings applied to install, postinstall, and build steps
- **Check logs**: Look for "ENOMEM" or "JavaScript heap out of memory" messages

#### Native Module Issues
If you encounter issues with native modules during cross-compilation:

1. Ensure all native dependencies are listed in `pnpm.onlyBuiltDependencies` in package.json
2. Check that the modules support the target architecture
3. Consider using `electron-rebuild` for specific scenarios
4. **Current setup**: Native modules are rebuilt with proper architecture targeting

#### Build Failures
- **Check GitHub Actions logs** for specific error messages
- **Look for step-by-step failures** in the workflow run
- **Verify build resources**: Ensure all required icons and resources are present
- **Check forge.config.ts**: Ensure proper platform/architecture configuration

#### Icon Issues
- **macOS**: Uses `.icns` format (`build-resources/icons/icon.icns`)
- **Windows**: Uses `.ico` format (`build-resources/icons/icon.ico`)
- **Linux**: Uses `.png` format (`build-resources/icons/icon.png`)

All icons should be placed in `build-resources/icons/` with the base name `icon`.

#### Disk Space Issues
- ✅ **Already handled**: Linux runners automatically clean up unnecessary files
- **Check logs**: Look for "ENOSPC" (no space left on device) errors

### Local Testing

Before pushing tags for releases, you can test the build process locally:

```bash
# Test CI build process (lightweight)
pnpm run package

# Test full make process for current platform
pnpm run make

# Test specific platform builds (requires appropriate OS)
pnpm run make:darwin:x64     # Intel Mac
pnpm run make:darwin:arm64   # Apple Silicon Mac  
pnpm run make:win32:x64      # Windows

# Use the build script for easier testing
./build.sh                   # Current platform
./build.sh darwin arm64      # Specific platform/arch
```

### Build Script Usage

The included `build.sh` script provides an easy way to test builds:

```bash
# Build for current platform
./build.sh

# Build for specific platform/architecture
./build.sh darwin x64        # Intel Mac
./build.sh darwin arm64      # Apple Silicon Mac
./build.sh win32 x64         # Windows 64-bit
./build.sh linux x64         # Linux 64-bit
```

### Advanced Configuration

#### Cross-Compilation Environment Variables
The workflows use these environment variables for cross-compilation:

```yaml
env:
  npm_config_target_arch: ${{ matrix.arch }}      # x64, arm64
  npm_config_target_platform: ${{ matrix.platform }} # darwin, win32, linux
  ELECTRON_SKIP_BINARY_DOWNLOAD: 1               # Skip redundant downloads
  NODE_OPTIONS: --max_old_space_size=4096        # Memory optimization
```

#### Forge Configuration
The `forge.config.ts` includes platform-specific settings:

- **Automatic architecture detection** from environment variables
- **Platform-specific makers**: Squirrel for Windows, ZIP for macOS/Linux
- **Icon handling**: Automatic format selection based on platform
- **Module externalization**: Handles complex dependencies like TensorFlow, D3, etc.

### Continuous Integration Strategy

1. **Every Push/PR**: Lightweight CI build to catch basic issues
2. **Manual Testing**: Use test-build workflow for specific scenarios  
3. **Tagged Releases**: Full cross-platform build with automatic release creation
4. **Artifact Retention**: 30 days for releases, 7 days for test builds

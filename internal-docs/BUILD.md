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

This project includes automated building and releases through GitHub Actions.

### Workflows

1. **CI Build** (`.github/workflows/ci.yml`)
   - Runs on every push to `main`/`develop` and on pull requests
   - Tests building on macOS and Windows
   - Runs package step to verify build works

2. **Build and Release** (`.github/workflows/build.yml`)
   - Triggered by version tags (e.g., `v1.0.0`)
   - Builds for multiple platforms and architectures:
     - macOS x64 (Intel)
     - macOS ARM64 (Apple Silicon)
     - Windows x64
   - Creates GitHub releases with built artifacts

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

### Build Artifacts

The build process creates the following artifacts:

- **macOS**: `.zip` files with the app bundle
- **Windows**: `.exe` installer files (Squirrel)
- **Linux**: `.deb` and `.rpm` packages (when building on Linux)

### Architecture Support

- **macOS**: Both Intel (x64) and Apple Silicon (ARM64)
- **Windows**: x64 (ARM64 can be enabled but may have compatibility issues)
- **Linux**: x64 (when built on Linux runners)

### Troubleshooting

#### Native Module Issues
If you encounter issues with native modules during cross-compilation:

1. Ensure all native dependencies are listed in `pnpm.onlyBuiltDependencies`
2. Check that the modules support the target architecture
3. Consider using `electron-rebuild` for specific scenarios

#### Build Failures
- Check the GitHub Actions logs for specific error messages
- Verify that all required build resources (icons, etc.) are present
- Ensure `forge.config.ts` is properly configured for the target platform

#### Icon Issues
- macOS: Uses `.icns` format
- Windows: Uses `.ico` format  
- Linux: Uses `.png` format

All icons should be placed in `build-resources/icons/` with the base name `icon` (no extension).

### Local Testing

Before pushing tags for releases, you can test the build process locally:

```bash
# Test CI build process
pnpm run package

# Test full make process for current platform
pnpm run make

# Test specific platform builds (requires appropriate OS)
pnpm run make:darwin:x64
```

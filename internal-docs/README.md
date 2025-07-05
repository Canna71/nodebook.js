# Internal Documentation Index

This folder contains internal technical documentation for Nodebook.js developers and contributors.

## Documents

### Dialog System
- **[Dialog System Usage Guide](dialog-system-usage.md)** - Comprehensive guide on how to use the unified dialog system
- **[Dialog System Architecture](dialog-system-architecture.md)** - Technical architecture and design decisions
- **[Dialog System API Reference](dialog-system-api-reference.md)** - Complete API documentation with examples

## Document Purpose

These documents are intended for:
- **Developers** working on Nodebook.js features
- **Contributors** understanding the codebase
- **Maintainers** making architectural decisions
- **Code reviewers** understanding system design

## External Documentation

For end-user documentation, see the `/docs` folder which contains:
- User guides
- Feature documentation
- End-user API references
- Tutorial materials

## Contributing to Documentation

When adding new internal documentation:
1. Place technical/architectural docs in this folder
2. Place user-facing docs in `/docs`
3. Update this index when adding new documents
4. Follow the established documentation format and style
5. Include practical examples and code samples



- https://www.electronforge.io/
- https://vite.dev/
- https://www.npmjs.com/package/@vitejs/plugin-react

[x] All modules allowed

[x] return from code block

[ ] Tensorflow example

[ ] Plotly example

[ ] render returned object

[x] Enhanced Error Handling & Display
  - ✅ Reactive error tracking in code cells
  - ✅ Visual error indicators (red border, error icon)
  - ✅ Minimal error display in cells (message + console reference)
  - ✅ Detailed error display in console viewer (full stack traces)
  - ✅ Automatic error clearing on successful re-execution
  - ✅ Error state propagation through reactive dependencies

[ ] Enhanced API Key Security
  - ✅ Implement encryption using Electron's `safeStorage` API
  - ✅ Integration with electron-settings for consistent storage
  - ✅ Graceful fallback when encryption not available
  - ✅ Secure storage with base64 obfuscation as fallback
  - [ ] Optional OS keychain integration for additional security layer
  - [ ] Key rotation and expiration features

## If issues on windows try these commands

```powershell
$env:PYTHON = 'C:\Users\gcann\miniconda3\envs\electron-build\python.exe'; npx @electron/rebuild
```

```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192"; pnpm run package
```

# Squirrel issues

```powershell
$env:SQUIRREL_TEMP='C:\Users\AdminUser\git\banana_native\apps\electron-app\squirrel-temp'; "C:\Users\AdminUser\git\banana_native\node_modules\electron-winstaller\vendor\Squirrel.exe" --releasify "C:\Users\RootUser\AppData\Local\Temp\si-202535-21060-mina4t.5zwzm\electron_app.1.0.0.nupkg" --releaseDir "C:\Users\AdminUser\git\banana_native\apps\electron-app\out\make\squirrel.windows\x64" --loadingGif "C:\Users\AdminUser\git\banana_native\node_modules\electron-winstaller\resources\install-spinner.gif" --no-msi
```

https://github.com/electron/forge/issues/3892

Add electron-winstaller to onlyBuiltDependencies in package.json, and run pnpm store prune; pnpm rebuild electron-winstaller
```json
{
  "pnpm": {
    "onlyBuiltDependencies": [
      "electron",
+    "electron-winstaller"
    ]
  },
}
```
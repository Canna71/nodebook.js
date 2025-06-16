

- https://www.electronforge.io/
- https://vite.dev/
- https://www.npmjs.com/package/@vitejs/plugin-react

[x] All modules allowed

[x] return from code block

[ ] Tensorflow example

[ ] Plotly example

[ ] render returned object

[ ] Enhanced API Key Security
  - ✅ Implement encryption using Electron's `safeStorage` API
  - ✅ Integration with electron-settings for consistent storage
  - ✅ Graceful fallback when encryption not available
  - ✅ Secure storage with base64 obfuscation as fallback
  - [ ] Optional OS keychain integration for additional security layer
  - [ ] Key rotation and expiration features

$env:PYTHON = 'C:\Users\gcann\miniconda3\envs\electron-build\python.exe'; npx @electron/rebuild

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
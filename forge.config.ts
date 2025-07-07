import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';
// @ts-ignore
import fs from 'fs-extra';

// const modulesToExternalize = ["axios"];

// List of modules to place outside ASAR
    const modulesToExternalize = [
    '@babel/runtime', // this is needed for loading modules at runtime
    // 'danfojs',
    // 'long',
    // '@tensorflow',
    // 'seedrandom',
    // TODO: preload mathjs
    // 'mathjs',
    // 'typed-function',
    // 'decimal.js',
    // 'complex.js',
    // 'fraction.js',
    // 'javascript-natural-sort',
    // 'lodash',

    'axios',
    'form-data',

    'node-fetch',
    // 'escape-latex',
    // 'tiny-emitter',
    // 'table',
    // 'papaparse', // Now preloaded
    // 'plotly.js-dist-min',
    // 'xlsx', // Now preloaded
    // 'string-width',
    // 'strip-ansi',
    // 'is-fullwidth-code-point',
    // 'astral-regex',
    // 'ansi-styles',
    // 'lodash.clonedeep',
    // 'fast-deep-equal',
    // 'lodash.truncate',
    'd3',
    // 'ansi-regex',
    // 'emoji-regex'
    'zx' 
];

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './build-resources/icons/icon', // no file extension required - Forge auto-detects
    // File associations for the packaged app
    protocols: [
      {
        name: 'nodebook',
        schemes: ['nodebook']
      }
    ],
    // Platform-specific configurations
    ...(process.platform === 'darwin' && {
      extendInfo: './build-resources/Info.plist'
    }),
    extraResource: [
    //   "./node_modules/danfojs/",
    //   "./node_modules/danfojs-node/",
    //   "./node_modules/@tensorflow/",
    "./examples/",
    "./docs/",
    // File association resources
    "./build-resources/application-x-nodebook.xml",
    "./build-resources/nodebook.desktop"
    ],
    // Support for different architectures
    ...(process.env.npm_config_target_arch && {
      arch: process.env.npm_config_target_arch
    }),
    ...(process.env.npm_config_target_platform && {
      platform: process.env.npm_config_target_platform
    })
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // Windows installer icons and file associations
      iconUrl: 'https://raw.githubusercontent.com/your-username/nodebook.js/main/build-resources/icons/icon.png', // Change this URL
      setupIcon: './build-resources/icons/icon.ico',
      // Windows file associations - handled by the main process
      setupExe: 'nodebook-setup.exe'
    }, ['win32']), 
    new MakerZIP({}, ['darwin', 'linux']), 
    new MakerRpm({
      options: {
        icon: './build-resources/icons/icon.png',
        // Categories and metadata for better integration
        categories: ['Development', 'Science', 'Education'],
        productDescription: 'Interactive notebook application for reactive computing'
      }
    }, ['linux']), 
    new MakerDeb({
      options: {
        icon: './build-resources/icons/icon.png',
        // Categories and metadata for better integration
        categories: ['Development', 'Science', 'Education'],
        productDescription: 'Interactive notebook application for reactive computing'
      }
    }, ['linux'])
    ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.mts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.mts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const fs = require('fs-extra');
      const path = require('path');
      
      // Create directory for external modules
      // This will be at the same level as app.asar
      const resourcesDir = path.join(buildPath, '..');
      const externalModulesDir = path.join(resourcesDir, 'node_modules');
      await fs.ensureDir(externalModulesDir);
      
      
      
      for (const moduleName of modulesToExternalize) {
        const src = path.join(__dirname, 'node_modules', moduleName);
        const dest = path.join(externalModulesDir, moduleName);
        
        if (await fs.pathExists(src)) {
          await fs.copy(src, dest);
          console.log(`✅ Copied ${moduleName} to: ${dest}`);
        } else {
          console.warn(`⚠️ Module not found: ${moduleName}`);
        }
      }
      
      // macOS-specific setup for file associations
      if (platform === 'darwin') {
        console.log('Setting up macOS file association resources...');
        
        // The buildPath for macOS points to: Nodebook.js.app/Contents/Resources/app
        // So we need to go to: Nodebook.js.app/Contents/Resources/
        const appResourcesDir = path.join(buildPath, '..');
        
        console.log('macOS buildPath:', buildPath);
        console.log('macOS appResourcesDir:', appResourcesDir);
        
        // Ensure the Resources directory exists
        await fs.ensureDir(appResourcesDir);
        
        // Copy main app icon
        const appIconSrc = path.join(__dirname, 'build-resources', 'icons', 'icon.icns');
        const appIconDest = path.join(appResourcesDir, 'icon.icns');
        
        if (await fs.pathExists(appIconSrc)) {
          await fs.copy(appIconSrc, appIconDest);
          console.log('✅ Copied icon.icns to app bundle');
        } else {
          console.warn('⚠️ icon.icns not found in build resources');
        }
        
        // Copy document icon to app bundle resources
        const documentIconSrc = path.join(__dirname, 'build-resources', 'icons', 'document.icns');
        const documentIconDest = path.join(appResourcesDir, 'document.icns');
        
        if (await fs.pathExists(documentIconSrc)) {
          await fs.copy(documentIconSrc, documentIconDest);
          console.log('✅ Copied document.icns to app bundle');
        } else {
          console.warn('⚠️ document.icns not found in build resources');
          // Fallback: copy app icon as document icon
          if (await fs.pathExists(appIconSrc)) {
            await fs.copy(appIconSrc, documentIconDest);
            console.log('📄 Using app icon as document icon fallback');
          }
        }
        
        // Copy Info.plist to app bundle - buildPath is app/Contents/Resources/app, so Info.plist is at ../Info.plist
        const infoPlistSrc = path.join(__dirname, 'build-resources', 'Info.plist');
        const infoPlistDest = path.join(buildPath, '..', 'Info.plist');
        
        console.log('Info.plist source:', infoPlistSrc);
        console.log('Info.plist dest:', infoPlistDest);
        
        if (await fs.pathExists(infoPlistSrc) && await fs.pathExists(infoPlistDest)) {
          try {
            // Read the existing Info.plist
            const existingPlist = await fs.readFile(infoPlistDest, 'utf8');
            const customPlist = await fs.readFile(infoPlistSrc, 'utf8');
            
            // Extract document types and UTI declarations from custom plist
            const docTypesMatch = customPlist.match(/<key>CFBundleDocumentTypes<\/key>\s*<array>.*?<\/array>/s);
            const utiMatch = customPlist.match(/<key>UTExportedTypeDeclarations<\/key>\s*<array>.*?<\/array>/s);
            
            if (docTypesMatch && utiMatch) {
              let updatedPlist = existingPlist;
              
              // Add document types if not present
              if (!updatedPlist.includes('CFBundleDocumentTypes')) {
                updatedPlist = updatedPlist.replace(
                  '</dict>\n</plist>',
                  `    ${docTypesMatch[0]}\n    ${utiMatch[0]}\n</dict>\n</plist>`
                );
                
                await fs.writeFile(infoPlistDest, updatedPlist);
                console.log('✅ Updated Info.plist with file associations');
              } else {
                console.log('📄 Info.plist already contains file associations');
              }
            } else {
              console.warn('⚠️ Could not extract file associations from custom Info.plist');
            }
          } catch (error) {
            console.warn('⚠️ Error updating Info.plist:', error.message);
          }
        } else {
          console.warn('⚠️ Info.plist source or destination not found');
          console.warn('Source exists:', await fs.pathExists(infoPlistSrc));
          console.warn('Dest exists:', await fs.pathExists(infoPlistDest));
        }
      }
    },
    // Post-package hook for Linux file associations and macOS verification
    postPackage: async (config, packageResult) => {
      const { platform, outputPaths } = packageResult;
      const path = require('path');
      const fs = require('fs-extra');
      
      if (platform === 'linux') {
        console.log('Setting up Linux file associations...');
        
        for (const outputPath of outputPaths) {
          try {
            // Copy desktop file
            const desktopSrc = path.join(__dirname, 'build-resources', 'nodebook.desktop');
            const desktopDest = path.join(outputPath, 'nodebook.desktop');
            if (await fs.pathExists(desktopSrc)) {
              await fs.copy(desktopSrc, desktopDest);
              console.log('✅ Copied desktop file to package');
            }
            
            // Copy MIME type definition
            const mimeSrc = path.join(__dirname, 'build-resources', 'application-x-nodebook.xml');
            const mimeDest = path.join(outputPath, 'mime', 'application-x-nodebook.xml');
            if (await fs.pathExists(mimeSrc)) {
              await fs.ensureDir(path.dirname(mimeDest));
              await fs.copy(mimeSrc, mimeDest);
              console.log('✅ Copied MIME type definition to package');
            }
            
            // Create post-install script
            const postInstallScript = `#!/bin/bash
# Nodebook.js post-install script for file associations

# Install MIME type
if [ -f "/usr/share/mime/packages/application-x-nodebook.xml" ]; then
    xdg-mime install --mode system /usr/share/mime/packages/application-x-nodebook.xml 2>/dev/null || true
fi

# Install desktop file
if [ -f "/usr/share/applications/nodebook.desktop" ]; then
    desktop-file-install --mode 644 /usr/share/applications/nodebook.desktop 2>/dev/null || true
fi

# Update databases
update-mime-database /usr/share/mime 2>/dev/null || true
update-desktop-database /usr/share/applications 2>/dev/null || true

# Set as default application for .nbjs files
xdg-mime default nodebook.desktop application/x-nodebook 2>/dev/null || true

echo "Nodebook.js file associations installed successfully!"
`;
            
            const scriptPath = path.join(outputPath, 'post-install.sh');
            await fs.writeFile(scriptPath, postInstallScript);
            await fs.chmod(scriptPath, '755');
            console.log('✅ Created post-install script for Linux file associations');
            
          } catch (error) {
            console.warn('⚠️ Failed to setup Linux file associations:', error);
          }
        }
      }
      
      if (platform === 'darwin') {
        console.log('Verifying macOS file association setup...');
        
        for (const outputPath of outputPaths) {
          try {
            const appPath = path.join(outputPath, 'Nodebook.js.app');
            const resourcesPath = path.join(appPath, 'Contents', 'Resources');
            
            // Check for required icons
            const requiredIcons = ['icon.icns', 'document.icns'];
            for (const iconFile of requiredIcons) {
              const iconPath = path.join(resourcesPath, iconFile);
              if (await fs.pathExists(iconPath)) {
                console.log(`✅ Found ${iconFile} in app bundle`);
              } else {
                console.warn(`⚠️ Missing ${iconFile} in app bundle`);
              }
            }
            
            // Verify Info.plist contains file associations
            const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
            if (await fs.pathExists(infoPlistPath)) {
              const plistContent = await fs.readFile(infoPlistPath, 'utf8');
              if (plistContent.includes('CFBundleDocumentTypes') && plistContent.includes('UTExportedTypeDeclarations')) {
                console.log('✅ Info.plist contains file association declarations');
              } else {
                console.warn('⚠️ Info.plist missing file association declarations');
              }
            } else {
              console.warn('⚠️ Info.plist missing from app bundle');
            }
            
            console.log('');
            console.log('📋 macOS Installation Instructions:');
            console.log('1. Move Nodebook.js.app to /Applications/ folder');
            console.log('2. Run: sudo /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/Nodebook.js.app');
            console.log('3. Right-click any .nbjs file → Get Info → Change default app to Nodebook.js');
            console.log('4. See docs/macos-file-association-troubleshooting.md for detailed instructions');
            
          } catch (error) {
            console.warn('⚠️ Failed to verify macOS file associations:', error);
          }
        }
      }
    },
  }

};

export default config;

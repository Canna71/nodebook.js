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
    'papaparse',
    // 'plotly.js-dist-min',
    'xlsx',
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
];

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './build-resources/icons/icon', // no file extension required - Forge auto-detects
    extraResource: [
    //   "./node_modules/danfojs/",
    //   "./node_modules/danfojs-node/",
    //   "./node_modules/@tensorflow/",
    "./examples/",
    "./docs/"
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
      // Windows installer icons
      iconUrl: 'https://raw.githubusercontent.com/your-username/nodebook.js/main/build-resources/icons/icon.png', // Change this URL
      setupIcon: './build-resources/icons/icon.ico'
    }, ['win32']), 
    new MakerZIP({}, ['darwin', 'linux']), 
    new MakerRpm({
      options: {
        icon: './build-resources/icons/icon.png'
      }
    }, ['linux']), 
    new MakerDeb({
      options: {
        icon: './build-resources/icons/icon.png'
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
    }
  }

};

export default config;

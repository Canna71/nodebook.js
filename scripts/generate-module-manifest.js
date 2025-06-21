#!/usr/bin/env node

/**
 * Generate a module manifest with version information at build time
 * This script reads package.json and node_modules to create a comprehensive
 * list of available modules with their versions.
 */

const fs = require('fs');
const path = require('path');

function generateModuleManifest() {
    const manifest = {
        generatedAt: new Date().toISOString(),
        modules: {},
        nodeVersion: process.version,
        platform: process.platform
    };

    // Read main package.json
    try {
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Add dependencies and devDependencies
        const allDeps = {
            ...packageJson.dependencies || {},
            ...packageJson.devDependencies || {}
        };

        // Known modules that are actually used in the application
        const knownModules = [
            'danfojs',
            'plotly.js-dist-min',
            '@tensorflow/tfjs',
            'zx'
        ];

        // Add specific versions for dependencies we can track
        Object.keys(allDeps).forEach(depName => {
            if (knownModules.includes(depName)) {
                try {
                    const depPackageJsonPath = path.join(__dirname, '..', 'node_modules', depName, 'package.json');
                    if (fs.existsSync(depPackageJsonPath)) {
                        const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf8'));
                        manifest.modules[depName] = {
                            version: depPackageJson.version,
                            description: depPackageJson.description || '',
                            type: 'npm'
                        };
                    } else {
                        // Use version from main package.json
                        manifest.modules[depName] = {
                            version: allDeps[depName],
                            description: '',
                            type: 'npm'
                        };
                    }
                } catch (error) {
                    console.warn(`Could not get version for ${depName}:`, error.message);
                    manifest.modules[depName] = {
                        version: allDeps[depName],
                        description: '',
                        type: 'npm'
                    };
                }
            }
        });

        // Add built-in Node.js modules
        const builtinModules = [
            'os', 'path', 'fs', 'util', 'url', 'querystring',
            'crypto', 'zlib', 'stream', 'buffer', 'events',
            'readline', 'worker_threads', 'child_process',
            'string_decoder', 'timers', 'async_hooks',
            'assert', 'constants'
        ];

        builtinModules.forEach(moduleName => {
            manifest.modules[moduleName] = {
                version: process.version,
                description: 'Node.js built-in module',
                type: 'builtin'
            };
        });

    } catch (error) {
        console.error('Error reading package.json:', error);
    }

    // Write manifest file
    const manifestPath = path.join(__dirname, '..', 'src', 'module-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✓ Generated module manifest with ${Object.keys(manifest.modules).length} modules`);
    console.log(`  Output: ${manifestPath}`);
}

if (require.main === module) {
    generateModuleManifest();
}

module.exports = { generateModuleManifest };

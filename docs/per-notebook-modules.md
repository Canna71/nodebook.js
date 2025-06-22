# Per-Notebook Module Resolution

Nodebook.js now supports per-notebook module resolution, allowing each notebook to have its own `node_modules` directory with packages specific to that notebook's needs.

## Overview

When you load a notebook, Nodebook.js automatically checks for a `node_modules` directory in the same folder as the notebook file. If found, this directory is added to the module resolution path with the highest priority, ensuring that notebook-specific packages take precedence over global ones.

## How It Works

### Module Resolution Priority

The module resolution follows this priority order:

1. **Notebook-specific node_modules** (highest priority)
2. **User data node_modules** (global user modules)  
3. **App resources node_modules** (bundled modules)
4. **Built-in Node.js modules** (lowest priority)

### Automatic Path Management

- **On notebook load**: The notebook's directory is scanned for a `node_modules` folder, which is automatically added to the require paths
- **On notebook close**: The notebook-specific paths are automatically removed from the require resolution
- **On notebook switch**: Old paths are cleared and new ones are added seamlessly

## Setting Up Per-Notebook Modules

### Method 1: Manual Setup

1. Create a directory for your notebook project:
   ```bash
   mkdir my-notebook-project
   cd my-notebook-project
   ```

2. Initialize npm in the notebook directory:
   ```bash
   npm init -y
   ```

3. Install packages you need:
   ```bash
   npm install lodash moment axios
   ```

4. Save your notebook in the same directory as `package.json`

5. Use the packages in your notebook:
   ```javascript
   const _ = require('lodash');
   const moment = require('moment');
   const axios = require('axios');
   
   // Your code here
   ```

### Method 2: Install from Code Cells (using zx)

If you have `zx` available, you can install packages directly from code cells:

```javascript
// Install packages using zx
const path = require('path');

// Get the notebook directory (automatically detected)
const notebookDir = process.cwd(); // Will be set to notebook directory

// Install packages
await $`cd ${notebookDir} && npm init -y`;
await $`cd ${notebookDir} && npm install lodash moment`;

output('Packages installed successfully!');
```

### Method 3: Using the File System API

```javascript
// More programmatic approach
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Ensure package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    fs.writeFileSync(packageJsonPath, JSON.stringify({
        name: 'my-notebook',
        version: '1.0.0',
        dependencies: {}
    }, null, 2));
}

// Install package
const npmInstall = spawn('npm', ['install', 'lodash'], { 
    cwd: process.cwd(),
    stdio: 'inherit' 
});

npmInstall.on('close', (code) => {
    if (code === 0) {
        output('Package installed successfully!');
    } else {
        output('Package installation failed');
    }
});
```

## Benefits

### 1. Isolation
Each notebook can have its own versions of packages without conflicts:
- Notebook A uses lodash v4.17.21
- Notebook B uses lodash v3.10.1
- No conflicts between them

### 2. Reproducibility
Dependencies are kept with the notebook:
- Share the entire notebook directory
- Recipients get the exact same package versions
- No "works on my machine" issues

### 3. Flexibility
Install packages only where needed:
- Heavy ML packages only in ML notebooks
- Data visualization packages only in chart notebooks
- Keep global environment clean

### 4. Version Control Friendly
Track dependencies properly:
- `package.json` and `package-lock.json` in version control
- `node_modules` in `.gitignore`
- Clear dependency tracking

## Best Practices

### Directory Structure
```
my-notebook-project/
├── notebook.nbjs          # Your notebook file
├── package.json           # npm dependencies
├── package-lock.json      # Locked versions
├── node_modules/          # Installed packages (git-ignored)
├── data/                  # Data files
└── README.md             # Project documentation
```

### Package Management
1. Always use `package.json` to track dependencies
2. Use `package-lock.json` for reproducible installs
3. Add `node_modules/` to `.gitignore`
4. Document required packages in your notebook

### Performance Considerations
1. Only install packages you actually need per notebook
2. Consider using global packages for commonly used utilities
3. Clean up unused packages regularly: `npm prune`

## Troubleshooting

### Check Module Resolution
```javascript
// Debug module resolution paths
const { moduleRegistry } = require('@/Engine/ModuleRegistry');
const debugInfo = moduleRegistry.getDebugInfo();

output({
    notebookPaths: debugInfo.notebookModulePaths,
    allPaths: debugInfo.nodeRequirePaths.slice(0, 10), // First 10 paths
    totalPaths: debugInfo.nodeRequirePaths.length
});
```

### Common Issues

**Package not found even though installed:**
- Ensure the `node_modules` directory is in the same folder as the notebook
- Check that the package is actually installed: `ls node_modules/`
- Restart the notebook to refresh module paths

**Module conflicts:**
- Notebook-specific modules always take precedence
- Check which version is being loaded:
  ```javascript
  const pkg = require('package-name');
  console.log(pkg.version || 'Version not available');
  ```

**Permission issues:**
- Ensure you have write permissions in the notebook directory
- On some systems, you might need to run npm with appropriate permissions

## Examples

See the `per-notebook-modules-example.nbjs` in the examples folder for a complete working example of per-notebook module resolution.

## Technical Implementation

The per-notebook module resolution is implemented through:

1. **ModuleRegistry enhancements**: Dynamic path management methods
2. **ApplicationProvider integration**: Lifecycle hooks for notebook load/close
3. **Automatic cleanup**: Prevents memory leaks and path pollution
4. **Priority-based resolution**: Ensures correct module precedence

This feature enhances Nodebook.js's capability to handle complex, multi-dependency projects while maintaining clean separation between different notebook environments.

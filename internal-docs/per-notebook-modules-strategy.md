# Per-Notebook Module Resolution Strategy

## Overview

This document outlines the implementation strategy for per-notebook module resolution in Nodebook.js, allowing each notebook to have its own `node_modules` directory with packages specific to that notebook's needs.

## Problem Statement

Previously, Nodebook.js had a global module system where all modules were resolved from:
1. App resources (`process.resourcesPath/node_modules`)
2. User data directory (`userData/node_modules`)
3. Built-in Node.js modules

This limited flexibility for:
- Installing packages only for specific notebooks
- Using different versions of packages in different notebooks
- Keeping notebooks self-contained with their dependencies

## Solution Design

### 1. Dynamic Module Path Management

**ModuleRegistry Enhancements:**
- Added `currentNotebookModulePaths: Set<string>` to track active notebook module paths
- Added `originalModulePaths: string[]` to backup original paths for restoration
- Added `addNotebookModulePath(notebookPath: string)` to add notebook-specific paths
- Added `removeNotebookModulePath(notebookPath: string)` to remove specific paths
- Added `clearNotebookModulePaths()` to clear all notebook paths
- Added `getActiveNotebookModulePaths()` to get current active paths
- Added `getDebugInfo()` for troubleshooting

### 2. Lifecycle Integration

**ApplicationProvider Integration:**
- **On notebook load** (`loadNotebook`): Clear existing paths, then add new notebook path
- **On notebook close** (`clearNotebook`): Clear all notebook-specific paths
- **On new notebook** (`newNotebook`): Clear all notebook-specific paths
- **On notebook switch**: Automatic cleanup of old paths and addition of new ones

### 3. Module Resolution Priority

**New Priority Order (Highest to Lowest):**
1. **Notebook-specific node_modules** (NEW - highest priority)
2. **Module cache** (previously loaded modules)
3. **Built-in Node.js modules** (fs, path, crypto, etc.)
4. **App resources node_modules** (danfojs, plotly, etc.)
5. **User data node_modules** (global user modules)
6. **System-wide modules** (lowest priority)

### 4. Path Management Strategy

**Dynamic Path Manipulation:**
- Uses `require.paths` array manipulation for immediate effect
- Updates `NODE_PATH` environment variable for comprehensive coverage
- Calls `Module._initPaths()` to refresh Node.js module resolution
- Maintains set of active paths to prevent duplicates

**Safety Measures:**
- Checks for directory existence before adding paths
- Graceful error handling for path operations
- Automatic cleanup to prevent memory leaks
- Restoration of original paths when needed

## Implementation Details

### ModuleRegistry Class Changes

```typescript
class ModuleRegistry {
  private currentNotebookModulePaths: Set<string> = new Set();
  private originalModulePaths: string[] = [];

  // Add notebook-specific module path
  public addNotebookModulePath(notebookPath: string): void {
    // Get notebook directory
    const notebookDir = path.dirname(notebookPath);
    const notebookModulesPath = path.join(notebookDir, 'node_modules');
    
    // Check if exists and add to paths
    if (fs.existsSync(notebookModulesPath)) {
      this.nodeRequire.paths.unshift(notebookModulesPath);
      this.currentNotebookModulePaths.add(notebookModulesPath);
      // Update NODE_PATH and refresh module paths
    }
  }

  // Remove and clear methods for cleanup
  public removeNotebookModulePath(notebookPath: string): void { ... }
  public clearNotebookModulePaths(): void { ... }
}
```

### ApplicationProvider Integration

```typescript
// On notebook load
const loadNotebook = useCallback(async (filePath: string) => {
  // Clear existing notebook paths first
  moduleRegistry.clearNotebookModulePaths();
  
  // Load notebook content
  const content = await fs.loadNotebook(filePath);
  
  // Add new notebook path
  moduleRegistry.addNotebookModulePath(filePath);
  
  // Continue with notebook loading...
}, []);

// On notebook close/clear
const clearNotebook = useCallback(() => {
  moduleRegistry.clearNotebookModulePaths();
  // Continue with clearing...
}, []);
```

## Usage Patterns

### 1. Manual Setup
```bash
# Create notebook directory
mkdir my-notebook-project
cd my-notebook-project

# Initialize npm
npm init -y

# Install packages
npm install lodash moment axios

# Save notebook in same directory
# Use packages in code cells
```

### 2. Programmatic Installation
```javascript
// Using zx in code cells
await $`cd ${process.cwd()} && npm install lodash`;

// Using child_process
const { spawn } = require('child_process');
spawn('npm', ['install', 'lodash'], { cwd: process.cwd() });
```

### 3. Module Usage
```javascript
// In code cells - notebook-specific modules take precedence
const _ = require('lodash');        // From notebook/node_modules/
const moment = require('moment');   // From notebook/node_modules/
const fs = require('fs');          // Built-in module
```

## Benefits

1. **Isolation**: Each notebook can use different package versions
2. **Reproducibility**: Dependencies travel with the notebook
3. **Flexibility**: Install packages only where needed
4. **Clean Environment**: Global environment stays uncluttered
5. **Version Control**: Proper dependency tracking with package.json

## Edge Cases Handled

1. **Multiple Notebooks**: Each notebook gets its own isolated module paths
2. **Concurrent Loads**: Proper cleanup prevents path pollution
3. **Missing Directories**: Graceful handling when node_modules doesn't exist
4. **Permission Issues**: Error handling for filesystem operations
5. **Path Conflicts**: Priority system ensures correct resolution

## Testing Strategy

1. **Unit Tests**: Test ModuleRegistry path manipulation methods
2. **Integration Tests**: Test ApplicationProvider lifecycle integration
3. **Manual Testing**: Example notebook with per-notebook modules
4. **Edge Case Testing**: Multiple notebooks, switching, cleanup

## Rollback Strategy

If issues arise, the implementation can be disabled by:
1. Commenting out the `moduleRegistry.addNotebookModulePath()` calls
2. The system falls back to the original global module resolution
3. No breaking changes to existing functionality

## Future Enhancements

1. **UI Integration**: Show per-notebook module status in UI
2. **Package Manager**: Built-in package installation interface
3. **Dependency Analysis**: Show module dependency trees
4. **Conflict Resolution**: Warn about version conflicts
5. **Module Caching**: Cache modules for better performance

## Monitoring and Debugging

1. **Debug Method**: `moduleRegistry.getDebugInfo()` shows current state
2. **Logging**: Comprehensive logging for troubleshooting
3. **Path Inspection**: Methods to inspect current module paths
4. **Error Handling**: Graceful degradation on failures

This strategy provides a robust, flexible, and maintainable solution for per-notebook module resolution while maintaining backward compatibility and system stability.

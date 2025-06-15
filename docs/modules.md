# Module System Guide

NotebookJS provides a comprehensive module system that allows you to use Node.js modules, scientific computing libraries, and custom modules in your code cells. This guide explains what modules are available and how to use them.

## Table of Contents

- [Module Availability](#module-availability)
- [Injected Global Variables](#injected-global-variables)
- [Require-Available Modules](#require-available-modules)
- [Built-in Node.js Modules](#built-in-nodejs-modules)
- [Pre-bundled Scientific Libraries](#pre-bundled-scientific-libraries)
- [User-installed Modules](#user-installed-modules)
- [Loading Modules](#loading-modules)
- [Module Resolution](#module-resolution)
- [Troubleshooting](#troubleshooting)

## Module Availability

NotebookJS provides modules in two ways:

### 1. **Injected Global Variables** 
These modules are automatically available as global variables in all code cells - no `require()` needed.

### 2. **Require-Available Modules**
These modules are available via `require()` but are not injected as globals.

## Injected Global Variables

The following modules are automatically injected into the global scope of every code cell:

### Built-in Node.js Modules (Injected as Globals)

These Node.js built-in modules are available as global variables:

```javascript
// File system operations - fs is available globally
const files = fs.readdirSync('.');
exports.fileList = files;

// Path utilities - path is available globally  
exports.fullPath = path.join(__dirname, 'data.txt');

// Operating system info - os is available globally
exports.platform = os.platform();
exports.cpuCount = os.cpus().length;

// Cryptography - crypto is available globally
exports.hash = crypto.createHash('sha256').update('hello').digest('hex');

// URL and query string manipulation - available globally
exports.parsedUrl = url.parse('https://example.com/path?q=test');
exports.queryObj = querystring.parse('name=value&other=data');

// Other globals: util, zlib, stream, events, readline, etc.
exports.formatted = util.inspect({ complex: 'data' });
```

**Available Built-in Module Globals:**
- `fs` - File system operations
- `path` - File path utilities  
- `os` - Operating system utilities
- `crypto` - Cryptographic functionality
- `util` - Utility functions
- `url` - URL parsing
- `querystring` - Query string utilities
- `zlib` - Compression
- `stream` - Stream utilities
- `events` - Event emitter (also `EventEmitter` constructor)
- `buffer` - Buffer manipulation (also `Buffer` constructor)
- `readline` - Readline interface
- `worker_threads` - Worker threads
- `child_process` - Child processes
- `string_decoder` - String decoder (also `StringDecoder`)
- `punycode` - Punycode encoding
- `timers` - Timer functions
- `async_hooks` - Async hooks
- `assert` - Assertion functions
- `constants` - Node.js constants

### Pre-bundled Scientific Libraries (Injected as Globals)

These scientific libraries are available as global variables:

```javascript
// DataFrame operations - dfd (danfojs) is available globally
const df = new dfd.DataFrame({
    name: ['Alice', 'Bob', 'Charlie'],
    age: [25, 30, 35],
    salary: [50000, 60000, 70000]
});

exports.avgSalary = df['salary'].mean();
exports.filteredData = df.query(df['age'].gt(28));

// TensorFlow.js - tf is available globally (from danfojs)
const model = tf.sequential({
    layers: [
        tf.layers.dense({inputShape: [1], units: 1})
    ]
});

exports.model = model;
```

**Available Pre-bundled Library Globals:**
- `dfd` - Danfo.js DataFrame library (pre-loaded)
- `tf` - TensorFlow.js machine learning (from danfojs, pre-loaded)

## Pre-bundled Libraries (Require-Available)

These scientific and data libraries are available via `require()` but are **not** automatically injected as globals:

```javascript
// Mathematical computing - need to require
const math = require('mathjs');
exports.result = math.evaluate('sqrt(3^2 + 4^2)');
exports.matrix = math.matrix([[1, 2], [3, 4]]);

// Data visualization - need to require
const Plotly = require('plotly.js-dist-min');
const d3 = require('d3');

const trace = {
    x: [1, 2, 3, 4],
    y: [10, 11, 12, 13],
    type: 'scatter'
};

const plotDiv = createDiv({ style: 'width: 100%; height: 400px;' });
Plotly.newPlot(plotDiv.id, [trace], { title: 'My Plot' });
output(plotDiv);

// D3 for advanced visualizations
const svg = d3.create("svg")
    .attr("width", 400)
    .attr("height", 200);

// Utility libraries - need to require
const _ = require('lodash');
exports.grouped = _.groupBy(data, 'category');
exports.sorted = _.sortBy(data, 'timestamp');

// CSV parsing - need to require
const Papa = require('papaparse');
exports.csvData = Papa.parse(csvString, { header: true });

// Excel files - need to require
const XLSX = require('xlsx');
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

// HTTP requests - need to require
const axios = require('axios');
const fetch = require('node-fetch');
const response = await axios.get('https://api.example.com/data');
exports.apiData = response.data;

// Date/time - need to require
const moment = require('moment');
exports.now = moment().format('YYYY-MM-DD HH:mm:ss');
exports.tomorrow = moment().add(1, 'day').toDate();
```

**Pre-bundled Libraries (Require-Available):**
- `mathjs` - Mathematical functions and expressions
- `lodash` - Utility functions
- `moment` - Date/time manipulation
- `plotly.js-dist-min` - Interactive plotting
- `d3` - Data visualization toolkit
- `papaparse` - CSV parsing
- `xlsx` - Excel file handling
- `node-fetch` - HTTP requests
- `axios` - HTTP client

## Other Require-Available Modules

These modules are copied outside the ASAR archive and available via `require()`:
- `long` - Long integer arithmetic
- `seedrandom` - Seedable random number generator
- `typed-function` - Typed function dispatcher
- `decimal.js` - Decimal arithmetic
- `complex.js` - Complex number arithmetic
- `fraction.js` - Fraction arithmetic
- `javascript-natural-sort` - Natural sorting
- `escape-latex` - LaTeX escaping
- `tiny-emitter` - Minimal event emitter
- `@babel/runtime` - Babel runtime helpers

These modules are copied outside the ASAR archive for compatibility but require explicit `require()` calls to use.

## Built-in Node.js Modules

**Note:** All Node.js built-in modules are now available as injected globals (see above), but can still be loaded with `require()` if needed:

```javascript
// These work but are unnecessary since globals are available:
const fs = require('fs');        // Same as using global `fs`
const path = require('path');    // Same as using global `path`
const os = require('os');        // Same as using global `os`

// Prefer using the injected globals:
exports.platform = os.platform();    // ✅ Recommended
exports.files = fs.readdirSync('.');  // ✅ Recommended
```

You can install additional modules in your user data directory for use in notebooks.

### Installation Location

Modules should be installed in:
```
{User Data Directory}/node_modules/
```

To find your user data directory:

```javascript
// Get user data path
const userDataPath = process.env.APPDATA || 
                    process.env.HOME + '/.config' || 
                    os.homedir() + '/.config';
console.log('User data directory:', userDataPath);
```

### Installing Modules

1. **Navigate to user data directory**:
   ```bash
   cd "~/Library/Application Support/NotebookJS/node_modules"  # macOS
   cd "%APPDATA%/NotebookJS/node_modules"                      # Windows
   cd "~/.config/NotebookJS/node_modules"                      # Linux
   ```

2. **Install modules with npm**:
   ```bash
   npm install module-name
   ```

3. **Use in notebooks**:
   ```javascript
   const myModule = require('module-name');
   exports.result = myModule.someFunction();
   ```

### Example: Installing Custom Modules

```bash
# Install additional scientific computing modules
npm install numeric ml-matrix simple-statistics

# Install data visualization modules  
npm install chartjs-node-canvas

# Install utility modules
npm install ramda date-fns
```

Then use in code cells:

```javascript
// Use custom installed modules
const numeric = require('numeric');
const ml = require('ml-matrix');
const stats = require('simple-statistics');

// Linear algebra with numeric
exports.matrix = numeric.dot([[1, 2], [3, 4]], [[5], [6]]);

// Matrix operations with ml-matrix
exports.mlMatrix = new ml.Matrix([[1, 2], [3, 4]]);
exports.inverse = mlMatrix.inverse();

// Statistics
exports.mean = stats.mean([1, 2, 3, 4, 5]);
exports.stdDev = stats.standardDeviation([1, 2, 3, 4, 5]);
```

## Loading Modules

### Using Injected Globals (Recommended)

Node.js built-ins and some scientific libraries are available as global variables:

```javascript
// ✅ Use injected globals directly (Node.js built-ins + dfd/tf)
const df = new dfd.DataFrame(data);           // danfojs (injected)
const files = fs.readdirSync('.');             // fs (injected)
const hash = crypto.createHash('md5');         // crypto (injected)

// Export computed results
exports.processedData = df.head();
exports.fileCount = files.length;
```

### Using require() for Scientific Libraries

Most scientific libraries need explicit `require()`:

```javascript
// ✅ Use require() for scientific libraries (not injected as globals)
const math = require('mathjs');
const _ = require('lodash');
const d3 = require('d3');
const Plotly = require('plotly.js-dist-min');

const result = math.evaluate('2 + 3 * 4');
const grouped = _.groupBy(items, 'category');

// Export computed results
exports.calculation = result;
exports.groupedData = grouped;
```

### Module Availability Check

```javascript
// Check if an injected global is available
if (typeof dfd !== 'undefined') {
    exports.dataframe = new dfd.DataFrame(data);
} else {
    console.warn('Danfojs not available');
}

// Check if a require module exists
function hasModule(name) {
    try {
        require.resolve(name);
        return true;
    } catch {
        return false;
    }
}
}

// Use fallback if module not available
if (optionalModule) {
    exports.result = optionalModule.process(data);
} else {
    exports.result = fallbackProcessing(data);
}
```

## Module Resolution

NotebookJS resolves modules in this order:

1. **Cache check**: Previously loaded modules
2. **Built-in modules**: Node.js standard library
3. **Pre-bundled modules**: Application resources
4. **User modules**: User data directory
5. **System modules**: System-wide npm modules

### Checking Module Availability

```javascript
// Check if a module is available
function hasModule(name) {
    try {
        require.resolve(name);
        return true;
    } catch {
        return false;
    }
}

exports.hasDanfojs = hasModule('danfojs');
exports.hasTensorflow = hasModule('@tensorflow/tfjs');
exports.hasCustomModule = hasModule('my-custom-module');
```

### Listing Available Modules

```javascript
// Get list of available modules (if exposed by the system)
// Note: This may not work in all environments
try {
    const fs = require('fs');
    const path = require('path');
    
    // List user-installed modules
    const userModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(userModulesPath)) {
        exports.userModules = fs.readdirSync(userModulesPath)
            .filter(name => !name.startsWith('.'));
    }
} catch (error) {
    console.log('Cannot list modules:', error.message);
}
```

## Troubleshooting

### Common Issues

#### Module Not Found
```javascript
// Error: Cannot find module 'missing-module'
try {
    const missingModule = require('missing-module');
} catch (error) {
    console.error('Module loading failed:', error.message);
    console.log('Available alternatives:');
    console.log('- Check module name spelling');
    console.log('- Install in user data directory');
    console.log('- Use a pre-bundled alternative');
}
```

#### Version Conflicts
```javascript
// Check module version
try {
    const pkg = require('module-name/package.json');
    console.log(`Module version: ${pkg.version}`);
    exports.moduleVersion = pkg.version;
} catch (error) {
    console.log('Cannot determine module version');
}
```

#### Platform Compatibility
```javascript
// Some modules may have platform-specific builds
const os = require('os');
const platform = os.platform();

console.log(`Running on: ${platform}`);

if (platform === 'win32') {
    // Windows-specific module loading
} else if (platform === 'darwin') {
    // macOS-specific module loading  
} else {
    // Linux/other platform module loading
}
```

### Debugging Module Resolution

```javascript
// Debug module resolution
function debugRequire(moduleName) {
    try {
        const resolvedPath = require.resolve(moduleName);
        console.log(`✓ ${moduleName} resolved to: ${resolvedPath}`);
        return require(moduleName);
    } catch (error) {
        console.error(`✗ ${moduleName} failed: ${error.message}`);
        return null;
    }
}

// Test multiple modules
const modules = ['danfojs', 'lodash', 'mathjs', 'custom-module'];
exports.moduleStatus = modules.map(name => ({
    name,
    available: debugRequire(name) !== null
}));
```

### Performance Considerations

```javascript
// Cache expensive module imports
let cachedModule;
function getExpensiveModule() {
    if (!cachedModule) {
        console.log('Loading expensive module...');
        cachedModule = require('expensive-module');
    }
    return cachedModule;
}

exports.expensiveResult = getExpensiveModule().process(data);
```

## Best Practices

1. **Use injected globals first**: Prefer the injected global variables over `require()` when available
2. **Check global availability**: Use `typeof variable !== 'undefined'` to check if globals exist
3. **Handle errors gracefully**: Wrap `require()` calls in try-catch for optional modules
4. **Export for reuse**: Make computed results available to other cells via `exports`
5. **Keep it simple**: Use the globals directly instead of reassigning them to constants
6. **Document dependencies**: Comment which modules your cells depend on

### Examples of Best Practices

```javascript
// ✅ Good: Use injected globals directly
if (typeof dfd !== 'undefined') {
    const df = new dfd.DataFrame(data);
    exports.processedData = df.head(); // Export computed results, not the global
}

// ✅ Good: Mix globals with require for non-injected modules  
const customLib = require('my-custom-library');
const result = math.multiply(matrix1, matrix2);  // math is global
exports.result = customLib.process(result);

// ❌ Avoid: Unnecessary require for injected modules
const fs = require('fs');  // fs is already global
const _ = require('lodash'); // _ is already global

// ❌ Avoid: Re-exporting globals unnecessarily  
exports.dfd = dfd;       // dfd is already available globally
exports.math = math;     // math is already available globally
exports.fs = fs;         // fs is already available globally

// ✅ Good: Direct global usage with meaningful exports
const files = fs.readdirSync('.');
const sorted = _.sortBy(data, 'timestamp');
exports.fileList = files;        // Export the computed result
exports.sortedData = sorted;     // Export the computed result
```

This comprehensive module system makes NotebookJS a powerful platform for data science, analysis, and general computation tasks. The combination of injected globals for common modules and require() for specialized modules provides both convenience and flexibility.

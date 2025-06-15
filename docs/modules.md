# Module System Guide

NotebookJS provides a comprehensive module system that allows you to use Node.js modules, scientific computing libraries, and custom modules in your code cells. This guide explains what modules are available and how to use them.

## Table of Contents

- [Module Categories](#module-categories)
- [Standard Node.js Modules](#standard-nodejs-modules)
- [Pre-bundled Scientific Libraries](#pre-bundled-scientific-libraries)
- [User-installed Modules](#user-installed-modules)
- [Loading Modules](#loading-modules)
- [Module Resolution](#module-resolution)
- [Troubleshooting](#troubleshooting)

## Module Categories

NotebookJS supports three categories of modules:

### 1. Standard Node.js Modules
All built-in Node.js modules are available automatically.

### 2. Pre-bundled Scientific Libraries
Data science and visualization libraries shipped with the application.

### 3. User-installed Modules
Custom modules you install in your user data directory.

## Standard Node.js Modules

All Node.js built-in modules are available without installation:

```javascript
// File system operations
const fs = require('fs');
const path = require('path');

// Cryptography
const crypto = require('crypto');
exports.hash = crypto.createHash('sha256').update('hello').digest('hex');

// Operating system utilities
const os = require('os');
exports.platform = os.platform();
exports.cpuCount = os.cpus().length;

// URL and query string manipulation
const url = require('url');
const querystring = require('querystring');

// Events and streams
const events = require('events');
const stream = require('stream');

// Utilities
const util = require('util');
exports.formattedData = util.inspect({ complex: { nested: 'data' } });

// Process information
exports.nodeVersion = process.version;
exports.workingDirectory = process.cwd();
```

### Available Built-in Modules

- `fs` - File system operations
- `path` - File path utilities
- `os` - Operating system utilities
- `crypto` - Cryptographic functionality
- `url` - URL parsing
- `querystring` - Query string utilities
- `events` - Event emitter
- `stream` - Stream utilities
- `buffer` - Buffer manipulation
- `util` - Utility functions
- `process` - Process information and control

## Pre-bundled Scientific Libraries

These modules are included with NotebookJS and available immediately:

### Data Manipulation

```javascript
// Danfo.js - DataFrame library (main data manipulation tool)
const dfd = require('danfojs');

// Create DataFrames
exports.df = new dfd.DataFrame({
    name: ['Alice', 'Bob', 'Charlie'],
    age: [25, 30, 35],
    salary: [50000, 60000, 70000]
});

// Data operations
exports.avgSalary = df['salary'].mean();
exports.filteredData = df.query(df['age'].gt(28));

// Lodash - Utility library
const _ = require('lodash');
exports.grouped = _.groupBy(data, 'category');
exports.sorted = _.sortBy(data, 'timestamp');
```

### Mathematical Computing

```javascript
// Math.js - Extended mathematical functions
const math = require('mathjs');

exports.matrix = math.matrix([[1, 2], [3, 4]]);
exports.result = math.evaluate('sqrt(3^2 + 4^2)');
exports.stats = math.std([1, 2, 3, 4, 5]);

// Complex number operations
exports.complex = math.complex(2, 3);
exports.result = math.multiply(complex, math.complex(1, -1));
```

### Data Visualization

```javascript
// Plotly.js - Interactive plotting
const plotly = require('plotly.js-dist-min');

// Create interactive plots
const trace = {
    x: [1, 2, 3, 4],
    y: [10, 11, 12, 13],
    type: 'scatter'
};

const layout = {
    title: 'My Plot',
    xaxis: { title: 'X Axis' },
    yaxis: { title: 'Y Axis' }
};

// Render to DOM using best practices
const plotDiv = createDiv({
    style: 'width: 100%; height: 400px;'
});

plotly.newPlot(plotDiv.id, [trace], layout); // Use auto-generated ID

// Use output() to display the plot
output(plotDiv);
exports.plotElement = plotDiv;
```

### Data I/O

```javascript
// Papa Parse - CSV parsing
const Papa = require('papaparse');

// Parse CSV data
const csvData = `name,age,city
Alice,25,New York
Bob,30,San Francisco`;

exports.parsedData = Papa.parse(csvData, { header: true });

// XLSX - Excel file handling
const XLSX = require('xlsx');

// Create workbook
const ws = XLSX.utils.json_to_sheet([
    { Name: 'Alice', Age: 25 },
    { Name: 'Bob', Age: 30 }
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'People');

exports.workbook = wb;
```

### Complete List of Pre-bundled Modules

#### Data Science Core
- `danfojs` - Primary DataFrame library
- `mathjs` - Mathematical functions and expressions
- `lodash` - Utility functions
- `moment` - Date/time manipulation

#### Data I/O
- `papaparse` - CSV parsing
- `xlsx` - Excel file handling
- `node-fetch` - HTTP requests
- `axios` - HTTP client

#### Visualization
- `plotly.js-dist-min` - Interactive plotting
- `d3` - Data visualization toolkit

#### TensorFlow (if available)
- `@tensorflow/tfjs` - Machine learning
- `@tensorflow/tfjs-node` - Node.js backend

## User-installed Modules

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

### Basic Require

```javascript
// Standard syntax
const moduleName = require('module-name');

// Destructuring
const { specificFunction } = require('module-name');

// Aliasing
const alias = require('long-module-name');
```

### Module Aliases

Some modules have convenient aliases:

```javascript
// These are equivalent
const tf1 = require('@tensorflow/tfjs-node');
const tf2 = require('tensorflow');  // Alias

// Export for use in other cells
exports.tensorflow = tf1;
```

### Error Handling

```javascript
// Handle missing modules gracefully
let optionalModule;
try {
    optionalModule = require('optional-module');
    exports.hasOptionalModule = true;
} catch (error) {
    console.warn('Optional module not available:', error.message);
    exports.hasOptionalModule = false;
    optionalModule = null;
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

1. **Import at the top**: Load modules at the beginning of cells
2. **Handle errors**: Always wrap requires in try-catch for optional modules
3. **Cache modules**: Store frequently used modules in variables
4. **Check availability**: Verify modules exist before using advanced features
5. **Export modules**: Make loaded modules available to other cells when needed
6. **Use aliases**: Create convenient aliases for long module names

This comprehensive module system makes NotebookJS a powerful platform for data science, analysis, and general computation tasks.

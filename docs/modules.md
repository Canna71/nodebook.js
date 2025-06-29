# Module System Guide

Nodebook.js provides a comprehensive module system that allows you to use Node.js modules, scientific computing libraries, and custom modules in your code cells. This guide explains what modules are available and how to use them.

## New: Per-Notebook Module Resolution

**🎉 New Feature**: Nodebook.js now supports per-notebook module resolution! Each notebook can have its own `node_modules` directory with packages specific to that notebook's needs.

👉 **[Read the full Per-Notebook Modules Guide](./per-notebook-modules.md)** for detailed setup instructions and examples.

**Quick Start:**
1. Create a `node_modules` directory in the same folder as your notebook
2. Install packages: `npm install lodash moment`
3. Use in your notebook: `const _ = require('lodash');`

## Table of Contents

- [Per-Notebook Module Resolution (NEW)](#new-per-notebook-module-resolution)
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

Nodebook.js provides modules in two ways:

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

// Plotly.js - Plotly is available globally
const trace = {
    x: [1, 2, 3, 4],
    y: [10, 11, 12, 13],
    type: 'scatter'
};

const plotDiv = createDiv({ style: 'width: 100%; height: 400px;' });
Plotly.newPlot(plotDiv.id, [trace], { title: 'My Plot' });
output(plotDiv);

// Math.js - math is available globally
exports.calculation = math.evaluate('sqrt(3^2 + 4^2)');
exports.matrix = math.matrix([[1, 2], [3, 4]]);
exports.complexNum = math.evaluate('(2 + 3i) * (1 - 2i)');
exports.unitConversion = math.evaluate('5 km + 3 miles');
exports.bigNumber = math.bignumber('1').div(3); // Precision arithmetic
```

**Available Pre-bundled Library Globals:**
- `dfd` - Danfo.js DataFrame library (pre-loaded)
- `tf` - TensorFlow.js machine learning (from danfojs, pre-loaded)
- `Plotly` - Interactive plotting library (pre-loaded)
- `math` - Math.js mathematical functions and expressions (pre-loaded)

## Shell Scripting with zx

The `zx` library is preloaded and all its globals are automatically injected, providing a powerful shell scripting environment:

### Core Shell Execution

```javascript
// Execute shell commands (always async)
const result = await $`ls -la`;
const files = await $`find . -name "*.js"`;

// Synchronous execution
const currentDir = $.sync`pwd`;

// Command options
const output = await $({nothrow: true})`exit 1`; // Don't throw on error
const result = await $({timeout: '5s'})`long-running-command`;
const piped = await $({input: 'hello'})`cat`; // Pipe input
```

### Directory and Context Management

```javascript
// Change working directory (affects all subsequent $ calls)
cd('/tmp');
await $`pwd`; // => /tmp

// Create isolated context
await within(async () => {
    $.cwd = '/different/path';
    const files = await $`ls`; // Uses /different/path
    // Context restored after block
});

// Keep process.cwd() in sync (optional performance overhead)
syncProcessCwd();
```

### Input/Output Operations

```javascript
// Interactive prompts
const name = await question('What is your name? ');
const choice = await question('Select option:', {
    choices: ['A', 'B', 'C']
});

// Enhanced logging (handles ProcessOutput)
echo`Current branch: ${await $`git branch --show-current`}`;
echo('Simple message');

// Read from stdin
const input = await stdin();
const data = JSON.parse(input);
```

### File System Operations

```javascript
// File globbing
const jsFiles = await glob('**/*.js');
const configs = await glob(['*.json', '*.yaml']);

// Enhanced file system (fs-extra)
const pkg = await fs.readJson('package.json');
await fs.writeJson('output.json', data, {spaces: 2});
await fs.copy('src', 'dist');

// Path utilities
const fullPath = path.join(os.homedir(), 'projects');
const relative = path.relative(process.cwd(), fullPath);
```

### Process and System Management

```javascript
// Find executables
const gitPath = await which('git');
const nodePath = await which('node', {nothrow: true}); // null if not found

// Process management
const processes = await ps.lookup({command: 'node'});
const tree = await ps.tree({pid: 123, recursive: true});
await kill(123, 'SIGTERM');

// Temporary files and directories
const tempDir = tmpdir(); // /tmp/zx-random/
const tempFile = tmpfile('data.json', JSON.stringify(data));
const executable = tmpfile('script.sh', '#!/bin/bash\necho hello', 0o744);
```

### Utilities and Formatting

```javascript
// Terminal styling
echo(chalk.blue('Info:'), chalk.green('Success!'));
echo(chalk.red.bold('Error:'), chalk.yellow('Warning'));

// Command line arguments
if (argv.verbose) {
    echo('Verbose mode enabled');
}

// Custom argument parsing
const args = minimist(process.argv.slice(2), {
    boolean: ['force', 'help'],
    alias: {h: 'help'}
});

// HTTP requests with enhanced fetch
const response = await fetch('https://api.github.com/user');
const data = await response.json();

// Pipe fetch response
await fetch('https://example.com/data.json').pipe($`jq '.'`);
```

### Error Handling and Reliability

```javascript
// Retry with backoff
const result = await retry(5, async () => {
    return await $`curl https://flaky-api.com/data`;
});

// Retry with custom delay
const data = await retry(10, '2s', async () => {
    return await fetch('https://api.example.com/data');
});

// Exponential backoff
const response = await retry(20, expBackoff(), async () => {
    return await $`wget https://large-file.com/data.zip`;
});

// Progress indication
await spinner('Downloading...', async () => {
    await $`wget https://example.com/large-file.zip`;
});

// Custom spinner message
await spinner(() => $`npm install`);
```

### Environment and Configuration

```javascript
// Environment variables
dotenv.config('.env'); // Load .env file
const env = dotenv.load('.env'); // Load without setting process.env
const parsed = dotenv.parse('FOO=bar\nBAZ=qux');

// Run with custom environment
await $({env: {NODE_ENV: 'production'}})`node script.js`;

// Shell configuration
useBash(); // Use bash shell and bash quoting
usePowerShell(); // Switch to PowerShell
usePwsh(); // Use PowerShell 7+

// String quoting
const bashQuoted = quote('$HOME/file with spaces');
const pwshQuoted = quotePowerShell('$env:HOME\\file with spaces');
```

### Data Formats

```javascript
// YAML processing
const config = YAML.parse(await fs.readFile('config.yaml', 'utf8'));
const yamlString = YAML.stringify({key: 'value', list: [1, 2, 3]});

// Timing operations
await sleep(1000); // Wait 1 second
await sleep('2s'); // Wait 2 seconds
```

### Complete zx Globals Reference

| Global | Type | Description | Example |
|--------|------|-------------|---------|
| `$` | function | Execute shell commands | `await $\`ls -la\`` |
| `cd` | function | Change directory | `cd('/tmp')` |
| `within` | function | Create async context | `within(async () => {})` |
| `question` | function | Interactive prompts | `await question('Name?')` |
| `echo` | function | Enhanced console.log | `echo\`Hello ${name}\`` |
| `stdin` | function | Read stdin | `await stdin()` |
| `sleep` | function | Wait/delay | `await sleep(1000)` |
| `glob` | function | File pattern matching | `await glob('**/*.js')` |
| `which` | function | Find executable | `await which('git')` |
| `fs` | object | File system (fs-extra) | `fs.readJson('package.json')` |
| `os` | object | OS utilities | `os.homedir()` |
| `path` | object | Path utilities | `path.join(a, b)` |
| `minimist` | function | Argument parser | `minimist(process.argv.slice(2))` |
| `argv` | object | Parsed arguments | `argv.verbose` |
| `chalk` | object | Terminal styling | `chalk.blue('text')` |
| `YAML` | object | YAML parser | `YAML.parse(str)` |
| `fetch` | function | HTTP requests | `await fetch(url)` |
| `retry` | function | Retry with backoff | `retry(5, () => action())` |
| `spinner` | function | CLI spinner | `spinner('msg', () => task())` |
| `ps` | object | Process listing | `ps.lookup({command: 'node'})` |
| `kill` | function | Kill process | `kill(pid, 'SIGTERM')` |
| `tmpdir` | function | Temp directory | `tmpdir('subdir')` |
| `tmpfile` | function | Temp file | `tmpfile('name.txt', content)` |
| `dotenv` | object | Environment vars | `dotenv.config('.env')` |
| `quote` | function | Bash quoting | `quote('$HOME/path')` |
| `quotePowerShell` | function | PowerShell quoting | `quotePowerShell('$env:HOME')` |
| `useBash` | function | Enable bash | `useBash()` |
| `usePowerShell` | function | Enable PowerShell | `usePowerShell()` |
| `usePwsh` | function | Enable pwsh | `usePwsh()` |
| `syncProcessCwd` | function | Sync process.cwd() | `syncProcessCwd()` |

### Best Practices

1. **Always use `await`** with shell commands: `await $\`command\``
2. **Handle errors** with `nothrow` option for unreliable commands
3. **Use `within()`** for isolated contexts instead of changing global state
4. **Prefer `tmpdir()`/`tmpfile()`** over hardcoded temp paths
5. **Use `which()` with `nothrow`** to check if commands exist
6. **Enable `syncProcessCwd()`** only if you need process.cwd() sync (performance cost)

## Pre-bundled Libraries (Require-Available)

These scientific and data libraries are available via `require()` but are **not** automatically injected as globals:

```javascript
// Mathematical computing - now available globally as 'math'
exports.result = math.evaluate('sqrt(3^2 + 4^2)');
exports.matrix = math.matrix([[1, 2], [3, 4]]);

// You can still require it if needed for compatibility:
const mathjs = require('mathjs');
console.log('Both are the same:', math === mathjs);

// Data visualization with D3 - need to require
const d3 = require('d3');

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
- `lodash` - Utility functions
- `moment` - Date/time manipulation
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
   cd "~/Library/Application Support/Nodebook.js/node_modules"  # macOS
   cd "%APPDATA%/Nodebook.js/node_modules"                      # Windows
   cd "~/.config/Nodebook.js/node_modules"                      # Linux
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
// ✅ Use injected globals directly (Node.js built-ins + scientific libraries)
const df = new dfd.DataFrame(data);           // danfojs (injected)
const files = fs.readdirSync('.');             // fs (injected)  
const hash = crypto.createHash('md5');         // crypto (injected)

// Create a plot using the global Plotly
const trace = {
    x: [1, 2, 3, 4],
    y: [2, 4, 6, 8],
    type: 'scatter'
};
const plotDiv = createDiv({ style: 'width: 100%; height: 400px;' });
Plotly.newPlot(plotDiv.id, [trace], { title: 'Sample Plot' });
output(plotDiv);

// Export computed results  
exports.processedData = df.head();
exports.fileCount = files.length;
```

### Using require() for Other Scientific Libraries

Some scientific libraries still need explicit `require()`:

```javascript
// ✅ Use require() for libraries not injected as globals
const math = require('mathjs');
const _ = require('lodash');
const d3 = require('d3');

const result = math.evaluate('2 + 3 * 4');
const grouped = _.groupBy(items, 'category');

// Export computed results
exports.calculation = result;
exports.groupedData = grouped;
```

### Module Availability Check

```javascript
// Check if injected globals are available
if (typeof dfd !== 'undefined') {
    exports.dataframe = new dfd.DataFrame(data);
} else {
    console.warn('Danfojs not available');
}

if (typeof Plotly !== 'undefined') {
    const plotDiv = createDiv();
    Plotly.newPlot(plotDiv.id, [{x: [1,2,3], y: [1,4,9], type: 'scatter'}]);
    output(plotDiv);
} else {
    console.warn('Plotly not available');
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

Nodebook.js resolves modules using a priority-based system. As of the latest version, the resolution order is:

### Priority Order (Highest to Lowest)

1. **Notebook-specific node_modules** 🆕 - Modules installed in the notebook's directory
2. **Cache check** - Previously loaded modules in memory
3. **Built-in modules** - Node.js standard library (fs, path, crypto, etc.)
4. **Pre-bundled modules** - Application resources (danfojs, plotly, etc.)
5. **User data modules** - User-installed global modules
6. **System modules** - System-wide npm modules

### Per-Notebook Module Resolution 🆕

The highest priority goes to modules installed in the same directory as your notebook:

```
my-notebook-project/
├── my-notebook.nbjs       # Your notebook
├── package.json           # Dependencies
└── node_modules/          # Notebook-specific modules (highest priority)
    ├── lodash/
    ├── moment/
    └── axios/
```

**Benefits:**
- **Isolation**: Each notebook can use different package versions
- **Reproducibility**: Dependencies travel with the notebook
- **Flexibility**: Install packages only where needed

👉 **[Full Per-Notebook Modules Guide](./per-notebook-modules.md)**

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

### Per-Notebook Module Issues 🆕

**Module not found despite being installed:**
```javascript
// Debug notebook module paths
const { moduleRegistry } = require('@/Engine/ModuleRegistry');
const debugInfo = moduleRegistry.getDebugInfo();

console.log('Notebook module paths:', debugInfo.notebookModulePaths);
console.log('Total paths:', debugInfo.nodeRequirePaths.length);
console.log('NODE_PATH:', debugInfo.nodePathEnv);

// Check if module exists in notebook directory
const fs = require('fs');
const path = require('path');
const modulePath = path.join(process.cwd(), 'node_modules', 'your-module');
console.log('Module exists locally:', fs.existsSync(modulePath));
```

**Module conflicts between notebook and global:**
```javascript
// Check which version is being loaded
const pkg = require('your-module');
console.log('Module version:', pkg.version || 'unknown');

// Check module path
console.log('Module path:', require.resolve('your-module'));
```

**Installing packages in notebook directory:**
```javascript
// Method 1: Using zx (if available)
try {
  await $`cd ${process.cwd()} && npm install your-package`;
  console.log('Package installed successfully');
} catch (error) {
  console.error('Installation failed:', error.message);
}

// Method 2: Using child_process
const { spawn } = require('child_process');
const npm = spawn('npm', ['install', 'your-package'], { 
  cwd: process.cwd(),
  stdio: 'inherit' 
});
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

This comprehensive module system makes Nodebook.js a powerful platform for data science, analysis, and general computation tasks. The combination of injected globals for common modules and require() for specialized modules provides both convenience and flexibility.

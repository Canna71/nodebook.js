# Code Cells Guide

Code cells in Nodebook.js provide a powerful JavaScript execution environment with reactive capabilities, DOM manipulation, and module support. This guide covers everything you can do in a code cell.

## Table of Contents

- [Basic JavaScript Execution](#basic-javascript-execution)
- [Shell Integration](#shell-integration)
- [Cell Execution Behavior](#cell-execution-behavior)
- [Static Code Cells](#static-code-cells)
- [Reactive Values and Exports](#reactive-values-and-exports)
- [Accessing Other Variables](#accessing-other-variables)
- [Console Output](#console-output)
- [Tabular Output](#tabular-output)
- [DOM Output and Visualization](#dom-output-and-visualization)
- [Module System](#module-system)
- [Available Functions and Globals](#available-functions-and-globals)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Basic JavaScript Execution

Code cells execute standard JavaScript with full ES6+ support:

```javascript
// Variables and functions
const message = "Hello, Nodebook.js!";
let counter = 0;

function increment() {
    return ++counter;
}

// All JavaScript features work
const data = [1, 2, 3, 4, 5];
const doubled = data.map(x => x * 2);
console.log("Doubled:", doubled);
```

## Cell Execution Behavior

### Manual Execution Required

**Important**: After editing any code cell, you must **manually execute it** to run the new code and trigger the reactive chain.

```javascript
// 1. Edit this code
exports.data = { A: [1, 2, 3], B: [10, 20, 30] };

// 2. Click the ▶️ button or press Shift+Enter to execute

// 3. Dependent cells will automatically re-execute
```

### Why Manual Execution?

Code cells don't automatically re-execute when you edit them for several important reasons:

- **Performance**: Prevents expensive computations from running on every keystroke
- **Control**: You decide when potentially long-running code should execute
- **Safety**: Avoids running incomplete or buggy code accidentally
- **Debugging**: Allows you to edit multiple cells before executing

### Reactive Chain Execution

Once you manually execute a cell:

1. **Cell executes** with your new code
2. **Exports update** in the reactive system
3. **Dependent cells automatically re-execute** in the correct order
4. **Results propagate** throughout the notebook

```javascript
// Cell 1: Manual execution required after editing
exports.baseValue = 10;

// Cell 2: Automatically re-executes when Cell 1 runs
exports.doubled = baseValue * 2;

// Cell 3: Automatically re-executes when Cell 2 updates
exports.final = doubled + 5;
```

This design ensures you have full control over when code runs while still maintaining the reactive benefits of automatic dependency updates.

## Static Code Cells

Static code cells provide a way to disable reactive behavior for specific cells, giving you complete manual control over execution.

### What Are Static Code Cells?

Static code cells are regular code cells that have been switched to "static mode":

- **Manual execution only**: They don't automatically execute when dependencies change
- **No automatic initialization**: They don't run when the notebook loads
- **Can read reactive variables**: They can access variables from other cells
- **Can write to reactive store**: They can export variables for other cells to use
- **Side effect safe**: Perfect for cells with important side effects or runbook-style operations

### When to Use Static Cells

Static code cells are ideal for:

```javascript
// Database operations that should only run when explicitly triggered
const db = require('sqlite3');
exports.executeQuery = async (query) => {
    // This should only run when manually executed
    return await db.run(query);
};
```

```javascript
// File system operations
const fs = require('fs');
// Only write to file when explicitly triggered
fs.writeFileSync('output.json', JSON.stringify(myData, null, 2));
```

```javascript
// Expensive computations that you want to control
// This might be a long-running ML training operation
const result = await trainModel(dataset);
exports.trainedModel = result;
```

### How to Enable Static Mode

1. **Edit the cell**: Click on a code cell to enter edit mode
2. **Find the static toggle**: Below the code editor, you'll see a checkbox labeled "Static mode (manual execution only)"
3. **Toggle static mode**: Check the box to make the cell static
4. **Apply changes**: The cell will show an orange border indicating it's in static mode

### Visual Indicators

Static code cells have distinct visual styling:
- **Orange border**: Static cells have an orange border instead of the default border
- **Orange background tint**: Subtle orange background to distinguish from reactive cells
- **Static badge**: When toggled on, a small "Static" badge appears next to the checkbox

### Behavior Differences

| Reactive Cells | Static Cells |
|----------------|--------------|
| Auto-execute on dependency changes | Manual execution only |
| Auto-execute on notebook load | Skip initialization |
| Immediate reactive participation | Isolated execution |
| Standard border/background | Orange border/background |

### Example Usage

```javascript
// Reactive cell - runs automatically
exports.currentTime = new Date().toISOString();
exports.counter = (counter || 0) + 1;
```

```javascript
// Static cell - runs only when manually executed
// Perfect for logging or side effects
console.log(`Snapshot taken at ${currentTime}`);
console.log(`This has been executed ${counter} times`);

// Save snapshot to file
require('fs').writeFileSync('snapshot.json', JSON.stringify({
    time: currentTime,
    count: counter,
    data: myData
}, null, 2));
```

### Best Practices

1. **Use for side effects**: Database writes, file operations, network requests
2. **Use for expensive operations**: Long-running computations you want to control
3. **Use for debugging**: Cells that print detailed debug information
4. **Use for runbooks**: Step-by-step operational procedures
5. **Keep reactive for data flow**: Use reactive cells for data processing pipelines

### Converting Between Modes

You can freely switch between reactive and static modes:

- **Reactive → Static**: Cell stops auto-executing, keeps current state
- **Static → Reactive**: Cell remains dormant until manually executed, then rejoins reactive system

**Note**: When switching from static to reactive, the cell won't automatically execute - you need to run it manually first to rejoin the reactive chain.

## Output Methods and Visualization

Nodebook.js provides several specialized output methods for different types of data. **Avoid creating DOM elements directly** - use the appropriate output method for your data type.

### ⚠️ Important: Use Proper Output Methods

**Don't create DOM elements for data display!** Nodebook.js has better alternatives:

- **Simple formatted output** → Use markdown cells with interpolations
- **Tabular data** → Use `output.table(data)`
- **DataFrames/Series** → Use `output(dataframe)` for grid rendering
- **Objects/Arrays** → Use `output(object)` for interactive JSON view
- **Charts** → Use library integration (Plotly, D3) when they require a DOM container

### Data Output Methods

#### Tabular Data with `output.table()`

For displaying tabular data, use the dedicated table output function:

```javascript
const salesData = [
    { Product: 'Widget A', Sales: 1000, Revenue: 50000 },
    { Product: 'Widget B', Sales: 750, Revenue: 37500 },
    { Product: 'Widget C', Sales: 1200, Revenue: 60000 }
];

// ✅ Correct: Use output.table() for tabular data
output.table(salesData);

// ❌ Don't create DOM tables manually
```

#### Object/Array Display with `output()`

For objects, arrays, and complex data structures:

```javascript
const userData = {
    name: 'Alice Johnson',
    age: 30,
    preferences: ['coding', 'reading', 'hiking'],
    stats: { logins: 145, lastActive: '2024-01-15' }
};

// ✅ Correct: Direct output renders with interactive JSON viewer
output(userData);

// ❌ Don't create DOM elements to display objects
```

#### DataFrame/Series Rendering

For pandas-like data structures:

```javascript
// Assuming you have a DataFrame-like object
const df = createDataFrame(salesData);

// ✅ Correct: Direct output renders as interactive grid
output(df);

// ❌ Don't manually create tables for DataFrames
```

#### Formatted Text Output

For rich formatted output, use **markdown cells with interpolations** instead of HTML:

```javascript
// ✅ Correct: Export data for markdown interpolation
exports.totalSales = 147500;
exports.growth = 12.5;
exports.topProduct = 'Widget C';
```

Then create a markdown cell with:
```markdown
## Sales Report

- **Total Sales**: ${{totalSales.toLocaleString()}}
- **Growth Rate**: {{growth}}%
- **Top Product**: {{topProduct}}

### Performance Summary
{{growth > 10 ? '🚀 Excellent growth!' : '📈 Steady progress'}}
```

### Library Integration (When DOM Elements Are Needed)

DOM helpers should **only** be used when integrating with libraries that require a DOM container:

#### Plotly Integration (Recommended)

```javascript
// Plotly is available globally and works with containers
const data = [{
    x: ['Jan', 'Feb', 'Mar', 'Apr'],
    y: [20, 14, 23, 25],
    type: 'scatter',
    mode: 'lines+markers'
}];

// Create container for Plotly (this is when DOM helpers are appropriate)
const plotContainer = createDiv({
    id: 'sales-chart',
    style: 'width: 100%; height: 400px;'
});
output(plotContainer);

// Initialize Plotly in the container
Plotly.newPlot('sales-chart', data, { title: 'Monthly Sales' });
```

#### D3.js Integration

```javascript
// Only create DOM elements when D3 requires a container
const svgContainer = createDiv({
    innerHTML: '<svg id="d3-viz" width="400" height="300"></svg>'
});
output(svgContainer);

// Use D3 to manipulate the SVG
const svg = d3.select('#d3-viz');
// ... D3 visualization code ...
```

#### Chart.js Integration

```javascript
// Create canvas element for Chart.js
const chartContainer = createDiv({
    innerHTML: '<canvas id="myChart" width="400" height="200"></canvas>'
});
output(chartContainer);

// Initialize chart
const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'bar',
    data: { /* chart data */ }
});
```

### DOM Helper Functions Reference (Library Integration Only)

**⚠️ Important**: These functions should only be used for library integration, not for general data display.

#### When to Use DOM Helpers

✅ **Appropriate uses**:
- Creating containers for Plotly charts
- Setting up canvas elements for Chart.js
- Preparing SVG containers for D3.js
- Integrating with other visualization libraries that require DOM elements

❌ **Avoid using for**:
- Displaying data (use `output()`, `output.table()`, or markdown instead)
- Creating text content (use markdown cells)
- Showing objects/arrays (use direct `output()`)
- Building dashboards (use markdown + data exports)

#### Core DOM Functions

##### `createDiv(options)` - For Library Containers

```javascript
// ✅ Correct: Container for Plotly
const plotDiv = createDiv({
    id: 'plot-container',
    style: 'width: 100%; height: 400px;'
});
output(plotDiv);
Plotly.newPlot('plot-container', data, layout);

// ❌ Wrong: Don't use for data display
const dataDiv = createDiv({
    innerHTML: '<h3>Sales Data</h3><p>Total: $50,000</p>'
});
```

##### `createElement(tag, options)` - For Specific Elements

```javascript
// ✅ Correct: Canvas for Chart.js
const canvas = createElement('canvas', {
    id: 'chart-canvas',
    attributes: { width: '400', height: '300' }
});
output(canvas);

// ❌ Wrong: Don't create HTML for data
const dataElement = createElement('div', {
    innerHTML: '<ul><li>Item 1</li><li>Item 2</li></ul>'
});
```

#### Advanced DOM Access (Library Integration)

##### `outEl` - Direct Container Access

```javascript
// ✅ Correct: Complex library integration
if (outEl) {
    // Some libraries need direct DOM manipulation
    const customVizContainer = document.createElement('div');
    customVizContainer.id = 'custom-visualization';
    outEl.appendChild(customVizContainer);
    
    // Initialize complex library
    SomeVisualizationLibrary.init('#custom-visualization', data);
}

// ❌ Wrong: Don't use for simple data display
if (outEl) {
    const dataDiv = document.createElement('div');
    dataDiv.innerHTML = '<h3>Data Results</h3>';
    outEl.appendChild(dataDiv);
}
```

### Best Practices Summary

#### ✅ Recommended Approaches

```javascript
// For objects and complex data
const analysisResults = { revenue: 50000, growth: 12.5, trends: [...] };
output(analysisResults); // Interactive JSON viewer

// For tabular data
const salesData = [{ product: 'A', sales: 1000 }, ...];
output.table(salesData); // Sortable, searchable table

// For formatted reports - use markdown cells with interpolation
exports.totalRevenue = 50000;
exports.growthRate = 12.5;
exports.topProduct = 'Widget C';
// Then create markdown cell: "## Report\nRevenue: ${{totalRevenue.toLocaleString()}}"

// For charts requiring DOM containers
const chartDiv = createDiv({ id: 'chart', style: 'height: 400px;' });
output(chartDiv);
Plotly.newPlot('chart', data, layout);
```

#### ❌ Discouraged Approaches

```javascript
// ❌ Don't create HTML for data display
const htmlOutput = createDiv({
    innerHTML: `<h3>Results</h3><p>Revenue: $${revenue}</p>`
});

// ❌ Don't build tables manually
const table = createElement('table', {
    innerHTML: '<tr><th>Product</th><th>Sales</th></tr>...'
});

// ❌ Don't use auto-outputting containers for data
const dashboard = createContainer();
dashboard.appendChild(createTitle('Data Dashboard'));

// ❌ Don't create complex HTML structures for content
const complexHTML = createDiv({
    innerHTML: '<div class="card"><h3>Title</h3><p>Content</p></div>'
});
```

## Reactive Values and Exports

The reactive system in Nodebook.js allows cells to share data and automatically update when dependencies change. This is achieved through the `exports` object and variable access.

### Exporting Values

Use the `exports` object to make values available to other cells:

```javascript
// Export a simple value
exports.greeting = "Hello, Nodebook.js!";

// Export computed values
exports.numbers = [1, 2, 3, 4, 5];
exports.sum = numbers.reduce((a, b) => a + b, 0);

// Export functions
exports.multiply = (a, b) => a * b;

// Export objects
exports.config = {
    apiUrl: "https://api.example.com",
    timeout: 5000,
    retries: 3
};

// Export async functions
exports.fetchData = async (url) => {
    const response = await fetch(url);
    return response.json();
};
```

### Variable Naming Best Practices

```javascript
// ✅ Good: Clear, descriptive names
exports.salesData = rawData.filter(item => item.type === 'sale');
exports.monthlyRevenue = salesData.reduce((sum, sale) => sum + sale.amount, 0);
exports.growthRate = (monthlyRevenue - lastMonthRevenue) / lastMonthRevenue;

// ✅ Good: Consistent naming convention
exports.userCount = users.length;
exports.activeUserCount = users.filter(u => u.isActive).length;
exports.inactiveUserCount = userCount - activeUserCount;

// ❌ Avoid: Unclear or temporary names
exports.data = someProcessing(rawStuff);
exports.temp = data.map(x => x.thing);
exports.result = temp.filter(y => y.value > 0);
```

### Reactive Dependencies

The system automatically tracks which variables your cell depends on:

```javascript
// This cell depends on 'basePrice' and 'taxRate'
exports.totalPrice = basePrice * (1 + taxRate);
exports.displayPrice = `$${totalPrice.toFixed(2)}`;

// When basePrice or taxRate changes, this cell automatically re-executes
```

### Complex Reactive Patterns

```javascript
// Cell 1: Data source
exports.salesRawData = [
    { product: 'A', amount: 100, date: '2024-01-01' },
    { product: 'B', amount: 150, date: '2024-01-02' },
    { product: 'A', amount: 200, date: '2024-01-03' }
];

// Cell 2: Data processing (depends on salesRawData)
exports.salesByProduct = salesRawData.reduce((acc, sale) => {
    acc[sale.product] = (acc[sale.product] || 0) + sale.amount;
    return acc;
}, {});

// Cell 3: Visualization (depends on salesByProduct)
const chart = createDiv({
    innerHTML: Object.entries(salesByProduct)
        .map(([product, amount]) => `<div>${product}: $${amount}</div>`)
        .join('')
});
output(chart);

// If Cell 1 changes, Cell 2 and Cell 3 automatically update
```

## Accessing Other Variables

Access variables exported by other cells directly by name:

### Direct Variable Access

```javascript
// If another cell exports 'userData', you can use it directly
const userCount = userData.length;
const activeUsers = userData.filter(user => user.status === 'active');

// Use variables in calculations
const conversionRate = successfulOrders / totalVisitors;
const avgOrderValue = totalRevenue / successfulOrders;

// Chain dependencies
const projectedRevenue = avgOrderValue * projectedOrders * conversionRate;
exports.projectedRevenue = projectedRevenue;
```

### Conditional Access

```javascript
// Check if a variable exists before using it
if (typeof userData !== 'undefined' && userData.length > 0) {
    const analysis = analyzeUserData(userData);
    exports.userAnalysis = analysis;
} else {
    console.log('userData not available yet');
    exports.userAnalysis = { error: 'No data available' };
}
```

### Working with Async Dependencies

```javascript
// If a dependency is a Promise, you can await it
try {
    const data = await apiData; // If apiData is exported as a Promise
    const processed = processData(data);
    exports.processedData = processed;
} catch (error) {
    console.error('Failed to process async data:', error);
    exports.processedData = null;
}
```

## Console Output

Console output in code cells appears in a dedicated console section below the code editor.

### Basic Console Methods

```javascript
// Standard console methods
console.log('Information message');
console.warn('Warning message');
console.error('Error message');
console.info('Info message');

// Multiple arguments
console.log('User:', userData.name, 'Age:', userData.age);

// Formatted output
console.log(`Processing ${items.length} items...`);
```

### Structured Console Output

```javascript
// Objects and arrays
console.log('User data:', { 
    name: 'Alice', 
    age: 30, 
    preferences: ['coding', 'reading'] 
});

// Tables (great for data inspection)
console.table(salesData);

// Grouping related messages
console.group('Data Processing');
console.log('Step 1: Loading data...');
console.log('Step 2: Validating data...');
console.log('Step 3: Processing data...');
console.groupEnd();
```

### Debug and Performance Logging

```javascript
// Debug information
console.debug('Debug info:', { variable: someValue });

// Performance timing
console.time('data-processing');
const result = processLargeDataset(data);
console.timeEnd('data-processing'); // Shows elapsed time

// Stack traces for debugging
console.trace('Execution path');
```

### Console Best Practices

```javascript
// ✅ Good: Descriptive messages
console.log('Loading user data from API...');
console.log(`Processed ${count} records in ${time}ms`);

// ✅ Good: Use appropriate log levels
console.info('Process started successfully');
console.warn('Using fallback configuration');
console.error('Failed to connect to database');

// ✅ Good: Structured data inspection
console.table(userData.slice(0, 10)); // Show first 10 users
console.log('Summary:', { total, processed, errors });

// ❌ Avoid: Unclear messages
console.log('done');
console.log(x);
```

## Tabular Output

Nodebook.js provides specialized functions for displaying tabular data. **Always use `output.table()` for tabular data** instead of creating HTML tables manually.

### Primary Method: `output.table()`

The recommended way to display tabular data:

```javascript
const salesData = [
    { Product: 'Widget A', Sales: 1000, Revenue: 50000, Region: 'North' },
    { Product: 'Widget B', Sales: 750, Revenue: 37500, Region: 'South' },
    { Product: 'Widget C', Sales: 1200, Revenue: 60000, Region: 'East' },
    { Product: 'Widget D', Sales: 900, Revenue: 45000, Region: 'West' }
];

// ✅ Correct: Use output.table() for tabular data
output.table(salesData);
```

### Automatic Table Rendering

Arrays of objects exported from cells are automatically rendered as interactive tables:

```javascript
// This will render as a sortable, searchable table in the output
exports.salesData = [
    { Product: 'Widget A', Sales: 1000, Revenue: 50000, Region: 'North' },
    { Product: 'Widget B', Sales: 750, Revenue: 37500, Region: 'South' },
    { Product: 'Widget C', Sales: 1200, Revenue: 60000, Region: 'East' },
    { Product: 'Widget D', Sales: 900, Revenue: 45000, Region: 'West' }
];
```

### Data Processing for Tables

Process your data before displaying it in tables:

```javascript
// Process raw data for better display
const processedData = rawData.map(item => ({
    'Product Name': item.name,
    'Units Sold': item.quantity.toLocaleString(),
    'Revenue': `$${item.revenue.toLocaleString()}`,
    'Profit Margin': `${(item.profit / item.revenue * 100).toFixed(1)}%`,
    'Status': item.quantity > 1000 ? '✅ High Performance' : '⚠️ Needs Attention'
}));

// Display the processed data
output.table(processedData);
```

### ❌ Don't Create Manual Tables

Avoid creating HTML tables manually:

```javascript
// ❌ Wrong: Don't create HTML tables
const manualTable = createTable(salesData, {
    style: 'width: 100%; border-collapse: collapse;',
    headerStyle: 'background: #f8f9fa; font-weight: bold;',
    cellStyle: 'padding: 8px; border-bottom: 1px solid #ddd;'
});

// ❌ Wrong: Don't use createElement for tables
const htmlTable = createElement('table', {
    innerHTML: '<tr><th>Product</th><th>Sales</th></tr>...'
});
```

## Module System

Nodebook.js supports both built-in modules and custom module loading.

### Pre-loaded Global Modules

Several popular libraries are available globally without requiring:

```javascript
// Plotly for data visualization (globally available)
const trace = {
    x: [1, 2, 3, 4],
    y: [10, 11, 12, 13],
    type: 'scatter'
};

const plotDiv = createDiv({ id: 'my-plot', style: 'width: 100%; height: 400px;' });
output(plotDiv);

Plotly.newPlot('my-plot', [trace]);

// D3.js for advanced visualizations (if available)
// Math.js for mathematical operations (if available)
// Lodash for utility functions (if available)
```

### Using Require for Node.js Modules

```javascript
// File system operations
const fs = require('fs');
const path = require('path');

// Read a file
const data = fs.readFileSync('data.json', 'utf8');
const jsonData = JSON.parse(data);

// Write processed data
const output = processData(jsonData);
fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
```

### HTTP Requests

```javascript
// Using built-in fetch (browser environment)
const response = await fetch('https://api.example.com/data');
const data = await response.json();
exports.apiData = data;

// Or using require for Node.js HTTP
const https = require('https');
const axios = require('axios'); // If available

const apiResponse = await axios.get('https://api.example.com/data');
exports.externalData = apiResponse.data;
```

### Custom Module Pattern

```javascript
// Create reusable functions
exports.utils = {
    formatCurrency: (amount) => `$${amount.toLocaleString()}`,
    formatDate: (date) => new Date(date).toLocaleDateString(),
    calculateGrowth: (current, previous) => 
        ((current - previous) / previous * 100).toFixed(1) + '%'
};

// Use in other cells
const formatted = utils.formatCurrency(revenue);
const growth = utils.calculateGrowth(thisMonth, lastMonth);
```

## Available Functions and Globals

### ✅ Primary Output Methods (Use These)

```javascript
// For objects, arrays, and complex data structures
output(data)                   // Interactive JSON viewer with react-json-view

// For tabular data
output.table(arrayOfObjects)   // Sortable, searchable table

// For DataFrames and Series (if using pandas-like libraries)
output(dataframe)              // Interactive grid renderer

// For simple values and primitives
output(value)                  // Direct value display
```

### ⚠️ DOM Functions (Library Integration Only)

```javascript
// Use ONLY for visualization library integration
createDiv(options)             // Container for Plotly, D3, Chart.js
createElement(tag, options)    // Specific elements for libraries
outEl                         // Direct container access (advanced)

// ❌ Don't use these for general data display
```

### Data Processing

```javascript
// Available globally (preloaded)
math                         // Math.js mathematical functions and expressions
dfd                         // Danfo.js DataFrames
tf                          // TensorFlow.js machine learning
Plotly                      // Plotly.js interactive visualization

// Available via require()
const _ = require('lodash');        // Lodash utility functions  
const d3 = require('d3');          // D3.js for data manipulation

// Standard JavaScript
JSON.parse(), JSON.stringify()
Array methods: map, filter, reduce, forEach, etc.
Object methods: keys, values, entries, assign, etc.
```

### Async Functions

```javascript
// Promise and async/await support
async function processData() {
    const data = await fetchData();
    return processedData;
}

// Fetch API
fetch(url, options)
await response.json()
await response.text()

// Timeout utilities
setTimeout(callback, delay)
setInterval(callback, delay)
clearTimeout(id)
clearInterval(id)
```

## Error Handling

Proper error handling ensures your notebooks are robust and user-friendly.

### Try-Catch Blocks

```javascript
try {
    const data = JSON.parse(jsonString);
    const processed = processData(data);
    exports.result = processed;
} catch (error) {
    console.error('Processing failed:', error.message);
    exports.result = { error: error.message, success: false };
    
    // Display error to user
    const errorDiv = createDiv({
        innerHTML: `<p style="color: red;">❌ Error: ${error.message}</p>`,
        style: 'padding: 10px; border: 1px solid red; border-radius: 4px;'
    });
    output(errorDiv);
}
```

### Async Error Handling

```javascript
async function loadAndProcessData() {
    try {
        const response = await fetch('/api/data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const processed = await processData(data);
        
        exports.processedData = processed;
        console.log('✅ Data loaded and processed successfully');
        
    } catch (error) {
        console.error('❌ Failed to load data:', error);
        exports.processedData = null;
        
        // Show user-friendly error
        const errorMessage = createDiv({
            innerHTML: `
                <h4>Failed to Load Data</h4>
                <p>${error.message}</p>
                <p>Please check your connection and try again.</p>
            `,
            style: 'padding: 15px; background: #fee; border: 1px solid #fcc; border-radius: 4px;'
        });
        output(errorMessage);
    }
}

loadAndProcessData();
```

### Validation and Graceful Degradation

```javascript
// Validate data before processing
function validateAndProcess(data) {
    // Check if data exists
    if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Invalid data format, using empty array');
        return [];
    }
    
    // Validate each item
    const validItems = data.filter(item => {
        if (!item || typeof item !== 'object') {
            console.warn('⚠️ Skipping invalid item:', item);
            return false;
        }
        
        if (!item.id || !item.name) {
            console.warn('⚠️ Item missing required fields:', item);
            return false;
        }
        
        return true;
    });
    
    console.log(`✅ Validated ${validItems.length} of ${data.length} items`);
    return validItems;
}

const cleanData = validateAndProcess(rawData);
exports.validatedData = cleanData;
```

### Error Recovery Patterns

```javascript
// Retry mechanism
async function fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.warn(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Fallback data
function getDataWithFallback() {
    try {
        return expensiveDataProcessing();
    } catch (error) {
        console.warn('Using fallback data due to error:', error.message);
        return getFallbackData();
    }
}
```

## Best Practices

### Output Methods - Use the Right Tool

```javascript
// ✅ Excellent: Use appropriate output methods
// For data analysis results
const analysisResults = {
    summary: { total: 50000, average: 2500, count: 20 },
    trends: [{ month: 'Jan', growth: 12.5 }, ...],
    recommendations: ['Increase budget', 'Focus on Q2']
};
output(analysisResults); // Interactive JSON viewer

// For tabular data
const salesReport = [
    { product: 'A', sales: 1000, revenue: 50000 },
    { product: 'B', sales: 750, revenue: 37500 }
];
output.table(salesReport); // Sortable table

// For formatted reports - use markdown cells with interpolation
exports.totalRevenue = 87500;
exports.growthRate = 12.5;
exports.topProduct = 'Widget C';
// Then create markdown cell: "## Report\nRevenue: ${{totalRevenue.toLocaleString()}}"

// For charts requiring DOM containers
const chartDiv = createDiv({ id: 'chart', style: 'height: 400px;' });
output(chartDiv);
Plotly.newPlot('chart', data, layout);
```

### Visualization Integration

```javascript
// ✅ Correct: DOM elements only for library integration
// Plotly visualization
const plotData = [{ x: [1,2,3], y: [4,5,6], type: 'scatter' }];
const plotContainer = createDiv({ id: 'plot', style: 'height: 400px;' });
output(plotContainer);
Plotly.newPlot('plot', plotData);

// Chart.js integration
const chartCanvas = createElement('canvas', { id: 'chart' });
output(chartCanvas);
const ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, chartConfig);

// ❌ Wrong: Don't create visual elements manually
const customChart = createDiv({
    innerHTML: '<div class="bar" style="height: 50px; background: blue;"></div>'
});
```

### Performance Considerations

```javascript
// ✅ Good: Efficient data processing
const largeDataset = await loadLargeDataset();

// Use efficient array methods
const filtered = largeDataset.filter(item => item.active);
const mapped = filtered.map(item => ({ id: item.id, value: item.total }));

// Consider memory usage for very large datasets
if (largeDataset.length > 10000) {
    console.warn(`Processing large dataset: ${largeDataset.length} items`);
}

// ❌ Avoid: Inefficient nested loops
// const result = largeDataset.map(item => 
//     largeDataset.filter(other => other.category === item.category)
// );
```

### Reactive Programming Best Practices

```javascript
// ✅ Good: Clear dependencies and exports
// This cell depends on 'rawSalesData' and exports clean data
const cleanSalesData = rawSalesData
    .filter(sale => sale.amount > 0)
    .map(sale => ({
        ...sale,
        date: new Date(sale.dateString),
        profit: sale.revenue - sale.cost
    }));

exports.cleanSalesData = cleanSalesData;
exports.totalSales = cleanSalesData.reduce((sum, sale) => sum + sale.amount, 0);

// ✅ Good: Immutable updates
const updatedData = cleanSalesData.map(sale => 
    sale.region === 'North' 
        ? { ...sale, priority: 'high' }
        : sale
);

// ❌ Avoid: Mutating shared data
// cleanSalesData.forEach(sale => { sale.priority = 'high'; }); // Mutates original
```

### Debugging and Development

```javascript
// ✅ Good: Informative logging
console.group('Data Processing Pipeline');
console.log(`Input: ${rawData.length} records`);
console.time('processing');

const step1 = validateData(rawData);
console.log(`After validation: ${step1.length} records`);

const step2 = transformData(step1);
console.log(`After transformation: ${step2.length} records`);

console.timeEnd('processing');
console.groupEnd();

// ✅ Good: Intermediate results for debugging
exports.debugInfo = {
    rawCount: rawData.length,
    validCount: step1.length,
    finalCount: step2.length,
    processingTime: performance.now()
};
```

### Error Prevention

```javascript
// ✅ Good: Defensive programming
function processUserData(users) {
    if (!Array.isArray(users)) {
        console.error('Expected array of users, got:', typeof users);
        return [];
    }
    
    return users
        .filter(user => user && typeof user === 'object')
        .filter(user => user.id && user.name)
        .map(user => ({
            id: user.id,
            name: user.name.trim(),
            email: user.email ? user.email.toLowerCase() : null,
            age: user.age && !isNaN(user.age) ? parseInt(user.age) : null
        }));
}
```

## Shell Integration

Nodebook.js includes comprehensive shell integration powered by the `zx` library, with all zx globals automatically available in code cells. This provides a powerful shell scripting environment directly in your notebooks.

### Core Shell Execution

Execute shell commands using the `$` function (always async):

```javascript
// Basic shell commands
const result = await $`echo "Hello World"`;
console.log(result.stdout.trim()); // "Hello World"

// Command with complex output
const files = await $`ls -la`;
console.log('Directory contents:');
console.log(files.stdout);

// Synchronous execution when needed
const currentDir = $.sync`pwd`;
console.log('Current directory:', currentDir.stdout.trim());

// Command options and configuration
const tolerantResult = await $({nothrow: true})`exit 1`; // Don't throw on error
const timedResult = await $({timeout: '5s'})`long-running-command`;
const pipedResult = await $({input: 'hello world'})`cat`; // Pipe input
```

### Working Directory Management

**Important**: All code cells execute in the **notebook's directory**, not the application directory:

```javascript
// Check working directory (should be notebook directory)
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);
console.log('pwd command:', (await $`pwd`).stdout.trim());

// Change directory (affects subsequent $ calls)
cd('/tmp');
await $`pwd`; // Now shows /tmp

// Isolated context with within()
await within(async () => {
    $.cwd = '/different/path';
    const files = await $`ls`; // Uses /different/path
    console.log('Files in isolated context:', files.stdout);
    // Context automatically restored
});

// Back in original directory
await $`pwd`; // Shows original directory
```

### Complete zx Globals Reference

All zx globals are automatically available without imports:

#### Shell Execution and Control
```javascript
// Execute commands
const output = await $`command args`;
const sync = $.sync`command args`;

// Directory navigation  
cd('/path/to/directory');
await $`pwd`; // Shows new directory

// Isolated contexts
await within(async () => {
    // Changes here don't affect global state
    $.verbose = false;
    $.cwd = '/tmp';
    await $`command`; // Runs in /tmp with no output
});
```

#### Input/Output Operations
```javascript
// Interactive prompts
const name = await question('What is your name? ');
const choice = await question('Select option:', {
    choices: ['Option A', 'Option B', 'Option C']
});

// Enhanced echo (handles ProcessOutput)
echo`Current branch: ${await $`git branch --show-current`}`;
echo('Simple message');
echo(chalk.green('Styled message'));

// Read from stdin
const input = await stdin();
const data = JSON.parse(input);
```

#### File System and Path Operations  
```javascript
// Enhanced file system (fs-extra)
const config = await fs.readJson('package.json');
await fs.writeJson('output.json', data, {spaces: 2});
await fs.copy('src', 'dist');
await fs.ensureDir('path/to/directory');

// Path utilities
const fullPath = path.join(os.homedir(), 'projects', 'myproject');
const relative = path.relative(process.cwd(), fullPath);
const parsed = path.parse('/home/user/file.txt');

// Operating system info
console.log('Platform:', os.platform());
console.log('Home directory:', os.homedir());
console.log('CPU count:', os.cpus().length);
```

#### Pattern Matching and Process Management
```javascript
// File globbing
const jsFiles = await glob('**/*.js');
const configs = await glob(['*.json', '*.yaml', '*.yml']);
const syncFiles = glob.sync('*.md'); // Synchronous API

// Find executables
const gitPath = await which('git');
const nodePath = await which('node', {nothrow: true}); // null if not found

// Process management
const allProcesses = await ps.lookup();
const nodeProcesses = await ps.lookup({command: 'node'});
const processTree = await ps.tree({pid: 123, recursive: true});
await kill(123, 'SIGTERM');
```

#### Temporary Files and Directories
```javascript
// Create temporary directories
const tempDir = tmpdir(); // /tmp/zx-random/
const namedTempDir = tmpdir('my-temp'); // /tmp/zx-random/my-temp/

// Create temporary files
const tempFile = tmpfile(); // Empty temp file
const dataFile = tmpfile('data.json', JSON.stringify(data));
const script = tmpfile('script.sh', '#!/bin/bash\necho hello', 0o755); // Executable
```

#### Utilities and Formatting
```javascript
// Terminal styling with chalk
console.log(chalk.blue('Info message'));
console.log(chalk.red.bold('Error:'), chalk.yellow('Warning message'));
console.log(chalk.green('✓ Success'));

// Command line arguments (automatically parsed)
if (argv.verbose) {
    console.log('Verbose mode enabled');
}
if (argv.help || argv.h) {
    console.log('Usage: script [options]');
}

// Custom argument parsing
const customArgs = minimist(process.argv.slice(2), {
    boolean: ['force', 'help'],
    alias: {h: 'help', f: 'force'},
    default: {timeout: 5000}
});
```

#### Network and Data Operations
```javascript
// HTTP requests with enhanced fetch
const response = await fetch('https://api.github.com/user');
const userData = await response.json();

// Fetch with streaming (pipe to shell commands)
await fetch('https://example.com/large-file.json').pipe($`jq '.'`);
await fetch('https://api.example.com/data').pipe($`grep "important"`);

// YAML processing
const config = YAML.parse(await fs.readFile('config.yaml', 'utf8'));
const yamlOutput = YAML.stringify({
    name: 'MyProject',
    version: '1.0.0',
    dependencies: ['lodash', 'chalk']
});
```

#### Error Handling and Reliability
```javascript
// Retry operations with backoff
const result = await retry(5, async () => {
    return await $`curl https://flaky-api.com/data`;
});

// Retry with custom delays
const data = await retry(10, '2s', async () => {
    return await fetch('https://api.example.com/data');
});

// Exponential backoff
const downloaded = await retry(20, expBackoff(), async () => {
    return await $`wget https://large-file.com/archive.zip`;
});

// Progress indication
await spinner('Installing dependencies...', async () => {
    await $`npm install`;
});

// Custom spinner
await spinner(() => $`docker build -t myapp .`);
```

#### Environment and Configuration
```javascript
// Environment variable management
dotenv.config('.env'); // Load .env into process.env
const envVars = dotenv.load('.env'); // Load without setting process.env
const parsed = dotenv.parse('NODE_ENV=production\nDEBUG=true');

// Run commands with custom environment
await $({env: {NODE_ENV: 'production', DEBUG: 'app:*'}})`node server.js`;

// Shell configuration
useBash(); // Use bash shell with bash quoting
usePowerShell(); // Switch to PowerShell with PowerShell quoting  
usePwsh(); // Use PowerShell 7+ (pwsh)

// String quoting for different shells
const bashSafe = quote('$HOME/path with spaces');
const pwshSafe = quotePowerShell('$env:USERPROFILE\\path with spaces');

// Process synchronization (optional - has performance cost)
syncProcessCwd(); // Keep process.cwd() synced with $.cwd
```

#### Timing and Delays
```javascript
// Sleep/wait operations
await sleep(1000); // Wait 1 second
await sleep('2s'); // Wait 2 seconds  
await sleep('500ms'); // Wait 500 milliseconds

// Use in sequences
console.log('Starting process...');
await sleep('1s');
await $`some-command`;
await sleep('500ms');
console.log('Process complete');
```

### Practical Examples

#### Project Setup and Management
```javascript
// Initialize new project
await $`mkdir -p project/{src,tests,docs}`;
await $`touch project/README.md project/.gitignore`;
cd('project');

// Package.json creation
const pkg = {
    name: 'my-project',
    version: '1.0.0',
    scripts: {test: 'jest', build: 'webpack'}
};
await fs.writeJson('package.json', pkg, {spaces: 2});

// Git initialization
await $`git init`;
await $`git add .`;
await $`git commit -m "Initial commit"`;
```

#### Data Processing Pipelines
```javascript
// Download and process data
console.log(chalk.blue('Downloading data...'));
await retry(3, '1s', () => $`curl -o data.csv "https://example.com/dataset.csv"`);

// Validate and process
const lineCount = parseInt((await $`wc -l < data.csv`).stdout.trim());
console.log(`Downloaded ${lineCount} records`);

// Process with Unix tools
await $`sort data.csv | uniq | head -100 > processed.csv`;
const processed = parseInt((await $`wc -l < processed.csv`).stdout.trim());
console.log(chalk.green(`✓ Processed ${processed} unique records`));

// Export results for other cells
exports.dataStats = {
    originalRows: lineCount,
    processedRows: processed,
    timestamp: new Date().toISOString()
};
```

#### System Monitoring and Maintenance
```javascript
// System health check
const diskUsage = await $`df -h /`;
const memUsage = await $`free -h`;
const loadAvg = await $`uptime`;

// Process monitoring
const nodeProcs = await ps.lookup({command: 'node'});
console.log(`Running ${nodeProcs.length} Node.js processes`);

// Log rotation
const logDir = tmpdir('logs');
await $`find ${logDir} -name "*.log" -mtime +7 -delete`;
console.log('Cleaned up old log files');

// Export system status
exports.systemStatus = {
    disk: diskUsage.stdout,
    memory: memUsage.stdout,
    load: loadAvg.stdout.trim(),
    nodeProcesses: nodeProcs.length,
    checkTime: new Date()
};
```

#### Git Operations and Version Control
```javascript
// Git status and operations
const status = await $`git status --porcelain`;
const hasChanges = status.stdout.trim().length > 0;

if (hasChanges) {
    console.log(chalk.yellow('Uncommitted changes detected:'));
    console.log(status.stdout);
    
    // Interactive commit
    const shouldCommit = await question('Commit changes? (y/n) ');
    if (shouldCommit.toLowerCase() === 'y') {
        const message = await question('Commit message: ');
        await $`git add .`;
        await $`git commit -m ${message}`;
        console.log(chalk.green('✓ Changes committed'));
    }
} else {
    console.log(chalk.green('✓ Working directory is clean'));
}

// Branch information
const branch = (await $`git branch --show-current`).stdout.trim();
const commits = (await $`git rev-list --count HEAD`).stdout.trim();
exports.gitInfo = {branch, commits, hasChanges};
```

### Error Handling Best Practices

```javascript
// Handle command failures gracefully
try {
    const result = await $`risky-command`;
    exports.commandOutput = result.stdout;
} catch (error) {
    console.error(chalk.red('Command failed:'), error.message);
    console.error('Exit code:', error.exitCode);
    console.error('stderr:', error.stderr);
    exports.commandOutput = null;
}

// Use nothrow for commands that may fail
const result = await $({nothrow: true})`test -f optional-file.txt`;
if (result.exitCode === 0) {
    console.log('Optional file exists');
} else {
    console.log('Optional file not found, continuing...');
}

// Validate prerequisites
const requiredCommands = ['git', 'node', 'npm'];
for (const cmd of requiredCommands) {
    const path = await which(cmd, {nothrow: true});
    if (!path) {
        throw new Error(`Required command not found: ${cmd}`);
    }
    console.log(`✓ ${cmd} found at ${path}`);
}
```

### Integration with Reactive System

Shell operations work seamlessly with reactive exports:

```javascript
// Export shell command results for other cells
const systemInfo = {
    hostname: (await $`hostname`).stdout.trim(),
    uptime: (await $`uptime`).stdout.trim(),
    diskSpace: await $`df -h /`,
    timestamp: new Date()
};
exports.systemInfo = systemInfo;

// Use reactive variables in shell commands
const logFile = path.join('logs', `${dataSource}_${new Date().toISOString().split('T')[0]}.log`);
await fs.ensureDir('logs');
await $`echo ${JSON.stringify(processedData)} >> ${logFile}`;

// Conditional shell execution based on reactive state
if (developmentMode) {
    await $`npm run dev`;
} else {
    await $`npm run build`;
    await $`npm run test`;
}
```

### Performance and Best Practices

1. **Always use `await`** with shell commands (they're all async)
2. **Use `nothrow` option** for commands that might fail
3. **Use `within()`** for isolated contexts instead of changing global state
4. **Prefer `tmpdir()`/`tmpfile()`** over hardcoded temp paths
5. **Check command availability** with `which()` before using
6. **Enable `syncProcessCwd()`** only if needed (has performance overhead)
7. **Use `retry()`** for unreliable network operations
8. **Use `spinner()`** for long-running operations to show progress
9. **Quote variables** properly when passing to shell commands
10. **Handle errors gracefully** with try-catch or `nothrow`

## Global Output Monitoring

Nodebook.js provides two global output monitoring systems to capture and display different types of program output:

### Output Panel (Ctrl+Shift+`)
- **Purpose**: Captures raw stdout/stderr from shell commands and direct process writes
- **Keyboard Shortcut**: `Ctrl+Shift+` (backtick) - **View → Toggle Output Panel**
- **Menu Location**: View → Toggle Output Panel (toolbar button removed)
- **Content**: Raw text output from:
  - Shell commands executed with zx (`$`, `echo`, etc.)
  - Direct `process.stdout.write()` and `process.stderr.write()` calls
  - System-level output and error streams

### Console Viewer (Ctrl+`)
- **Purpose**: Captures all console.log, console.warn, console.error, etc. from code cell execution
- **Keyboard Shortcut**: `Ctrl+` (backtick) - **View → Toggle Console Viewer**
- **Menu Location**: View → Toggle Console Viewer (toolbar button removed)
- **Content**: Console output with:
  - Rich object rendering using the same ObjectDisplay component as cell outputs
  - Support for complex objects, arrays, DataFrames, and other data structures
  - Color-coded log levels (LOG, WARN, ERROR, INFO, DEBUG)
  - Timestamps for each entry
  - Persistent across cell re-executions (replaces per-cell console output)
- **Also appears in**: Browser dev tools console for debugging

### Key Differences
- **Output Panel**: Raw text streams from shell operations (**Ctrl+Shift+`**)
- **Console Viewer**: Structured console output with object inspection (**Ctrl+`**)
- **Persistence**: Console logs persist across cell re-executions and show global execution order
- **Rendering**: Console viewer uses ObjectDisplay for rich data visualization
- **Debugging**: Console output also appears in browser dev tools for debugging

### Usage Examples

```javascript
// These appear in the Output Panel (Ctrl+Shift+`)
await $`echo "Hello from shell"`;
process.stdout.write("Direct stdout\n");
process.stderr.write("Direct stderr\n");

// These appear in the Console Viewer (Ctrl+`)
console.log("Simple log message");
console.log("Object:", { name: "test", values: [1, 2, 3] });
console.warn("Warning message");
console.error("Error message");
console.info("Info message");
```

Both panels support:
- Auto-scroll to bottom (with manual disable when scrolling up)
- Manual clearing of all entries
- Configurable maximum entry limits (100 for console, 1000 for output)
- Real-time updates as output is generated

## LaTeX Mathematical Expressions

Nodebook.js provides automatic LaTeX rendering for mathematical expressions in code cell outputs, console output, and object displays.

### LaTeX Syntax Support

#### Display Math (Block Equations)
Use `$$..$$` for centered, block-level mathematical expressions:

```javascript
// Generate LaTeX from MathJS
const expr = 'sqrt(75 / 3) + det([[-1, 2], [3, 1]]) - sin(pi / 4)^2';
const node = mathjs.parse(expr);
output("$$" + node.toTex() + "$$");

// Direct LaTeX strings
output("$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$");
output("$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$");
```

#### Inline Math
Use `$...$` for inline mathematical expressions within text:

```javascript
output("The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ for solving $ax^2 + bx + c = 0$.");
console.log("Value of π is approximately $\\pi \\approx 3.14159$");
```

#### LaTeX in Markdown Cells
**NEW**: Markdown cells now support native LaTeX rendering using `markdown-it-mathjax3`:

```markdown
# Mathematical Analysis

## Inline Math
The quadratic formula $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ solves equations of the form $ax^2 + bx + c = 0$.

## Display Math (Block)
Maxwell's equations in their differential form:

$$\begin{array}{c}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} & = 0
\end{array}$$

## Mixed Content with Variable Interpolation
The area under the curve $f(x) = x^2$ from $0$ to ${{upperLimit}}$ is:
$$\int_0^{{{upperLimit}}} x^2 dx = \frac{{{upperLimit}}^3}{3} = {{(Math.pow(upperLimit, 3) / 3).toFixed(2)}}$$
```

**Key advantages of LaTeX in markdown cells:**
- **Native rendering**: No need to wrap LaTeX in `$$` strings for code cell output
- **Variable interpolation**: Combine LaTeX with reactive variables using `{{variable}}`
- **Cleaner syntax**: Use natural LaTeX delimiters (`$` and `$$`) without escaping
- **Better for static content**: Ideal for mathematical explanations and formulas

**Best practices:**
- Use markdown cells for static mathematical content and explanations
- Use code cells for dynamic LaTeX generation (e.g., with MathJS)
- Combine both approaches for rich mathematical notebooks

### Automatic LaTeX Detection

Nodebook.js automatically detects and renders LaTeX content in:

- **Markdown cells**: Native LaTeX support with `markdown-it-mathjax3` plugin
- **Code cell outputs**: String values containing `$$..$$` or `$...$`
- **Console output**: `console.log()` messages with LaTeX syntax
- **Object displays**: String properties containing mathematical expressions
- **Mixed content**: Text with embedded LaTeX expressions

### LaTeX Rendering Features

#### MathJax Integration
- Uses `better-react-mathjax` library for high-quality rendering
- Supports standard LaTeX mathematical notation
- Handles both inline and display math contexts
- Automatic font scaling and responsive design

#### Mixed Content Support
```javascript
// LaTeX mixed with regular text is automatically handled
output("The solution to $x^2 + 2x + 1 = 0$ is $x = -1$, which gives us the factored form $(x+1)^2 = 0$.");

// Works in console output too
console.log("Computing $\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$ for n=10:");
```

#### Complex Mathematical Expressions
```javascript
// Matrices and advanced notation
output("$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax + by \\\\ cx + dy \\end{pmatrix}$$");

// Integrals and limits
output("$$\\lim_{n \\to \\infty} \\sum_{i=1}^{n} \\frac{1}{n} f\\left(\\frac{i}{n}\\right) = \\int_{0}^{1} f(x) dx$$");

// Statistical formulas
output("$$\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(x_i - \\mu)^2}$$");
```

### Integration with MathJS

MathJS provides excellent LaTeX generation capabilities:

```javascript
// Parse mathematical expressions
const expr = 'derivative(x^3 + 2*x^2 + x + 1, x)';
const node = mathjs.parse(expr);

// Convert to LaTeX and render
const latexExpr = node.toTex();
output("Original: " + expr);
output("LaTeX: $$" + latexExpr + "$$");

// Evaluate and show result
const result = node.evaluate();
output("Result: $$" + mathjs.parse(result.toString()).toTex() + "$$");
```

### Best Practices

#### LaTeX String Construction
```javascript
// ✅ Good: Properly escaped LaTeX
output("$$\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$");

// ✅ Good: Using template literals for complex expressions
const a = 2, b = 3, c = 1;
output(`$$x = \\frac{-${b} \\pm \\sqrt{b^2-4ac}}{2a}$$`);

// ✅ Good: MathJS for automatic LaTeX generation
const expression = 'integrate(sin(x), x)';
const latex = mathjs.parse(expression).toTex();
output("$$" + latex + "$$");
```

#### Performance Considerations
```javascript
// ✅ Good: Output LaTeX directly
output("$$E = mc^2$$");

// ❌ Avoid: Unnecessary DOM manipulation for LaTeX
const latexDiv = createDiv({
    innerHTML: "$$E = mc^2$$"
});
```

### Styling and Appearance

LaTeX expressions are automatically styled with:
- Proper mathematical fonts and sizing
- Centered alignment for display math (`$$..$$`)
- Inline flow for inline math (`$...$`)
- Responsive scaling for different screen sizes
- Dark mode compatibility

### Troubleshooting LaTeX

#### Common Issues
```javascript
// ❌ Problem: Single backslash gets escaped
output("$$\frac{1}{2}$$"); // Won't render correctly

// ✅ Solution: Use double backslashes
output("$$\\frac{1}{2}$$"); // Renders correctly

// ❌ Problem: Unmatched delimiters
output("$$x = 2$"); // Missing closing $$

// ✅ Solution: Properly matched delimiters
output("$$x = 2$$"); // Correct
```

#### Debugging LaTeX Content
```javascript
// Check if string contains LaTeX
import { isLatexContent } from './LatexRenderer';

const mathString = "$$x^2 + y^2 = r^2$$";
console.log("Contains LaTeX:", isLatexContent(mathString)); // true

// Preview LaTeX before rendering
const formula = "\\frac{d}{dx}[x^n] = nx^{n-1}";
console.log("LaTeX formula:", formula);
output("$$" + formula + "$$");
```

### Examples

#### Mathematical Analysis
```javascript
// Calculus example
const functions = [
    "f(x) = x^2",
    "f'(x) = 2x", 
    "\\int f(x) dx = \\frac{x^3}{3} + C"
];

functions.forEach((func, i) => {
    output(`Step ${i + 1}: $$${func}$$`);
});
```

#### Statistical Formulas
```javascript
// Statistics example
const stats = {
    mean: "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i",
    variance: "s^2 = \\frac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2",
    correlation: "r = \\frac{\\sum_{i=1}^{n}(x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum_{i=1}^{n}(x_i - \\bar{x})^2\\sum_{i=1}^{n}(y_i - \\bar{y})^2}}"
};

Object.entries(stats).forEach(([name, formula]) => {
    output(`**${name.charAt(0).toUpperCase() + name.slice(1)}**: $$${formula}$$`);
});
```

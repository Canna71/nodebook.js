# Code Cells Guide

Code cells in NotebookJS provide a powerful JavaScript execution environment with reactive capabilities, DOM manipulation, and module support. This guide covers everything you can do in a code cell.

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
const message = "Hello, NotebookJS!";
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

NotebookJS provides several specialized output methods for different types of data. **Avoid creating DOM elements directly** - use the appropriate output method for your data type.

### ⚠️ Important: Use Proper Output Methods

**Don't create DOM elements for data display!** NotebookJS has better alternatives:

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
exports.revenue = 50000;
exports.growth = 12.5;
exports.topProduct = 'Widget C';
// Then create markdown cell: "## Report\nRevenue: ${{revenue.toLocaleString()}}"

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

The reactive system in NotebookJS allows cells to share data and automatically update when dependencies change. This is achieved through the `exports` object and variable access.

### Exporting Values

Use the `exports` object to make values available to other cells:

```javascript
// Export a simple value
exports.greeting = "Hello, NotebookJS!";

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

NotebookJS provides specialized functions for displaying tabular data. **Always use `output.table()` for tabular data** instead of creating HTML tables manually.

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

NotebookJS supports both built-in modules and custom module loading.

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
// Available globally (if loaded)
Math                          // Extended math functions (Math.js)
_                            // Lodash utility functions  
d3                          // D3.js for data manipulation
Plotly                      // Plotly.js for visualization

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

// For formatted reports - use markdown with interpolation
exports.totalRevenue = 87500;
exports.growthRate = 12.5;
exports.topProduct = 'Widget A';
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

This comprehensive guide covers all the essential features and best practices for working with code cells in NotebookJS. Remember to always test your code, handle errors gracefully, and use the reactive system effectively to build powerful data analysis and visualization notebooks.

## Shell Integration

NotebookJS includes full shell integration powered by the `zx` library, allowing you to execute shell commands directly in your code cells with proper async/await support.

### Shell Command Execution

Execute shell commands using the `$` function:

```javascript
// Simple shell commands
const result = await $`echo "Hello World"`;
console.log(result.stdout); // "Hello World\n"

// Command with output
const files = await $`ls -la`;
console.log('Directory contents:', files.stdout);

// Command chaining
await $`mkdir -p temp/data`;
await $`echo "test content" > temp/data/test.txt`;
const content = await $`cat temp/data/test.txt`;
console.log('File content:', content.stdout.trim());
```

### Working Directory

All code cells execute in the **notebook's directory**, not the application directory:

```javascript
// Show current working directory
const cwd = await $`pwd`;
console.log('Working directory:', cwd.stdout.trim());

// Both __dirname and process.cwd() point to notebook directory
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

// File operations are scoped to notebook directory
const fs = require('fs');
const files = fs.readdirSync('.'); // Lists files in notebook directory
console.log('Notebook files:', files.filter(f => f.endsWith('.nbjs')));
```

### Available Shell Utilities

All zx globals are available without imports:

```javascript
// Directory navigation
await cd('subdirectory');
await cd('..'); // Back to notebook directory

// User interaction
const name = await question('What is your name? ');
console.log(`Hello, ${name}!`);

// Utility functions
await sleep(1000); // Wait 1 second
echo('This goes to stdout');

// File globbing
const jsFiles = await glob('**/*.js');
console.log('JavaScript files:', jsFiles);

// Check if command exists
const hasGit = await which('git');
console.log('Git available:', !!hasGit);

// Styled output
console.log(chalk.blue('Blue text'));
console.log(chalk.green.bold('Bold green text'));

// YAML parsing
const yamlData = YAML.parse('key: value\narray:\n  - item1\n  - item2');
console.log('Parsed YAML:', yamlData);
```

### Practical Examples

#### File Management
```javascript
// Backup notebook files
await $`mkdir -p backups`;
const notebooks = await glob('*.nbjs');
for (const notebook of notebooks) {
    await $`cp ${notebook} backups/${notebook}.backup`;
}
console.log(`Backed up ${notebooks.length} notebooks`);
```

#### Git Operations
```javascript
// Check git status
const status = await $`git status --porcelain`;
if (status.stdout.trim()) {
    console.log('Uncommitted changes:');
    console.log(status.stdout);
} else {
    console.log('Working directory is clean');
}

// Commit changes
await $`git add .`;
await $`git commit -m "Update notebook: ${new Date().toISOString()}"`;
```

#### Data Processing Pipeline
```javascript
// Download and process data
await $`curl -o data.csv "https://example.com/data.csv"`;
const lineCount = await $`wc -l data.csv`;
console.log('Downloaded data:', lineCount.stdout.trim());

// Process with standard Unix tools
await $`sort data.csv | uniq > processed.csv`;
const processedLines = await $`wc -l processed.csv`;
console.log('Processed data:', processedLines.stdout.trim());
```

### Error Handling

Shell commands throw errors on non-zero exit codes:

```javascript
try {
    await $`some-command-that-might-fail`;
} catch (error) {
    console.error('Command failed:', error.message);
    console.error('Exit code:', error.exitCode);
    console.error('stderr:', error.stderr);
}

// Ignore errors with nothrow
const result = await $`command || true`; // Always succeeds
// Or use zx's quiet mode
$.verbose = false; // Suppress output
const quietResult = await $`ls nonexistent || echo "not found"`;
$.verbose = true; // Restore output
```

### Integration with Reactive System

Shell commands work seamlessly with the reactive system:

```javascript
// Export shell command results
const diskUsage = await $`df -h /`;
exports.systemInfo = {
    timestamp: new Date(),
    diskUsage: diskUsage.stdout,
    hostname: (await $`hostname`).stdout.trim()
};

// Use reactive variables in shell commands
const logFile = `logs/${dataSource}_${new Date().toISOString().split('T')[0]}.log`;
await $`echo "${JSON.stringify(processedData)}" >> ${logFile}`;
```

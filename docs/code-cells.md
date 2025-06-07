# Code Cells Guide

Code cells in NotebookJS provide a powerful JavaScript execution environment with reactive capabilities, DOM manipulation, and module support. This guide covers everything you can do in a code cell.

## Table of Contents

- [Basic JavaScript Execution](#basic-javascript-execution)
- [Cell Execution Behavior](#cell-execution-behavior)
- [Reactive Values and Exports](#reactive-values-and-exports)
- [Accessing Other Variables](#accessing-other-variables)
- [Console Output](#console-output)
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

## Reactive Values and Exports

### Exporting Variables

Use the `exports` object to make variables available to other cells and the reactive system:

```javascript
// Export simple values
exports.myNumber = 42;
exports.myString = "Hello World";
exports.myArray = [1, 2, 3, 4, 5];

// Export computed values
exports.sum = myArray.reduce((a, b) => a + b, 0);

// Export objects
exports.user = {
    name: "John Doe",
    age: 30,
    active: true
};

// Export functions
exports.calculateArea = (radius) => Math.PI * radius * radius;
```

### Important: Reading vs Writing

- **Writing**: `exports.varName = value` - Stores the value in the reactive system
- **Reading**: `varName` (not `exports.varName`) - Retrieves the current reactive value

```javascript
// ❌ Wrong - this won't work
exports.result = exports.myNumber * 2;

// ✅ Correct - access variables by name
exports.result = myNumber * 2;
```

### Reactive Dependencies

When you reference variables from other cells, your cell automatically becomes dependent on them:

```javascript
// This cell depends on 'price' and 'taxRate' from other cells
exports.totalPrice = price * (1 + taxRate);

// When 'price' or 'taxRate' changes, this cell re-executes automatically
```

## Accessing Other Variables

You can access any variable exported by other cells simply by name:

```javascript
// Access input cell values
console.log("Current slider value:", sliderValue);

// Access formula results
console.log("Calculated result:", calculatedTotal);

// Access data from other code cells
console.log("User data:", user.name);

// Use in calculations
exports.discountedPrice = originalPrice * (1 - discountRate);
```

## Console Output

### Basic Console Methods

```javascript
// Standard console methods
console.log("Information message");
console.warn("Warning message");
console.error("Error message");
console.info("Info message");

// Multiple arguments
console.log("User:", user.name, "Age:", user.age);

// Objects are displayed with ObjectDisplay component
console.log("Complex data:", {
    dataFrame: myDataFrame,
    statistics: { mean: 42, std: 10 },
    metadata: { source: "api", timestamp: new Date() }
});
```

### Console Output Features

- **Automatic object rendering**: Complex objects are displayed with an interactive ObjectDisplay component
- **Timestamps**: All console output includes timestamps
- **Error highlighting**: Errors and warnings are visually distinct
- **Persistent output**: Console output persists when cells re-execute

## Console Output vs Output Values

NotebookJS provides two distinct mechanisms for displaying results from code cells:

### `console.log()` - Debugging and Messages
Use `console.log()` for debugging information, status messages, and simple text output:

```javascript
// Debugging information
console.log("Processing", data.length, "records");
console.log("Current iteration:", i);

// Status messages
console.log("✓ Data loaded successfully");
console.warn("⚠️ Missing values detected in column 'age'");
console.error("✗ Validation failed");

// Simple value logging
console.log("Mean value:", meanValue);
console.log("Processing complete");
```

**Console output characteristics:**
- Appears in a dedicated console section
- Includes timestamps
- Supports different log levels (log, warn, error, info)
- Primarily for debugging and status information
- Text-based display only

### `output()` - Rich Content Display
Use `output()` for rich content, visualizations, data structures, and final results:

```javascript
// Rich data structures
output({
    summary: "Analysis Results",
    totalRecords: 1500,
    meanAge: 32.4,
    validRecords: 1450,
    errors: 50
});

// DOM elements and visualizations
const chart = createChart(data);
output(chart);

// DataFrames and complex objects
output(myDataFrame);

// Multiple outputs in sequence
output(summaryTable);
output(chart);
output(statisticsObject);

// HTML elements
const container = document.createElement('div');
container.innerHTML = '<h3>Results</h3><p>Analysis complete</p>';
output(container);
```

**Output characteristics:**
- Renders rich, interactive content
- Supports DOM elements, charts, tables
- Handles complex data structures with ObjectDisplay
- Primary mechanism for displaying results
- Supports multiple outputs per cell

### When to Use Which?

| Use `console.log()` for: | Use `output()` for: |
|-------------------------|-------------------|
| Debug messages | Final results |
| Progress updates | Data visualizations |
| Status information | Rich data structures |
| Error diagnostics | DOM elements |
| Development logging | User-facing content |
| Simple text output | Interactive content |

### Combined Usage Example

```javascript
const dfd = require('danfojs');

// Use console.log for process tracking
console.log("Loading dataset...");

const data = {
    name: ['Alice', 'Bob', 'Charlie', 'Diana'],
    age: [25, 30, 35, 28],
    salary: [50000, 60000, 70000, 55000]
};

console.log("✓ Data loaded, creating DataFrame...");

const df = new dfd.DataFrame(data);

console.log("✓ DataFrame created with shape:", df.shape);

// Use output for rich content display
output({
    title: "Dataset Summary",
    shape: df.shape,
    columns: df.columns,
    dataTypes: df.dtypes
});

// Calculate statistics
console.log("Calculating statistics...");
const stats = {
    avgAge: df['age'].mean(),
    avgSalary: df['salary'].mean(),
    maxAge: df['age'].max(),
    minSalary: df['salary'].min()
};

console.log("✓ Statistics calculated");

// Output the results
output(stats);

// Create visualization
console.log("Creating visualization...");
const chart = document.createElement('div');
chart.innerHTML = `
    <h3>Quick Stats</h3>
    <p>Average Age: ${stats.avgAge.toFixed(1)}</p>
    <p>Average Salary: $${stats.avgSalary.toLocaleString()}</p>
`;
chart.style.padding = '10px';
chart.style.border = '1px solid #ccc';

output(chart);

console.log("✓ Analysis complete");

// Export for other cells
exports.dataset = df;
exports.statistics = stats;
```

## DOM Output and Visualization

NotebookJS provides two approaches for DOM output, both using the `output()` function:

### Method 1: Using `output()` Function (Recommended)

```javascript
// Create DOM elements
const div = document.createElement('div');
div.innerHTML = '<h3>My Chart</h3><p>Data visualization here</p>';
div.style.padding = '10px';
div.style.border = '1px solid #ccc';

// Output the element - this is the preferred method
output(div);

// Multiple outputs
const chart1 = createChart(data1);
const chart2 = createChart(data2);
output(chart1, chart2);

// Mix DOM elements with data
output(myChart, { summary: "Chart created", points: 100 });
```

### Method 2: Direct DOM Manipulation with `outEl`

```javascript
// Access the output container directly (for advanced use cases)
if (outEl) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    
    const ctx = canvas.getContext('2d');
    // Draw something...
    ctx.fillStyle = 'blue';
    ctx.fillRect(10, 10, 100, 100);
    
    outEl.appendChild(canvas);
} else {
    console.log('Output container not available');
}
```

**Recommendation**: Use `output()` for most cases as it provides better integration with the notebook system and handles multiple outputs cleanly.

## Module System

### Loading Modules

```javascript
// Load Node.js modules
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load data science libraries
const dfd = require('danfojs');     // DataFrame library
const plotly = require('plotly.js'); // Plotting library
const math = require('mathjs');      // Math utilities

// Use modules
exports.df = new dfd.DataFrame({
    A: [1, 2, 3, 4, 5],
    B: [10, 20, 30, 40, 50]
});

console.log("DataFrame shape:", exports.df.shape);
```

### Available Modules

Common modules available in NotebookJS:
- `danfojs` - DataFrame and data manipulation
- `plotly.js` - Interactive plotting
- `mathjs` - Mathematical functions
- `lodash` - Utility functions
- Standard Node.js modules (`fs`, `path`, `crypto`, etc.)

## Available Functions and Globals

### Global Variables

```javascript
// Console object (captured for output)
console.log("Message");

// Math object
Math.PI; Math.sqrt(16); Math.random();

// Exports object for reactive values
exports.myVar = 42;

// DOM output functions
output(element);        // Output DOM elements or data
outEl;                 // Direct access to output container

// Node.js globals
require('module-name'); // Module loading
process.cwd();         // Process information
Buffer.from('data');   // Buffer utilities
__dirname;            // Current directory (cell context)
__filename;           // Current file (cell context)
```

### Helper Functions

```javascript
// DOM creation helpers
createContainer(title, styles);
createGradientContainer(title, options);

// Output function
output(...values); // Output any combination of DOM elements and data
```

## Error Handling

### Try-Catch Blocks

```javascript
try {
    exports.result = riskyCalculation(someData);
    console.log("Calculation successful:", exports.result);
} catch (error) {
    console.error("Calculation failed:", error.message);
    exports.result = null;
}
```

### Error Display

- **Execution errors**: Displayed in red error boxes below the cell
- **Console errors**: Shown in console output with error styling
- **Reactive updates**: Errors don't break the reactive chain

## Best Practices

### 1. Use Meaningful Export Names

```javascript
// ❌ Poor naming
exports.x = calculateSomething();
exports.data1 = processData();

// ✅ Good naming
exports.quarterlyRevenue = calculateSomething();
exports.cleanedDataset = processData();
```

### 2. Combine Console and Output Appropriately

```javascript
// Log for debugging and progress
console.log("Processing", dataPoints.length, "data points");

// Create and output visualization
const chart = createVisualization(dataPoints);
output(chart);

// Log completion
console.log("✓ Visualization created");

// Export results for other cells
exports.processedData = dataPoints;
exports.chartElement = chart;
```

### 3. Handle Missing Dependencies

```javascript
// Check if dependencies exist
if (typeof inputValue !== 'undefined' && inputValue !== null) {
    exports.processedValue = inputValue * 2;
    console.log("✓ Processing completed");
} else {
    console.warn("⚠️ inputValue not available yet");
    exports.processedValue = 0;
}
```

### 4. Use Output for Results, Console for Process

```javascript
// === Data Loading ===
console.log("Loading data from source...");
const dfd = require('danfojs');
exports.rawData = loadDataFromSource();
console.log("✓ Loaded", exports.rawData.length, "records");

// === Data Processing ===
console.log("Cleaning data...");
exports.cleanData = rawData.filter(row => row.isValid);
exports.df = new dfd.DataFrame(exports.cleanData);
console.log("✓ Cleaned data, removed", rawData.length - exports.cleanData.length, "invalid records");

// === Analysis ===
console.log("Calculating statistics...");
exports.statistics = {
    mean: exports.df['value'].mean(),
    std: exports.df['value'].std(),
    count: exports.df.shape[0]
};
console.log("✓ Statistics calculated");

// === Results Display ===
output({
    title: "Analysis Results",
    statistics: exports.statistics,
    dataShape: exports.df.shape
});

// === Visualization ===
console.log("Creating chart...");
const chart = createChart(exports.df);
output(chart);
console.log("✓ Analysis pipeline complete");
```

This approach provides clear separation between process information (console) and results (output), making notebooks both informative and visually appealing.

## Examples

### Data Analysis Pipeline

```javascript
// Load and process data
const dfd = require('danfojs');

exports.dataset = new dfd.DataFrame({
    name: ['Alice', 'Bob', 'Charlie', 'Diana'],
    age: [25, 30, 35, 28],
    salary: [50000, 60000, 70000, 55000]
});

// Calculate statistics
exports.avgSalary = dataset['salary'].mean();
exports.maxAge = dataset['age'].max();

// Create summary
const summary = document.createElement('div');
summary.innerHTML = `
    <h3>Dataset Summary</h3>
    <p>Average Salary: $${exports.avgSalary.toLocaleString()}</p>
    <p>Max Age: ${exports.maxAge}</p>
    <p>Total Records: ${dataset.shape[0]}</p>
`;
output(summary);

console.log("Analysis complete. Dataset:", exports.dataset.shape);
```

### Interactive Visualization

```javascript
// Create interactive chart
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
canvas.style.border = '1px solid #ccc';

const ctx = canvas.getContext('2d');

// Draw based on reactive data
function drawChart() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Use reactive values
    const values = dataPoints || [10, 20, 30, 40, 50];
    const maxVal = Math.max(...values);
    
    values.forEach((val, i) => {
        const height = (val / maxVal) * 250;
        ctx.fillStyle = `hsl(${i * 60}, 70%, 50%)`;
        ctx.fillRect(i * 60 + 20, 300 - height, 40, height);
    });
}

drawChart();
output(canvas);

// Export for use in other cells
exports.chartCanvas = canvas;
exports.chartData = dataPoints || [10, 20, 30, 40, 50];
```

This comprehensive guide covers all the capabilities of code cells in NotebookJS. The reactive system, DOM output options, and module support make it a powerful environment for interactive computing and data analysis.

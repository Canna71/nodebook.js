# Code Cells Guide

Code cells in NotebookJS provide a powerful JavaScript execution environment with reactive capabilities, DOM manipulation, and module support. This guide covers everything you can do in a code cell.

## Table of Contents

- [Basic JavaScript Execution](#basic-javascript-execution)
- [Cell Execution Behavior](#cell-execution-behavior)
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

// HTML elements using DOM helpers
const container = createDiv({
    innerHTML: '<h3>Results</h3><p>Analysis complete</p>'
});
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

// Create visualization using DOM helpers
console.log("Creating visualization...");
const chart = createDiv({
    innerHTML: `
        <h3>Quick Stats</h3>
        <p>Average Age: ${stats.avgAge.toFixed(1)}</p>
        <p>Average Salary: $${stats.avgSalary.toLocaleString()}</p>
    `,
    style: 'padding: 10px; border: 1px solid #ccc;'
});

output(chart);

console.log("✓ Analysis complete");

// Export for other cells
exports.dataset = df;
exports.statistics = stats;
```

## Tabular Output

NotebookJS provides special tabular rendering for arrays and structured data using `output.table()`:

### Array Display

Arrays are automatically rendered as single-column tables when using regular `output()`:

```javascript
const fruits = ['apple', 'banana', 'cherry', 'date'];

// Arrays are displayed as single-column tables
output(fruits);

// Complex array with objects
const users = [
    { name: 'Alice', active: true },
    { name: 'Bob', active: false },
    'Guest User',
    { name: 'Charlie', age: 30 }
];

output(users); // Each item rendered in its own row
```

### Multi-Column Tables with `output.table()`

Use `output.table()` to force tabular rendering of arrays of objects:

```javascript
const salesData = [
    { product: 'Laptop', price: 999, quantity: 5, total: 4995 },
    { product: 'Mouse', price: 25, quantity: 10, total: 250 },
    { product: 'Keyboard', price: 75, quantity: 3, total: 225 }
];

// Force tabular display with columns for each property
output.table(salesData);
```

**Key differences:**
- `output(array)` → Single-column table with each array item in its own row
- `output.table(array)` → Multi-column table with object properties as columns

### Tabular Output Features

- **Automatic column detection**: Finds all unique properties across objects
- **Mixed data support**: Handles objects with different properties
- **Rich cell rendering**: Each cell uses ObjectDisplay for proper formatting
- **Index column**: Shows row numbers for easy reference
- **Responsive**: Scrollable for large datasets
- **Consistent styling**: Follows application theme

```javascript
// Example with mixed object structures
const mixedData = [
    { name: 'Alice', age: 25, department: 'Engineering' },
    { name: 'Bob', age: 30, location: 'New York' },
    { name: 'Charlie', department: 'Sales', salary: 75000 }
];

output.table(mixedData);
// Creates columns: name, age, department, location, salary
// Missing properties show as "undefined"
```

## DOM Output and Visualization

NotebookJS provides multiple approaches for DOM output, ranging from simple single-element display to complex multi-element layouts:

### Method 1: Using `output()` Function (Recommended)

For displaying DOM elements, always use the `output()` function:

```javascript
// ✅ RECOMMENDED - Use output() for DOM elements
const canvas = createDiv({
    innerHTML: '<p>Canvas content here</p>',
    style: 'width: 400px; height: 300px; background-color: lightblue;'
});

// Use output() function to display
output(canvas);
```

```javascript
// ✅ STANDARD - Single plot with output() (recommended)
const plotDiv = createDiv({
    style: 'width: 100%; height: 400px;'
});

const Plotly = require('plotly.js-dist-min');
Plotly.newPlot(plotDiv.id, data, layout);

// Use output() function to display the plot
output(plotDiv);
```

### Method 2: Using `outEl` for Direct DOM Manipulation (Advanced)

The `outEl` is a direct reference to the cell's output container. Use it only when you need direct DOM manipulation:

```javascript
// ✅ ADVANCED - Direct DOM manipulation with outEl
if (outEl) {
    // Building complex DOM structure incrementally
    const container = createDiv();
    
    // Add elements one by one
    container.appendChild(createTitle('My Dashboard'));
    container.appendChild(createDiv({ innerHTML: 'Content 1' }));
    container.appendChild(createDiv({ innerHTML: 'Content 2' }));
    
    // Add the complete structure to output
    outEl.appendChild(container);
}
```

**When to use `outEl`:**
- Building complex DOM structures incrementally
- Need direct DOM manipulation and control
- Integrating with libraries that require direct DOM access
- **Not recommended** for simple element display - use `output()` instead

**Key Points about `output()` vs `outEl`:**
- **`output(element)`** is the recommended way for displaying DOM elements
- **`outEl.appendChild()`** is for advanced cases requiring direct DOM manipulation
- Both methods end up in the same output container
- `output()` provides better error handling and validation

```javascript
// ✅ RECOMMENDED - Explicit output control
const plotDiv = createDiv({
    style: 'width: 100%; height: 400px; margin: 10px; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px;'
});

const Plotly = require('plotly.js-dist-min');
Plotly.newPlot(plotDiv.id, data, layout, config);

// Output the element explicitly
output(plotDiv);

// Can output multiple elements
const summaryDiv = createDiv({
    innerHTML: '<h3>Plot Summary</h3><p>Interactive visualization complete</p>',
    style: 'margin: 10px; padding: 15px;'
});
output(summaryDiv);
```

### Method 3: Auto-Outputting DOM Helpers (Advanced Layouts)

For complex layouts with automatic styling and output:

```javascript
// ✅ ADVANCED - Auto-outputting containers with rich layouts
const dashboard = createContainer({
    style: 'border: 2px solid var(--color-primary);'
});

const title = createTitle('📊 Data Visualization Dashboard');
dashboard.appendChild(title);

const plotDiv = createDiv({
    style: 'width: 100%; height: 400px; margin: 10px 0;'
});
dashboard.appendChild(plotDiv);

// Create visualization
const Plotly = require('plotly.js-dist-min');
Plotly.newPlot(plotDiv.id, data, layout);

// Add statistics grid
const stats = {
    'Data Points': data.length,
    'Max Value': Math.max(...data.map(d => d.y)),
    'Min Value': Math.min(...data.map(d => d.y))
};
const statsGrid = createKeyValueGrid(stats);
dashboard.appendChild(statsGrid);

// Container auto-outputs itself
```

**Recommendation**: 
- Use `outEl` for simple single-element output (quickest)
- Use `output()` for explicit control and multiple elements (most common)
- Use auto-outputting helpers (`createContainer`, `createGradientContainer`) for rich layouts (dashboards, complex UIs)

### Plotting and Visualization Libraries

When working with plotting libraries like Plotly, D3, or creating charts, always use the `output()` function to display them:

```javascript
// ✅ CORRECT - Plotly visualization with DOM helpers
const plotly = require('plotly.js-dist-min');

// Use createDiv helper for better styling and auto-generated ID
const plotContainer = createDiv({
    style: 'width: 100%; height: 400px; margin: 10px; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);'
});

const data = [{
    x: [1, 2, 3, 4],
    y: [10, 11, 12, 13],
    type: 'scatter'
}];

const layout = {
    title: 'My Plot'
};

// Create the plot using auto-generated ID
plotly.newPlot(plotContainer.id, data, layout);

// ✅ Use output() to display the plot
output(plotContainer);
```

```javascript
// ❌ INCORRECT - This won't display the plot
const plotContainer = createDiv({
    style: 'width: 100%; height: 400px;'
});
// ... create plot ...
plotly.newPlot(plotContainer.id, data, layout);

// ❌ Don't do this - plots won't be visible
plotContainer; // This doesn't work for DOM elements
```

```javascript
// ✅ CORRECT - D3 visualization
const d3 = require('d3');

const svg = d3.select(document.createElement('svg'))
    .attr('width', 400)
    .attr('height', 300);

// Create D3 visualization
svg.selectAll('circle')
    .data([10, 20, 30, 40, 50])
    .enter()
    .append('circle')
    .attr('cx', (d, i) => i * 50 + 25)
    .attr('cy', 150)
    .attr('r', d => d);

// ✅ Use output() to display the SVG
output(svg.node());
```

```javascript
// ✅ CORRECT - Canvas visualization with DOM helpers
// For canvas, can use createElement since it needs specific properties
const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
canvas.style.border = '1px solid var(--color-border)';
canvas.style.borderRadius = '4px';

const ctx = canvas.getContext('2d');
// Draw something...
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 100, 100);

// ✅ Use output() to display the canvas
output(canvas);
```

**Key Points for Visualizations:**
- **Use DOM helpers**: Prefer `createDiv()`, `createContainer()` over `document.createElement('div')`
- **Auto-generated IDs**: DOM helpers provide unique IDs essential for plotting libraries  
- **Consistent styling**: DOM helpers include theme-aware CSS variables
- **Call `output(element)`**: Always use explicit output for visualization elements
- **Don't rely on implicit returns**: Never use element as last statement without `output()`
- **Combine multiple visualizations**: Use `output(chart1, chart2, summary)`

### DOM Helper Best Practices

#### ✅ Preferred: Use DOM Helpers

```javascript
// ✅ BEST - Use createDiv for containers
const plotContainer = createDiv({
    style: 'width: 100%; height: 400px; border: 1px solid var(--color-border);'
});

// ✅ EXCELLENT - Use createContainer for styled layouts
const chartContainer = createContainer({
    style: 'border: 2px solid var(--color-primary);'
});

const title = createTitle('📊 My Visualization');
chartContainer.appendChild(title);

const plotDiv = createDiv({
    style: 'width: 100%; height: 400px; margin: 10px 0;'
});
chartContainer.appendChild(plotDiv);

// Plot using auto-generated ID
Plotly.newPlot(plotDiv.id, data, layout);
// Container auto-outputs itself
```

#### ❌ Avoid: Raw DOM Creation

```javascript
// ❌ AVOID - Manual DOM creation and styling
const plotContainer = createDiv({ // Use DOM helper instead
    style: 'width: 100%; height: 400px; border: 1px solid var(--color-border); border-radius: 8px;' // Use CSS variables
});
// ID is auto-generated by createDiv

// Still requires manual output
output(plotContainer);
```

#### When `document.createElement` is OK

```javascript
// ✅ OK - Special elements that need specific properties
const canvas = document.createElement('canvas');
canvas.width = 400;  // Canvas-specific property
canvas.height = 300; // Canvas-specific property

const video = document.createElement('video');
video.controls = true; // Video-specific property

// Still use output() for display
output(canvas);
output(video);
```

### output() vs outEl vs Auto-Outputting Helpers

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| `output(element)` | Most use cases (recommended) | Clear intent, flexible, error handling | Requires manual styling |
| `outEl.appendChild()` | Direct DOM manipulation | Fastest, direct control | Advanced use only, no validation |
| Auto-outputting helpers | Rich layouts, dashboards | Automatic styling, IDs | Less control over timing |

#### Quick Reference Examples

```javascript
// RECOMMENDED: Plot with output() function
const plotDiv = createDiv({ style: 'height: 400px; border: 1px solid var(--color-border);' });
Plotly.newPlot(plotDiv.id, data, layout);
output(plotDiv); // Always use output() for DOM elements

// ADVANCED: Direct DOM manipulation with outEl (only when needed)
if (outEl) {
    const container = createDiv();
    container.appendChild(createTitle('Complex Layout'));
    // ... build complex structure incrementally
    outEl.appendChild(container);
}

// LAYOUTS: Dashboard with auto-outputting container
const dashboard = createContainer();
const title = createTitle('📊 Analytics Dashboard');
dashboard.appendChild(title);

const plotDiv = createDiv({ style: 'height: 400px;' });
dashboard.appendChild(plotDiv);
Plotly.newPlot(plotDiv.id, data, layout);
// dashboard auto-outputs itself

const statsGrid = createKeyValueGrid({
    'Total': '1,234',
    'Average': '45.6'
});
dashboard.appendChild(statsGrid);
```

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
output.table(array);    // Force tabular display for arrays of objects
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

## Troubleshooting DOM Output

### Common Issues and Solutions

#### Issue 1: Plots/Visualizations Not Displaying

**Problem**: Created a plot but it doesn't appear in the notebook output.

```javascript
// ❌ WRONG - This won't display the plot
const plotContainer = createDiv(); // Use DOM helper
const Plotly = require('plotly.js-dist-min');
Plotly.newPlot(plotContainer, data, layout);
// Missing: output(plotContainer) or outEl.appendChild(plotContainer)
plotContainer; // Returning element as last statement doesn't work
```

**Solution**: Use the `output()` function explicitly.

```javascript
// ✅ CORRECT - Plot will be visible
const plotContainer = createDiv({
    style: 'width: 100%; height: 400px; margin: 10px; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);'
});

const Plotly = require('plotly.js-dist-min');
Plotly.newPlot(plotContainer.id, data, layout);

// Always use output() for DOM elements
output(plotContainer);
```

#### Issue 2: DOM Elements Not Appearing

**Problem**: Created DOM elements but they're not visible.

```javascript
// ❌ WRONG - Missing output() call
const div = createDiv({
    innerHTML: '<h3>My Content</h3>',
    style: 'padding: 20px;'
});
// Missing: output(div) or outEl.appendChild(div)
// Implicit return doesn't work for DOM elements
```

**Solution**: Always call `output()` for DOM elements.

```javascript
// ✅ CORRECT - DOM element will appear
const contentDiv = createDiv({
    innerHTML: '<h3>My Content</h3>',
    style: 'padding: 20px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);'
});
output(contentDiv); // Required for DOM elements to display
```

#### Issue 3: Auto-Outputting Containers Not Working

**Problem**: `createContainer()` or `createGradientContainer()` not displaying.

```javascript
// ❌ POTENTIAL ISSUE - Container may not auto-output in all contexts
const container = createContainer();
container.appendChild(someElement);
// Container might not appear automatically
```

**Solution**: Use explicit output or verify auto-output behavior.

```javascript
// ✅ METHOD 1 - Explicit output (always works)
const container = createOutElContainer();
container.appendChild(someElement);
output(container);

// ✅ METHOD 2 - Verify auto-output containers
const container = createContainer(); // Should auto-output
// If not appearing, add explicit output:
// output(container);
```

#### Issue 4: Multiple Outputs Not All Showing

**Problem**: Want to display multiple charts or elements but only some appear.

```javascript
// ❌ WRONG - Only the last output may be visible
const chart1 = createChart(data1);
const chart2 = createChart(data2);
output(chart1);
chart2; // This won't display
```

**Solution**: Use multiple `output()` calls or pass multiple arguments.

```javascript
// ✅ CORRECT - Both charts display
const chart1 = createChart(data1);
const chart2 = createChart(data2);
output(chart1);
output(chart2);

// ✅ ALSO CORRECT - Single call with multiple args
output(chart1, chart2);

// ✅ ALTERNATIVE - Multiple containers
const container1 = createContainer();
container1.appendChild(chart1);
const container2 = createContainer();
container2.appendChild(chart2);
```

#### Issue 5: Plotting Library Errors

**Problem**: Plotting library can't find the target element.

```javascript
// ❌ WRONG - Element not in DOM when plotting library runs
const plotDiv = createDiv(); // Auto-generates ID

// This may fail if element isn't in DOM yet
Plotly.newPlot('my-plot', data, layout);
output(plotDiv);
```

**Solution**: Use DOM helpers with auto-generated IDs or ensure element is in DOM first.

```javascript
// ✅ CORRECT - Use DOM helpers with auto-generated IDs
const container = createContainer();
const plotDiv = createDiv({
    style: 'width: 100%; height: 400px; margin: 10px; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);'
});
container.appendChild(plotDiv);

// plotDiv.id is automatically generated and element is in DOM
Plotly.newPlot(plotDiv.id, data, layout);

// ✅ ALTERNATIVE - Manual approach with proper timing
const plotDiv = createDiv({
    style: 'width: 100%; height: 400px;'
});
// ID is auto-generated by createDiv
plotDiv.style.height = '400px';

// Output first to ensure element is in DOM
output(plotDiv);

// Then create plot (may need setTimeout in some cases)
Plotly.newPlot(plotDiv.id, data, layout);
```

#### Issue 6: Console vs Output Confusion

**Problem**: Using `console.log()` expecting visual output.

```javascript
// ❌ WRONG - Charts won't render properly
const chart = createVisualization(data);
console.log(chart); // Shows object info, not the actual chart
```

**Solution**: Use `console.log()` for debugging, `output()` for visual content.

```javascript
// ✅ CORRECT - Proper separation of concerns
console.log("Creating chart with", data.length, "data points"); // Debug info

const chart = createVisualization(data);
output(chart); // Visual content

console.log("✅ Chart created successfully"); // Status update
```

### Debugging DOM Output

Use these patterns to debug DOM output issues:

```javascript
// Check if output function is available
if (typeof output === 'function') {
    console.log("✅ output() function is available");
    
    const testDiv = createDiv({
        innerHTML: '<p>Test content</p>',
        style: 'padding: 10px; border: 1px solid red;'
    });
    
    output(testDiv);
    console.log("✅ Test element output attempted");
} else {
    console.error("❌ output() function not available");
}

// Check if DOM helpers are working
try {
    const testContainer = createContainer();
    const testTitle = createTitle('DOM Helpers Test');
    testContainer.appendChild(testTitle);
    console.log("✅ DOM helpers working correctly");
} catch (error) {
    console.error("❌ DOM helpers error:", error.message);
}

// Check if outEl container is available (alternative method)
if (outEl) {
    console.log("✅ outEl container available");
    const testDiv = createDiv({
        innerHTML: '<p>outEl test</p>',
        style: 'background: yellow; padding: 10px;'
    });
    outEl.appendChild(testDiv);
} else {
    console.log("⚠️ outEl container not available");
}
```

### Best Practices

### 1. DOM Output Patterns

```javascript
// ✅ ALWAYS use output() for DOM elements
const chart = createVisualization(data);
output(chart); // Explicit and clear

// ✅ USE auto-outputting containers for layouts
const dashboard = createGradientContainer('Sales Dashboard');
dashboard.appendChild(createKeyValueGrid(metrics));
// Auto-output handles display

// ✅ COMBINE console.log() and output() appropriately
console.log("Processing data..."); // Status
const result = processData();
output(result); // Visual content
console.log("✅ Processing complete"); // Confirmation
```

### 2. Error Handling for Visualizations

```javascript
// ✅ WRAP plotting code in try-catch
const createSafeChart = (data) => {
    const container = createContainer();
    const plotDiv = createDiv({ style: 'height: 400px;' });
    container.appendChild(plotDiv);
    
    try {
        Plotly.newPlot(plotDiv.id, data, layout);
        console.log("✅ Chart created");
    } catch (error) {
        console.error("❌ Chart failed:", error);
        plotDiv.innerHTML = '<div>Chart failed to load</div>';
    }
};
```

### 3. Use Meaningful Export Names

```javascript
// Meaningful export names for clarity
exports.userData = { name: "John", age: 30 };
exports.calculatedFields = { total: 100, average: 25 };
exports.chartConfig = { type: 'bar', stacked: true };
```

## Understanding `outEl` - Advanced DOM Manipulation

The `outEl` variable is a special reference to the actual DOM container element where your cell's output is displayed. It's automatically injected into each code cell's execution context.

### What is `outEl`?

- `outEl` is a direct reference to the HTMLDivElement that contains your cell's output
- It's always available in code cells (unless there's a system error)
- It has a unique ID in the format `${cellId}-outEl`
- It's the same container that `output()` function uses internally

### When to Use `outEl` (Advanced Cases Only)

**Use `outEl` for:**
- Building complex DOM structures incrementally
- Direct DOM manipulation when libraries require it
- Advanced use cases where you need direct container access

**Example (Advanced):**
```javascript
// ✅ Advanced use case - building complex structure incrementally
if (outEl) {
    const container = createDiv();
    
    // Build structure step by step
    container.appendChild(createTitle('Dashboard'));
    
    const grid = createDiv({ style: 'display: grid; grid-template-columns: 1fr 1fr;' });
    grid.appendChild(createDiv({ innerHTML: 'Panel 1' }));
    grid.appendChild(createDiv({ innerHTML: 'Panel 2' }));
    container.appendChild(grid);
    
    // Finally add to output
    outEl.appendChild(container);
}
```

### When NOT to Use `outEl` (Most Cases)

**Use `output()` instead for:**
- Single DOM elements ✅ `output(element)`
- Multiple elements ✅ `output(el1, el2)`
- Standard visualizations ✅ `output(plotDiv)`
- Most common use cases

**Why `output()` is better:**
- Cleaner, more consistent API
- Better error handling and validation
- Works with multiple elements
- More maintainable code

### outEl vs output() - Technical Details

```javascript
// ❌ Don't do this for simple elements:
if (outEl) {
    outEl.appendChild(myElement);
}

// ✅ Do this instead:
output(myElement);
```

**Key differences:**
- `output()` provides better error handling
- `output()` supports multiple arguments: `output(el1, el2, el3)`
- `output()` is the recommended approach for DOM elements
- `outEl` should only be used for advanced DOM manipulation cases
- Automatic element validation
- Cleaner API for multiple outputs

### Best Practices with `outEl`

1. **Always check availability**: `if (outEl)` (though it's usually available)
2. **Use DOM helpers**: `createDiv()` instead of `document.createElement()`
3. **One element per cell**: For multiple elements, use `output()` or containers
4. **Direct manipulation**: Perfect for when you need to build DOM structure incrementally

```javascript
// ✅ Good example - building a complex element
if (outEl) {
    const dashboard = createContainer();
    dashboard.appendChild(createTitle('My Dashboard'));
    
    const plotArea = createDiv({ style: 'height: 300px;' });
    dashboard.appendChild(plotArea);
    
    // Add plot to the plot area
    Plotly.newPlot(plotArea.id, data, layout);
    
    // Add the whole dashboard to output
    outEl.appendChild(dashboard);
}
```

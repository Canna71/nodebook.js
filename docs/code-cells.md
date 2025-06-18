# Code Cells Guide

Code cells in NotebookJS provide a powerful JavaScript execution environment with reactive capabilities, DOM manipulation, and module support. This guide covers everything you can do in a code cell.

## Table of Contents

- [Basic JavaScript Execution](#basic-javascript-execution)
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

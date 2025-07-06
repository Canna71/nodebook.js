# Nodebook.js Documentation

Welcome to **Nodebook.js** - the next generation of interactive notebooks with reactive programming, rich data visualization, and seamless JavaScript execution. This documentation will guide you through all features and capabilities.

<img src="CleanShot 2025-07-03 at 18.21.10@2x.png" alt="Nodebook.js Main Interface" width="600">

*The main Nodebook.js interface showing code cells, markdown cells, and live output*

## What is Nodebook.js?

Nodebook.js is a reactive notebook application that combines the best of interactive computing with modern web technologies. Unlike traditional notebooks, Nodebook.js features a **reactive system** where cells automatically update when their dependencies change, creating a live, dynamic environment for data analysis, visualization, and prototyping.

### Key Features

🔬 **Reactive Programming**: Variables automatically update throughout your notebook when dependencies change  
📊 **Rich Data Visualization**: Built-in support for Plotly, D3, and custom visualizations  
⚡ **Live JavaScript**: Full ES6+ JavaScript execution with modern libraries  
📝 **Enhanced Markdown**: Dynamic markdown with variable interpolation  
🔧 **Modular System**: Easy access to popular data science libraries  
🤖 **AI-Powered**: Generate code and notebooks with built-in AI assistance (BYOK)

## Getting Started

### Accessing Documentation

You can access this documentation in several ways:

1. **From the Homepage**: Click the "View documentation" button in the Start section
2. **From the Toolbar**: Click the 📖 (book) icon in the main toolbar  
3. **Keyboard Shortcut**: Press `F1` anywhere in the application
4. **Command Palette**: Use the "View Documentation" command

### Quick Start Guide

1. **Create a New Notebook**: Click "New file..." on the homepage or press `Ctrl+N`
2. **Add Cells**: Use the + button to add code or markdown cells
3. **Write Code**: Enter JavaScript code in code cells
4. **Execute**: Click the ▶️ button or press `Shift+Enter` to run cells
5. **Save**: Press `Ctrl+S` to save your notebook

## User Interface Overview

<img src="CleanShot 2025-07-03 at 18.28.35@2x.png" alt="Nodebook.js Homepage" width="600">

*The Nodebook.js homepage with quick start options, recent files, and examples*

### Main Interface Components

#### 1. **Notebook Editor**
The main editing area where you create and modify cells:

<img src="CleanShot 2025-07-03 at 18.32.12@2x.png" alt="Nodebook.js Notebook Editor" width="600">

*Different cell types: Code cells (JavaScript), Markdown cells, and Formula cells*

- **Input Cells**: Allow to edit variable directly
- **Code Cells**: Execute JavaScript with full reactive capabilities
- **Markdown Cells**: Rich text with dynamic variable interpolation  
- **Formula Cells**: Specialized cells for calculations and expressions

#### 2. **Code Cell Controls**

<img src="CleanShot 2025-07-03 at 18.36.04@2x.png" alt="Nodebook.js Code Cell Controls" width="600">

*Cell controls showing execute button, cell type selector, and options*

- **Execute Button (▶️)**: Run the current cell
- **Static mode**: Make the cell static (orange border) to prevent automatic updates

#### 3. **Output Areas**
Each code cell has a dedicated output area that can display:
- **Text Output**: Simple text output with `output("Hello, World!")`
- **Object Property Grid**: Interactive object inspector with `output(object)` - editable for reactive values
- **Data Tables**: Display arrays of objects in tabular format with `output.table(data)`
- **Danfojs DataFrames**: Rich table views with `output(dataFrame)` (works also with DataSeries)
- **Visualizations**: Charts, plots, and custom graphics using libraries like Plotly, D3, etc.
- **DOM Elements**: Custom HTML and interactive components using DOM helpers


<img src="CleanShot 2025-07-06 at 17.31.09@2x.png" alt="Nodebook.js Output Areas" width="600">

### Reactive System in Action

The reactive system is what makes Nodebook.js special. When you change a value in one cell, all dependent cells automatically update:

1. **Cell A** exports a value: `exports.price = 100`
2. **Cell B** uses that value: `exports.total = price * 1.08`
3. **Cell C** displays the result: `output("Total: $" + total)`

When you change `price` in Cell A, Cells B and C automatically recalculate!

## Your First Notebook

Let's create a simple data analysis notebook:

```javascript
// Cell 1: Import data
const salesData = [
  { product: 'A', sales: 1000, month: 'Jan' },
  { product: 'B', sales: 1500, month: 'Jan' },
  { product: 'A', sales: 1200, month: 'Feb' }
];
exports.salesData = salesData;
```

```javascript
// Cell 2: Calculate totals (automatically updates when salesData changes)
const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
exports.totalSales = totalSales;
console.log("Total Sales:", totalSales);
```

```markdown
<!-- Cell 3: Display results in markdown -->
# Sales Analysis Results

Total sales across all products: **${{totalSales.toLocaleString()}}**

This value updates automatically when the data changes!
```

## Core Concepts

### [Code Cells](./code-cells.md)
Learn how to write powerful JavaScript code with reactive capabilities, DOM manipulation, and rich output options.

### [Markdown Cells](./markdown-cells.md)  
Create rich documentation with dynamic variable interpolation that updates automatically.

### [Input Cells](./input-cells.md)
Create interactive UI controls like sliders, inputs, and checkboxes that modify reactive values directly.

### [Formula Syntax](./formula-syntax-guide.md)
Use specialized formula cells for quick calculations and data transformations.

### [Async/Await Guide](./async-await-guide.md)
Learn how to properly use async/await patterns in Nodebook.js for asynchronous operations.

## Advanced Features

### [Modules & Libraries](./modules.md)
Access powerful libraries like Plotly, D3, Math.js, and data manipulation tools. Many libraries like `math`, `dfd` (danfojs), `tf` (tensorflow), and `Plotly` are preloaded as global variables.

### [Per-Notebook Modules](./per-notebook-modules.md)
Learn how to install and use notebook-specific modules for specialized libraries and packages.

### [Storage System](./storage-system.md)
Manage persistent data within your notebooks using the built-in key-value storage system.

### [Static Code Cells](./static-code-cells.md)
Learn about static code cells for side effects and manual execution control.

### [Reading Mode](./reading-mode.md)
Discover how to use Reading Mode for clean, distraction-free viewing and presentation of notebooks.

## AI Integration

Nodebook.js includes powerful AI features (Bring Your Own Key):

- **Generate Code**: Get AI help writing complex data analysis code
- **Create Notebooks**: Generate entire notebooks from natural language descriptions
- **Debug Assistance**: Get help fixing errors and optimizing code
- **Explain Code**: Understand complex code snippets with AI explanations

## Technical Guides

### [Formatting System](./formatting-system.md)
Understanding the text formatting and styling capabilities in Nodebook.js.

### [Property Grid](./property-grid.md)
Learn about the property grid feature for object inspection and editing.

## Platform-Specific Information

### [File Associations](./file-associations.md)
Set up file associations so you can double-click .nbjs files to open them in Nodebook.js.

### [macOS File Association Troubleshooting](./macos-file-association-troubleshooting.md)
Troubleshooting guide for file association issues on macOS.

## Examples & Tutorials

### Data Analysis Examples
![Data Analysis Example](./images/data-analysis-example.png)
*A complete data analysis workflow with data loading, processing, and visualization*

- **Sales Analysis**: Process sales data and create interactive dashboards
- **Time Series**: Analyze temporal data with trend detection
- **Statistical Analysis**: Perform statistical tests and generate reports

### Visualization Examples  
![Chart Examples](./images/chart-examples.png)
*Various chart types created with Plotly integration*

- **Interactive Charts**: Create responsive, interactive visualizations
- **Dashboard Creation**: Build multi-panel dashboards
- **Custom Visualizations**: Use D3.js for specialized graphics

### Machine Learning Examples
![ML Example](./images/ml-example.png)
*A machine learning workflow with data preparation and model training*

- **Linear Regression**: Implement and visualize regression models
- **Data Preprocessing**: Clean and prepare data for analysis
- **Model Evaluation**: Assess model performance with metrics and plots

## Tips for Success

### Best Practices
![Best Practices](./images/best-practices.png)
*Examples of well-structured notebooks with clear organization*

1. **Structure Your Notebook**: Use markdown cells to create clear sections
2. **Name Your Variables**: Use descriptive names for exported variables
3. **Document Your Code**: Add comments and markdown explanations
4. **Use the Reactive System**: Let cells update automatically instead of copying values
5. **Leverage AI**: Use the AI assistant to speed up development

### Common Patterns
![Common Patterns](./images/common-patterns.png)
*Demonstration of common notebook patterns and workflows*

- **Data Pipeline**: Load → Transform → Analyze → Visualize
- **Iterative Analysis**: Explore → Hypothesis → Test → Refine
- **Reporting**: Analysis → Summary → Export

### Performance Tips
- Use static cells for expensive operations
- Cache large datasets in exported variables
- Use efficient data structures and algorithms
- Leverage built-in modules for heavy computations

## Keyboard Shortcuts

![Keyboard Shortcuts](./images/keyboard-shortcuts.png)
*Visual guide to essential keyboard shortcuts*

| Shortcut | Action |
|----------|--------|
| `Shift + Enter` | Execute current cell |
| `Ctrl/Cmd + Enter` | Execute cell and stay |
| `Alt + Enter` | Execute and insert new cell |
| `Ctrl/Cmd + S` | Save notebook |
| `Ctrl/Cmd + O` | Open notebook |
| `Ctrl/Cmd + N` | New notebook |

## Getting Help

### Community Resources
- **GitHub Issues**: Report bugs and request features
- **Documentation**: This comprehensive guide
- **Examples**: Learn from pre-built notebooks
- **AI Assistant**: Get instant help within the application

### Support
If you need help:
1. Check this documentation first
2. Try the examples to see working code
3. Use the AI assistant for code generation
4. Search existing GitHub issues
5. Create a new issue with details about your problem

---

**Ready to start?** Click "New file..." on the homepage and create your first notebook!

![Get Started](./images/get-started.png)
*Your journey with Nodebook.js begins here*

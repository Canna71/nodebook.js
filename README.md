<div align="center">
  <h1>
    <img src="./build-resources/icons/icon.png" alt="Nodebook.js Icon" width="48" height="48" style="vertical-align: middle; margin-right: 12px;">
    Nodebook.js
  </h1>
  
  **The next generation of interactive notebooks with reactive programming and live JavaScript execution.**
</div>



[![Version](https://img.shields.io/badge/version-0.8.0-blue.svg)](https://github.com/gcannata/nodebook.js)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-latest-orange.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)

![Nodebook.js Main Interface](./docs/CleanShot%202025-07-03%20at%2018.21.10@2x.png)
*The main Nodebook.js interface showcasing reactive code cells, rich outputs, and live data visualization*

## 🚀 What is Nodebook.js?

Nodebook.js is a modern reactive notebook application that revolutionizes interactive computing. Unlike traditional notebooks, Nodebook.js features a **reactive system** where cells automatically update when their dependencies change, creating a truly live and dynamic environment for:

- 📊 **Data Analysis & Visualization**
- 🧪 **Scientific Computing**
- 📈 **Financial Modeling**
- 🤖 **AI/ML Prototyping**
- 📚 **Educational Content**
- 🛠️ **Rapid Prototyping**

## ✨ Key Features

### 🔬 **Reactive Programming**
Variables and computations automatically propagate changes throughout your notebook. When you update a value, all dependent cells re-execute automatically.

```javascript
// Cell 1: Define a variable
exports.basePrice = 100;

// Cell 2: Automatically updates when basePrice changes
exports.totalPrice = basePrice * 1.08; // Tax included
```

### ⚡ **Live JavaScript Execution**
Full ES6+ JavaScript support with modern async/await, modules, and rich standard library access.

### 📊 **Rich Data Visualization**
Built-in support for popular visualization libraries:
- **Plotly.js** - Interactive charts and graphs
- **D3.js** - Custom data visualizations
- **Chart.js** - Beautiful charts
- **DataFrames** - Tabular data with danfo.js

![Data Visualization Example](./docs/images/visualization-example.png)
*Interactive charts and data tables rendered directly in notebook cells*

### 📝 **Enhanced Markdown**
Dynamic markdown with variable interpolation, LaTeX math, and rich formatting.

```markdown
The current price is ${{totalPrice}} (base: ${{basePrice}})

$$E = mc^2$$
```

### 🔧 **Modular System**
Easy access to popular libraries:
```javascript
// Pre-loaded libraries
dfd.readCSV('data.csv').then(df => {
    output.table(df);
});

// TensorFlow for machine learning
const model = tf.sequential({...});

// Shell integration with zx
await $`ls -la`;
```

### 🤖 **AI-Powered Development**
- Generate code cells with AI assistance
- Smart code completions
- Intelligent error detection and suggestions

### 🎨 **Modern Interface**
- Clean, intuitive design
- Dark/light theme support
- Responsive layout
- Reading mode for presentations

![Homepage Interface](./docs/images/homepage.png)
*Clean and modern homepage with quick access to recent files and examples*

## 🛠️ Installation & Setup

### System Requirements
- **Windows 10+** / **macOS 10.14+** / **Linux (Ubuntu 18.04+)**
- **Node.js 16+** (for development)
- **4GB RAM** minimum, 8GB recommended
- **500MB** disk space

### Download
1. Visit the [Releases page](https://github.com/gcannata/nodebook.js/releases)
2. Download the installer for your platform
3. Run the installer and follow the setup wizard

### Development Setup
```bash
# Clone the repository
git clone https://github.com/gcannata/nodebook.js.git
cd nodebook.js

# Install dependencies
pnpm install

# Start development server
pnpm start

# Build for production
pnpm run make
```

## 📚 Documentation

### 📖 **Complete Documentation**
Access the full **[documentation](./docs/index.md)** or within the application:
- Press `Ctrl/Cmd+,` for instant help
- Click the 📖 icon in the toolbar
- Use "View Documentation" command

### 🎯 **Quick Start Guides**
- **[Code Cells Guide](./docs/code-cells.md)** - JavaScript execution, modules, and outputs
- **[Markdown Cells](./docs/markdown-cells.md)** - Rich text, LaTeX, and variable interpolation
- **[Formula System](./docs/formula-syntax-guide.md)** - Excel-like formulas with reactive updates
- **[Storage System](./docs/storage-system.md)** - Data persistence and state management
- **[Module System](./docs/modules.md)** - Using external libraries and packages

### 🔧 **Advanced Features**
- **[Static Code Cells](./docs/static-code-cells.md)** - Manual execution for side effects
- **[Reading Mode](./docs/reading-mode.md)** - Presentation mode for sharing
- **[Async/Await Guide](./docs/async-await-guide.md)** - Handling asynchronous operations

## 🎮 Quick Start

1. **Create a New Notebook**
   ```
   File → New Notebook (Ctrl+N)
   ```

2. **Add Your First Code Cell**
   ```javascript
   const greeting = "Hello, Nodebook.js!";
   console.log(greeting);
   output(greeting);
   ```

3. **Add a Markdown Cell**
   ```markdown
   # My First Notebook
   The greeting is: **{{greeting}}**
   ```

4. **Execute and See Magic**
   - Press `Shift+Enter` to run cells
   - Watch variables update across cells automatically
   - See rich outputs and interactive visualizations

![Getting Started Example](./docs/images/getting-started.png)
*Your first notebook showing reactive variables and rich outputs*

## 🔧 Built With

- **[Electron](https://electronjs.org/)** - Cross-platform desktop app framework
- **[React](https://reactjs.org/)** - Modern UI library
- **[TypeScript](https://typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[CodeMirror](https://codemirror.net/)** - Advanced code editor
- **[Github Copilot](https://github.com/features/copilot)** - AI-powered code suggestions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/gcannata/nodebook.js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gcannata/nodebook.js/discussions)
- **Email**: gcannata@gmail.com

## 🙏 Acknowledgments

- Inspired by Jupyter Notebooks and Observable
- Thanks to all contributors and beta testers
- Built with amazing open-source technologies

---

**Made with ❤️ by [Gabriele Cannata](https://github.com/Canna71)**



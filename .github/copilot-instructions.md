# GitHub Copilot Instructions for NotebookJS

## Project Overview
NotebookJS is a reactive notebook application built with React, TypeScript, and Electron. It features a reactive programming system with code cells, formulas, and data visualization capabilities.

## Architecture Guidelines

### Core Systems
- **Reactive System**: Located in `/src/Engine/ReactiveSystem.ts` - handles reactive values, formulas, and code execution
- **Components**: Located in `/src/components/` - React components for UI
- **Types**: Located in `/src/Types/` - TypeScript type definitions

## Reactive System Architecture

NotebookJS uses a custom reactive system that automatically manages dependencies and updates between notebook cells.

### Core Components

#### ReactiveStore
- **Central state manager**: Manages all reactive values by name
- **Automatic dependency tracking**: Tracks relationships between values
- **Subscription system**: Notifies subscribers when values change
- **Computed values**: Supports reactive formulas and derived values

#### ReactiveValue<T>
- **Individual reactive variable**: Wraps any value type with reactive capabilities
- **Subscribers**: Maintains list of callbacks that run when value changes
- **Dependencies**: Tracks other ReactiveValues this depends on
- **Lazy computation**: Only computes when accessed (for computed values)

#### Key Engines
- **CodeCellEngine**: Executes JavaScript code cells and manages exports/dependencies
- **FormulaEngine**: Processes formula cells with enhanced JavaScript expressions
- **ReactiveFormulaEngine**: Legacy formula engine with $variable syntax

### State Management Flow

1. **Value Definition**: `reactiveStore.define(name, value)` creates/updates reactive values
2. **Dependency Tracking**: Code execution automatically tracks variable access
3. **Propagation**: Value changes trigger subscription callbacks in dependent cells
4. **Re-execution**: Dependent code cells automatically re-execute with new values

### Reactive Value Lifecycle

```typescript
// 1. Creation - Value is defined in the store
reactiveStore.define('myVar', 42);

// 2. Subscription - Components/cells subscribe to changes
const unsubscribe = reactiveStore.subscribe('myVar', (newValue) => {
    console.log('myVar changed to:', newValue);
});

// 3. Access - Value is read (triggers computation if needed)
const currentValue = reactiveStore.getValue('myVar');

// 4. Update - Value changes, subscribers are notified
reactiveStore.define('myVar', 100); // Triggers all subscribers

// 5. Cleanup - Unsubscribe to prevent memory leaks
unsubscribe();
```

### Dependency Tracking

The system automatically tracks dependencies during code execution:

```javascript
// Cell 1: Exports a value
exports.basePrice = 100;

// Cell 2: Depends on basePrice (tracked automatically)
exports.totalPrice = basePrice * 1.08; // System knows this depends on basePrice

// When basePrice changes, Cell 2 automatically re-executes
```

### Memory Management

- **Subscription cleanup**: Unsubscribe functions prevent memory leaks
- **Dependency cleanup**: Old dependencies are removed when cells change
- **Weak references**: Prevent circular dependency memory issues

### React Integration

#### useReactiveValue Hook
```typescript
// Subscribe to reactive value in React components
const [value, setValue] = useReactiveValue('variableName', initialValue);

// Automatically updates component when value changes
// setValue updates the reactive store and triggers re-renders
```

#### useReactiveSystem Hook
```typescript
// Access reactive engines in components
const { reactiveStore, codeCellEngine, formulaEngine } = useReactiveSystem();
```

### Execution Model

1. **Manual Trigger**: User executes a code cell (clicks run or commits changes)
2. **Dependency Detection**: System tracks which variables the cell reads
3. **Export Processing**: Cell exports are stored in reactive store
4. **Propagation**: Dependent cells automatically re-execute in correct order
5. **UI Updates**: Components re-render with new reactive values

### Coding Standards

#### TypeScript
- Use strict TypeScript with proper type definitions
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

#### React Components
- Use functional components with hooks
- Prefer named exports over default exports
- Use proper prop typing with interfaces
- Handle loading and error states appropriately

#### UI Components
- Do not modify files in `src/components/ui/` as these come from shadcn/ui
- Use existing shadcn components as-is for consistency
- If needed, lookup which conponents are available in the shadcn/ui documentation

#### Styling
- Use Tailwind CSS classes for styling
- Try not to use explicit color, but use one from variables defined in `src/styles.css`
- Follow consistent color scheme:
  - `text-foreground` for main text
  - `text-secondary-foreground` for secondary text
  - `text-accent-foreground` for highlighted text
  - `bg-background` for main backgrounds
  - `bg-background-secondary` for secondary backgrounds
  - `border-border` for borders


#### State Management
- Use the ReactiveProvider context for reactive state
- Use `useReactiveValue` hook for reactive variables
- Use `useReactiveSystem` hook to access engines
- Handle dependencies and exports properly in code cells

#### Error Handling
- Always wrap potentially failing operations in try-catch
- Log errors using `anylogger` with appropriate log levels and named logger. Avoid using console.log directly
- Provide user-friendly error messages
- Handle edge cases gracefully

#### Logging
- Use `anylogger` for logging
- Use appropriate log levels: `debug`, `info`, `warn`, `error`
- Use named loggers for different components or systems
- Avoid using `console.log` directly, prefer `logger.debug`, `logger.info`, etc.

### Troubleshooting
- Avoid trying to build yourself the application, ask me to do it 
- To troubleshoot issues, insert log messages in key points and ask me to report them to yourself
- Use the `anylogger` system for consistent logging
- If you need to isolate your specific log messages, use a unique logger name for your component or system

#### Reactive System Debugging
- **Dependency tracking**: Use `codeCellEngine.getCellDependencies(cellId)` to see what a cell depends on
- **Export inspection**: Use `codeCellEngine.getCellExports(cellId)` to see what a cell exports
- **Reactive store state**: Use `reactiveStore.getValue(name)` to check current reactive values
- **Execution count tracking**: Use `__cell_${cellId}_execution` reactive value to track cell executions
- **Subscription leaks**: Watch for cells re-executing on old dependencies (indicates cleanup issues)
- **Circular dependencies**: Look for infinite execution loops between cells

#### Code Cell Engine
- Use `executeCodeCell` for initial execution (with optional `isStatic` parameter)
- Use `reExecuteCodeCell` for re-running existing cells (with optional `isStatic` parameter)
- Use `updateCodeCell` for code changes without execution
- Handle exports, dependencies, and console output properly

#### Static Code Cells
- **Static code cells**: Toggle mode where cells execute manually only
- **Implementation**: `isStatic?: boolean` flag in `CodeCellDefinition`
- **Behavior**: Can read/write reactive store but don't auto-execute on dependency changes
- **Use cases**: Side effects, expensive operations, debugging, runbooks
- **UI**: Checkbox toggle below editor (edit mode only), orange border/background styling
- **Default**: New cells are reactive (not static) by default
- **Initialization**: Static cells skip automatic execution during notebook load
- **Dependencies**: Static cells track dependencies but ignore dependency changes

#### Reactive Dependency Management
- **Subscription cleanup**: Code cells properly clean up old dependency subscriptions when dependencies change
- **Implementation**: `unsubscribeFunctions` array tracks active subscriptions for cleanup
- **Bug prevention**: Prevents cells from re-executing on old dependencies they no longer use
- **Memory management**: Prevents memory leaks from accumulated subscriptions

#### Module System
- Register modules using `moduleRegistry.registerModule`
- Use secure require function for module loading
- Cache modules appropriately
- Handle module loading errors gracefully

#### DOM Helper System (Critical - Do Not Modify)
- **Container ID Pattern**: All DOM output containers use predictable ID `${cellId}-outEl`
- **ID-based Lookup**: Always use `document.getElementById()` to find containers, never rely on React refs
- **Container Clearing**: Always clear container with `container.innerHTML = ''` before execution
- **Three Access Patterns**:
  1. `outEl` - Direct access to DOM container (finds by ID)
  2. `output(element)` - Manual output function (finds container by ID)
  3. `createContainer()` - Auto-outputting helpers (finds container by ID via bound functions)
- **Timing Independence**: ID-based approach avoids React ref timing issues
- **Consistent Clearing**: Container is cleared at start of every execution path
- **Bound Helpers**: `createBoundDomHelpers()` creates auto-outputting versions for code cells

**Critical Implementation Notes**:
- Never use React refs for DOM output container access during code execution
- Always use `${cellId}-outEl` pattern for container IDs
- Clear containers in: CodeCell component, executeCodeCell, reExecuteCodeCell, reactive execution
- Bound helpers must use the output function parameter, not direct container access

### DOM Helper Patterns (Critical System)
```javascript
// ✅ CORRECT: Use outEl for direct DOM access
if (outEl) {
    outEl.innerHTML = '<div>Direct content</div>';
    outEl.appendChild(someElement);
}

// ✅ CORRECT: Use output() for manual DOM output
const element = createDiv({ innerHTML: '<p>Content</p>' });
output(element);

// ✅ CORRECT: Use auto-outputting helpers for containers
const container = createContainer(); // Automatically appears in DOM
container.appendChild(createTitle('My Title'));

// ✅ CORRECT: Access containers by ID in implementation code
const containerId = `${cellId}-outEl`;
const container = document.getElementById(containerId);
if (container) {
    container.innerHTML = ''; // Clear before execution
    container.appendChild(newContent);
}

// ❌ WRONG: Don't use React refs during code execution
if (outputContainerRef.current) { // This can be null due to timing
    outputContainerRef.current.innerHTML = '';
}

// ❌ WRONG: Don't skip container clearing
container.appendChild(newContent); // Will accumulate with previous content

// ❌ WRONG: Don't hardcode container access
const container = document.querySelector('.output-container'); // Not reliable
```

### DOM Container Lifecycle
```javascript
// 1. Container created with predictable ID in React component
<div id={`${definition.id}-outEl`} ref={outputContainerRef} />

// 2. Container found and cleared before execution
const containerId = `${cellId}-outEl`;
const container = document.getElementById(containerId);
if (container) container.innerHTML = '';

// 3. DOM helpers use same ID pattern for access
// - outEl: Direct container access
// - output(): Manual element output
// - createContainer(): Auto-outputting helpers

// 4. Container cleared again on next execution (prevents accumulation)
```

### File Organization
```
src/
├── Components/          # React components
├── Engine/             # Core reactive system
├── Types/              # TypeScript definitions
├── Utils/              # Utility functions
└── main.tsx           # Application entry point
```

### Naming Conventions
- Components: PascalCase (e.g., `CodeCell`, `ObjectDisplay`)
- Files: PascalCase for components, camelCase for utilities
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase with descriptive names

### Import Guidelines
- Use absolute imports with `@/` prefix for src folder
- Group imports: React first, then libraries, then local imports
- Use named imports when possible
- Import types separately when needed

### Performance Considerations
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid unnecessary re-renders in reactive components
- Cache expensive computations appropriately

### Testing Approach
- Write unit tests for utility functions
- Test component behavior with React Testing Library
- Mock external dependencies appropriately
- Test error conditions and edge cases

## Specific Patterns

### Reactive Store Management
```typescript
// Direct reactive store access
const { reactiveStore } = useReactiveSystem();

// Define a new reactive value
reactiveStore.define('variableName', initialValue);

// Get current value (no subscription)
const currentValue = reactiveStore.getValue('variableName');

// Subscribe to changes (manual subscription)
const unsubscribe = reactiveStore.subscribe('variableName', (newValue) => {
    console.log('Value changed:', newValue);
});

// Always clean up subscriptions
useEffect(() => {
    return unsubscribe;
}, []);
```

### Reactive Values in Components
```typescript
// Define reactive value with automatic React integration
const [value, setValue] = useReactiveValue('variableName', initialValue);

// Subscribe to execution count for tracking cell execution
const [executionCount] = useReactiveValue(`__cell_${cellId}_execution`, 0);

// Track cell state changes
const [cellState, setCellState] = useReactiveValue(`__cell_${cellId}_state`, 'idle');
```

### Dependency Tracking Patterns
```typescript
// Code cells automatically track dependencies during execution
// Proxy object captures variable access in the with() statement

// Example: This cell will track dependencies on 'basePrice' and 'taxRate'
const code = `
    exports.totalPrice = basePrice * (1 + taxRate);
    exports.discountPrice = totalPrice * 0.9;
`;

// The system automatically:
// 1. Detects basePrice and taxRate as dependencies
// 2. Sets up subscriptions to re-execute when they change
// 3. Exports totalPrice and discountPrice to reactive store
```

### Code Cell Execution
```typescript
// Update code
codeCellEngine.updateCodeCell(cellId, newCode);

// Execute cell (pass isStatic flag from cell definition)
const codeCell = cell as CodeCellDefinition;
codeCellEngine.executeCodeCell(cellId, code, outputContainer, codeCell.isStatic || false);
codeCellEngine.reExecuteCodeCell(cellId, codeCell.isStatic || false);

// Get results
const exports = codeCellEngine.getCellExports(cellId);
const dependencies = codeCellEngine.getCellDependencies(cellId);
```

### Static Code Cell Patterns
```typescript
// Check if cell is static in components
const isStatic = definition.isStatic || false;

// Static cell styling
const cellClassName = `cell code-cell border rounded-lg mb-4 overflow-hidden ${
    isStatic 
        ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20' 
        : 'border-border bg-background'
}`;

// Handle static toggle in UI
const onStaticToggle = (newIsStatic: boolean) => {
    setIsStatic(newIsStatic);
    updateCell(cellId, { isStatic: newIsStatic }, 'Toggle static mode');
};

// Skip initialization for static cells
if (cell.type === 'code') {
    const codeCell = cell as CodeCellDefinition;
    if (!codeCell.isStatic) {
        await codeCellEngine.executeCodeCell(cellId, code, container, false);
    }
}
const exports = codeCellEngine.getCellExports(cellId);
const dependencies = codeCellEngine.getCellDependencies(cellId);
```

### Component Structure
```tsx
export function ComponentName({ prop1, prop2 }: ComponentProps) {
    const { reactiveSystem } = useReactiveSystem();
    const [state, setState] = useState();
    
    useEffect(() => {
        // Setup and cleanup
        return () => {
            // Cleanup
        };
    }, [dependencies]);
    
    return (
        <div className="component-container">
            {/* Component content */}
        </div>
    );
}
```

## Common Patterns to Follow
1. Always handle initialization states in components
2. Use proper TypeScript types for all function parameters
3. Implement proper cleanup in useEffect hooks
4. Handle async operations with proper error boundaries
5. Use consistent logging with appropriate log levels
6. Follow the established reactive patterns for state management
7. **Always pass isStatic flag** when calling executeCodeCell/reExecuteCodeCell
8. **Check cell.isStatic** before auto-executing cells during initialization
9. **Use static cells** for side effects, expensive operations, or manual control
10. **Clean up subscriptions** when cell dependencies change to prevent memory leaks
11. **Use ID-based DOM access** for code cell containers (`${cellId}-outEl`) to avoid timing issues
12. **Clear DOM containers** before every execution to prevent content accumulation

## Avoid These Patterns
- Don't use `any` type unless absolutely necessary
- Don't mutate props directly
- Don't forget to handle loading and error states
- Don't use direct DOM manipulation outside the established DOM helper system
- Don't bypass the reactive system for state management
- Don't forget to clean up subscriptions and event listeners
- **Don't use React refs for DOM output access during code execution** (timing issues)
- **Don't modify the DOM container ID pattern** (`${cellId}-outEl`) without updating all access points
- **Don't skip container clearing** before code execution (causes content accumulation)

### Building
The solution is using pnpm as the package manager. To build the project, run:
```zsh
pnpm run make
```

### General rules

- Chenge the code less as possible
- If some requirements are not clear, ask for clarification
- Use the existing code as a reference for new features
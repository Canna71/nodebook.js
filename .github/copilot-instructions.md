# GitHub Copilot Instructions for NotebookJS

## Project Overview
NotebookJS is a reactive notebook application built with React, TypeScript, and Electron. It features a reactive programming system with code cells, formulas, and data visualization capabilities.

## Architecture Guidelines

### Core Systems
- **Reactive System**: Located in `/src/Engine/RactiveSystem.ts` - handles reactive values, formulas, and code execution
- **Components**: Located in `/src/components/` - React components for UI
- **Types**: Located in `/src/Types/` - TypeScript type definitions

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
- Log errors using `anylogger` with appropriate log levels
- Provide user-friendly error messages
- Handle edge cases gracefully

#### Code Cell Engine
- Use `executeCodeCell` for initial execution
- Use `reExecuteCodeCell` for re-running existing cells
- Use `updateCodeCell` for code changes without execution
- Handle exports, dependencies, and console output properly

#### Module System
- Register modules using `moduleRegistry.registerModule`
- Use secure require function for module loading
- Cache modules appropriately
- Handle module loading errors gracefully

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

### Reactive Values
```typescript
// Define reactive value
const [value, setValue] = useReactiveValue('variableName', initialValue);

// Subscribe to execution count
const [executionCount] = useReactiveValue(`__cell_${cellId}_execution`, 0);
```

### Code Cell Execution
```typescript
// Update code
codeCellEngine.updateCodeCell(cellId, newCode);

// Execute cell
codeCellEngine.reExecuteCodeCell(cellId);

// Get results
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

## Avoid These Patterns
- Don't use `any` type unless absolutely necessary
- Don't mutate props directly
- Don't forget to handle loading and error states
- Don't use direct DOM manipulation
- Don't bypass the reactive system for state management
- Don't forget to clean up subscriptions and event listeners

### Building
The solution is using pnpm as the package manager. To build the project, run:
```zsh
pnpm run make
```


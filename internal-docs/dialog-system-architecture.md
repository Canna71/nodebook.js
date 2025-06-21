# Dialog System Architecture

## Overview

The Nodebook.js dialog system is built on a unified architecture that provides consistent dialog experiences across the application. This document describes the technical architecture, design decisions, and implementation details.

## System Components

### 1. AppDialogProvider (Context Provider)

**Location**: `src/components/AppDialogProvider.tsx`

The central piece of the dialog system. It:
- Manages all dialog state in a single React context
- Provides both direct control methods and promise-based APIs
- Handles dialog lifecycle (open, close, state updates)
- Integrates with the helper system for non-React usage

**Key Interfaces**:
```typescript
interface AppDialogContextType {
  // Direct control methods (for React components)
  showErrorDialog: (config: AppErrorDialogConfig) => void;
  showConfirmDialog: (config: AppConfirmDialogConfig & Callbacks) => void;
  showInfoDialog: (config: AppInfoDialogConfig) => void;
  showPromptDialog: (config: AppPromptDialogConfig & Callbacks) => void;
  showProgressDialog: (config: AppProgressDialogConfig) => void;
  updateProgress: (progressValue?: number, message?: string) => void;
  hideProgress: () => void;
  
  // Promise-based methods (for helper integration)
  showError: (config: AppErrorDialogConfig) => Promise<void>;
  showConfirm: (config: AppConfirmDialogConfig) => Promise<boolean>;
  showInfo: (config: AppInfoDialogConfig) => Promise<void>;
  showPrompt: (config: AppPromptDialogConfig) => Promise<string | null>;
  showProgress: (config: AppProgressDialogConfig) => Promise<void>;
  
  closeAllDialogs: () => void;
}
```

### 2. AppDialogHelper (Non-React Integration)

**Location**: `src/lib/AppDialogHelper.ts`

A singleton class that bridges non-React code (commands, utilities) with the React dialog system:
- Provides promise-based API for all dialog types
- Registers handlers from the React context on initialization
- Includes convenience methods for common use cases
- Handles initialization checking and error states

**Key Methods**:
```typescript
class AppDialogHelper {
  // Core dialog methods
  showError(title: string, message: string, error?: string): Promise<void>
  showConfirm(title: string, message: string, options?): Promise<boolean>
  showInfo(title: string, message: string, details?: string): Promise<void>
  showPrompt(title: string, message: string, options?): Promise<string | null>
  showProgress(title: string, message: string, options?): Promise<void>
  
  // Convenience methods
  showFileError(operation: string, filename: string, error: Error): Promise<void>
  showUnsavedChangesConfirm(filename?: string): Promise<'save' | 'discard' | 'cancel'>
  
  // System methods
  registerHandlers(handlers: AppDialogHandlers): void
  isInitialized(): boolean
}
```

### 3. Dialog Components

**Location**: `src/components/AppDialogs.tsx`

Individual dialog components that render the actual UI:
- Built on top of the base `AppDialog` component
- Each component handles its specific use case and props
- Consistent styling and behavior across all dialog types

**Components**:
- `AppErrorDialog`: Error messages with optional retry
- `AppConfirmDialog`: Yes/No confirmations with variants
- `AppInfoDialog`: Information displays with optional details
- `AppPromptDialog`: Text input with validation
- `AppProgressDialog`: Progress indicators with optional cancellation

### 4. Base Dialog Component

**Location**: `src/components/AppDialog.tsx`

The foundational dialog component that provides:
- Common dialog structure and styling
- Size variants (sm, md, lg, xl)
- Dialog variants (default, destructive, progress)
- Progress bar rendering for progress dialogs
- Consistent animations and transitions

## State Management

### Dialog State Structure

Each dialog type has its own state interface that extends the configuration interface:

```typescript
interface DialogState extends DialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Additional state-specific properties (callbacks, etc.)
}

interface AppDialogState {
  errorDialog: ErrorDialogState;
  confirmDialog: ConfirmDialogState;
  infoDialog: InfoDialogState;
  promptDialog: PromptDialogState;
  progressDialog: ProgressDialogState;
}
```

### State Updates

State updates follow a consistent pattern:
1. Method called with configuration
2. State updated with new configuration + open: true
3. Dialog renders with new state
4. User interaction triggers callbacks
5. Dialog closes via onOpenChange

### Promise Resolution

Promise-based methods wrap the direct control methods and handle resolution:
- **Error/Info dialogs**: Resolve immediately (fire-and-forget)
- **Confirm dialogs**: Resolve with boolean result
- **Prompt dialogs**: Resolve with string result or null (cancelled)
- **Progress dialogs**: Resolve immediately, controlled externally

## Design Decisions

### 1. Unified vs. Separate Providers

**Decision**: Single unified provider
**Rationale**: 
- Reduces complexity and bundle size
- Ensures consistent behavior across dialog types
- Simplifies state management
- Easier to maintain and extend

### 2. Direct + Promise APIs

**Decision**: Provide both direct control and promise-based APIs
**Rationale**:
- Direct control for React components that need callback-based interaction
- Promise-based for async operations and non-React code
- Flexibility for different usage patterns

### 3. Helper Singleton Pattern

**Decision**: Use singleton pattern for AppDialogHelper
**Rationale**:
- Ensures single source of truth for dialog handlers
- Prevents multiple instances registering different handlers
- Simpler API for non-React code
- Easier testing and mocking

### 4. Configuration Interfaces

**Decision**: Separate configuration interfaces for each dialog type
**Rationale**:
- Type safety and autocompletion
- Clear API boundaries
- Easier to extend specific dialog types
- Better documentation and maintenance

## Extension Points

### Adding New Dialog Types

1. **Define Configuration Interface**:
```typescript
export interface AppCustomDialogConfig {
  title: string;
  message: string;
  customProp?: string;
  size?: AppDialogProps['size'];
}
```

2. **Create Dialog State Interface**:
```typescript
interface CustomDialogState extends AppCustomDialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomAction?: () => void;
}
```

3. **Add to Main State**:
```typescript
interface AppDialogState {
  // ...existing dialogs
  customDialog: CustomDialogState;
}
```

4. **Implement Methods**:
```typescript
const showCustomDialog = useCallback((config: AppCustomDialogConfig) => {
  // Implementation
}, []);
```

5. **Create Component**:
```typescript
export function AppCustomDialog({ ... }: AppCustomDialogProps) {
  return <AppDialog variant="custom" ... />;
}
```

6. **Update Context Type and Helper**

### Customizing Existing Dialogs

Dialog components can be extended by:
- Adding new props to configuration interfaces
- Extending the base `AppDialog` component
- Adding new variants to the base component
- Implementing custom styling or behavior

## Performance Considerations

### State Updates

- Dialog state is managed at the provider level to avoid prop drilling
- Only the active dialog re-renders when state changes
- Unused dialogs remain mounted but don't re-render unnecessarily

### Bundle Size

- Dialog components are co-located to enable tree shaking
- Helper class is imported only when needed
- No external dependencies beyond React and existing UI components

### Memory Management

- Dialog state is reset when dialogs close
- Promise references are cleaned up after resolution
- Event listeners are properly removed in useEffect cleanup

## Testing Strategy

### Unit Testing

- Test individual dialog methods for correct state updates
- Mock dialog handlers in helper tests
- Test promise resolution/rejection scenarios
- Verify callback execution

### Integration Testing

- Test dialog rendering with different configurations
- Verify context provider initialization
- Test helper registration and handler calling
- End-to-end dialog workflows

### Example Test Structure

```typescript
describe('AppDialogProvider', () => {
  describe('showErrorDialog', () => {
    it('should open error dialog with correct config', () => {
      // Test implementation
    });

    it('should handle retry callback', () => {
      // Test implementation
    });
  });

  describe('Promise-based methods', () => {
    it('should resolve confirm dialog with boolean', async () => {
      // Test implementation
    });
  });
});
```

## Security Considerations

### Input Validation

- Prompt dialogs support validation functions
- All user input is validated before processing
- HTML content is properly escaped in dialog messages

### XSS Prevention

- Dialog content is rendered as text, not HTML
- Any dynamic content is properly sanitized
- Error messages from exceptions are filtered for sensitive information

## Migration Path

### From AI-Specific Dialogs

The system was designed to replace AI-specific dialogs:

**Old Pattern**:
```typescript
const { showAIProgress } = useAIDialogs();
```

**New Pattern**:
```typescript
const { showProgressDialog } = useAppDialogs();
```

### From Legacy Dialog Systems

For applications with existing dialog implementations:

1. **Identify Dialog Usage**: Find all dialog-related code
2. **Map to New Types**: Determine which unified dialog type to use
3. **Update Imports**: Change imports to use new system
4. **Update Method Calls**: Adapt to new API structure
5. **Test Integration**: Verify all dialogs work correctly

## Future Enhancements

### Planned Features

- **Dialog History**: Track and replay dialog interactions
- **Keyboard Navigation**: Enhanced keyboard support
- **Animation Customization**: Configurable enter/exit animations
- **Theme Integration**: Better integration with app theming system
- **Accessibility**: Enhanced screen reader and keyboard support

### Extension Possibilities

- **Custom Dialog Types**: Framework for application-specific dialogs
- **Dialog Composition**: Ability to compose complex dialogs from simpler ones
- **State Persistence**: Save and restore dialog state across sessions
- **Analytics Integration**: Track dialog usage and user interactions

# Command Management System

## Overview

NotebookJS implements a sophisticated command management system based on the **Command Pattern** that provides a unified way to handle user interactions through menus, toolbars, keyboard shortcuts, and UI elements. This system enables consistent behavior, undo/redo functionality, and dynamic enabling/disabling of UI elements based on application state.

## Architecture Components

### 1. Core Components

#### CommandManager (`src/Engine/CommandManager.ts`)
The central orchestrator that manages all commands in the application.

```typescript
interface ICommandManager {
    registerCommand(info: CommandInfo): void;
    unregisterCommand(commandId: string): void;
    executeCommand(commandId: string, params?: any): Promise<void>;
    canExecuteCommand(commandId: string): boolean;
    getCommand(commandId: string): ICommand | undefined;
    getAllCommands(): CommandInfo[];
    setContext(context: CommandContext): void;
    getContext(): CommandContext | null;
}
```

**Key Features:**
- **Command Registration**: Maps command IDs to command implementations
- **Context Management**: Provides execution context to commands
- **Parameterized Commands**: Supports commands with runtime parameters
- **Conditional Execution**: Checks if commands can execute before running them

#### Command Interface (`src/Types/CommandTypes.ts`)
Defines the contract that all commands must implement.

```typescript
interface ICommand {
    execute(): Promise<void> | void;
    getDescription(): string;
    canExecute?(): boolean;
    undo?(): Promise<void> | void;
    canUndo?(): boolean;
}
```

#### CommandContext
Provides commands with access to application services:

```typescript
interface CommandContext {
    applicationProvider: {
        saveNotebook: (filePath?: string) => Promise<void>;
        loadNotebook: (filePath: string) => Promise<void>;
        newNotebook: () => void;
        // ... other application operations
    };
    reactiveSystem: {
        codeCellEngine: any;
        reactiveStore: any;
        formulaEngine: any;
    };
    notebookOperations: {
        addCell: (cellType: string, insertIndex?: number) => void;
        executeAllCells: () => Promise<void>;
    };
    uiOperations: {
        toggleSidebar?: () => void;
    };
    uiState: {
        selectedCellId: string | null;
    };
}
```

### 2. Provider Architecture

#### CommandProvider (`src/Engine/CommandProvider.tsx`)
- **Registers all commands** when the component mounts
- **Sets up command context** with access to application services
- **Provides command manager** to child components via React Context
- **Manages command lifecycle** (registration/cleanup)

#### ApplicationProvider (`src/Engine/ApplicationProvider.tsx`)
- **Handles menu events** from the main process
- **Provides fallback implementations** when commands aren't available
- **Manages application state** and notebook operations
- **Sets up IPC listeners** for menu interactions

### 3. Component Hierarchy

```
App
├── ApplicationProvider (receives commandManager)
│   ├── Menu Event Handlers (IPC listeners)
│   └── AppContent
│       ├── ReactiveProvider
│       └── CommandProvider (registers commands)
│           └── NotebookViewer
│               └── Toolbar (uses commands)
```

## Command Registration Process

### 1. Initialization Flow

1. **CommandManagerSingleton** is created (`src/Engine/CommandManagerSingleton.ts`)
2. **App** passes singleton to **ApplicationProvider**
3. **ApplicationProvider** sets up menu event listeners
4. **CommandProvider** registers all commands with the singleton
5. **CommandProvider** sets the execution context

### 2. Command Registration Example

```typescript
// In CommandProvider
commandManager.registerCommand({
    id: 'notebook.save',
    command: new SaveNotebookCommand(getContext),
    shortcut: 'Cmd+S',
    icon: SaveIcon,
    tooltip: 'Save notebook (Cmd+S)'
});
```

### 3. Available Commands

| Command ID | Description | Shortcut | UI Element |
|------------|-------------|----------|------------|
| `notebook.new` | Create new notebook | Cmd+N | File → New, Toolbar |
| `notebook.open` | Open existing notebook | Cmd+O | File → Open, Toolbar |
| `notebook.save` | Save current notebook | Cmd+S | File → Save, Toolbar |
| `notebook.saveAs` | Save with new name | Shift+Cmd+S | File → Save As |
| `notebook.executeAll` | Run all code cells | Shift+Cmd+Enter | Cell → Run All, Toolbar |
| `cell.add.code` | Add code cell | Cmd+Enter | Insert → Code Cell, Toolbar |
| `cell.add.markdown` | Add markdown cell | Cmd+M | Insert → Markdown Cell |
| `cell.add.formula` | Add formula cell | Cmd+F | Insert → Formula Cell |
| `cell.add.input` | Add input cell | Cmd+I | Insert → Input Cell |
| `edit.undo` | Undo last action | Cmd+Z | Edit → Undo |
| `edit.redo` | Redo last action | Shift+Cmd+Z | Edit → Redo |
| `ui.toggleSidebar` | Toggle sidebar | Cmd+B | View → Sidebar |

## Menu System Integration

### 1. Main Process Menu Setup (`src/main.ts`)

The main process creates native menus that send IPC messages:

```typescript
{
    label: 'Open Notebook...',
    accelerator: 'CmdOrCtrl+O',
    click: () => {
        mainWindow.webContents.send('menu-open-notebook');
    }
}
```

### 2. Renderer Process Handling (`src/Engine/ApplicationProvider.tsx`)

ApplicationProvider listens for menu events and executes commands:

```typescript
'menu-open-notebook': async () => {
    if (currentCommandManager && currentCommandManager.getCommand('notebook.open')) {
        try {
            await currentCommandManager.executeCommand('notebook.open');
        } catch (error) {
            // Handle error
        }
    } else {
        // Fallback implementation
        await directOpenNotebook();
    }
}
```

### 3. Safety Mechanisms

- **Command Existence Check**: `commandManager.getCommand(commandId)` before execution
- **Fallback Implementations**: Direct function calls if commands aren't available
- **Error Handling**: Try-catch blocks with user-friendly error messages

## UI Element Integration

### 1. Toolbar Integration (`src/Components/Toolbar.tsx`)

```typescript
export function Toolbar() {
    const { commandManager } = useCommands();

    const handleCommand = (commandId: string) => {
        commandManager.executeCommand(commandId);
    };

    const handleAddCell = (cellType: string) => {
        const commandId = `cell.add.${cellType}`;
        commandManager.executeCommand(commandId, {
            cellType: cellType as any,
            insertStrategy: 'after-selected'
        });
    };

    // Get command info for tooltips
    const saveInfo = getCommandInfo('notebook.save');
    
    return (
        <Button onClick={() => handleCommand('notebook.save')}>
            <SaveIcon />
        </Button>
    );
}
```

### 2. Command Information Access

Commands provide metadata that UI elements can use:

```typescript
const getCommandInfo = (commandId: string) => {
    return commandManager.getAllCommands().find(info => info.id === commandId);
};

// Access tooltip, shortcut, icon from command info
const saveInfo = getCommandInfo('notebook.save');
console.log(saveInfo.tooltip); // "Save notebook (Cmd+S)"
```

## State-Based UI Control

### 1. Conditional Command Execution

Commands implement `canExecute()` to determine if they should run:

```typescript
export class SaveNotebookCommand extends BaseCommand {
    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }
    
    async execute(): Promise<void> {
        // Save logic
    }
}
```

### 2. Dynamic UI States

UI elements can check command availability:

```typescript
const canSave = commandManager.canExecuteCommand('notebook.save');

<Button 
    disabled={!canSave}
    onClick={() => handleCommand('notebook.save')}
>
    Save
</Button>
```

### 3. Application State Scenarios

| Application State | Available Commands | Disabled Commands | UI Behavior |
|------------------|-------------------|-------------------|-------------|
| No notebook loaded | `notebook.new`, `notebook.open` | `notebook.save`, `cell.*`, `edit.*` | Most toolbar/menu items disabled |
| Notebook loaded | All commands | None (context-dependent) | Full functionality |
| Read-only mode | `notebook.open`, `notebook.new` | `notebook.save`, `cell.add.*` | Edit operations disabled |
| Documentation view | `notebook.new`, `notebook.open` | `cell.*`, `edit.*` | Only file operations |

## Implementation Examples

### 1. Adding a New Command

```typescript
// 1. Create command class
export class ExportPDFCommand extends BaseCommand {
    getDescription(): string {
        return 'Export notebook as PDF';
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    async execute(): Promise<void> {
        // Implementation
    }
}

// 2. Register in CommandProvider
commandManager.registerCommand({
    id: 'notebook.exportPDF',
    command: new ExportPDFCommand(getContext),
    shortcut: 'Cmd+P',
    icon: PrintIcon,
    tooltip: 'Export as PDF (Cmd+P)'
});

// 3. Add menu item in main.ts
{
    label: 'Export as PDF...',
    accelerator: 'CmdOrCtrl+P',
    click: () => {
        mainWindow.webContents.send('menu-export-pdf');
    }
}

// 4. Handle in ApplicationProvider
'menu-export-pdf': async () => {
    if (currentCommandManager && currentCommandManager.getCommand('notebook.exportPDF')) {
        await currentCommandManager.executeCommand('notebook.exportPDF');
    }
}
```

### 2. Conditional Menu States

To implement dynamic menu enabling/disabling:

```typescript
// 1. Extend menu creation to accept state
function createMenu(mainWindow: BrowserWindow, appState: ApplicationState) {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    enabled: !!appState.currentModel,
                    click: () => mainWindow.webContents.send('menu-save-notebook')
                }
            ]
        }
    ];
}

// 2. Update menu when state changes
// In ApplicationProvider, send state updates to main process
useEffect(() => {
    window.api.updateApplicationState(state);
}, [state]);

// 3. In main process, rebuild menu
ipcMain.handle('update-application-state', (event, state) => {
    createMenu(mainWindow, state);
});
```

## Best Practices

### 1. Command Design
- **Single Responsibility**: Each command should do one thing
- **Idempotent**: Commands should be safe to run multiple times
- **Error Handling**: Always handle and report errors appropriately
- **State Validation**: Check preconditions in `canExecute()`

### 2. UI Integration
- **Consistent Patterns**: Use the same command execution pattern everywhere
- **User Feedback**: Provide visual feedback for command execution
- **Graceful Degradation**: Implement fallbacks for missing commands
- **Accessibility**: Ensure keyboard shortcuts work consistently

### 3. State Management
- **Centralized State**: Use ApplicationProvider for shared state
- **Reactive Updates**: Update UI when state changes
- **Optimistic Updates**: Update UI immediately, handle errors gracefully
- **Undo/Redo**: Design operations to support undo/redo when possible

### 4. Testing Strategy
- **Unit Tests**: Test individual commands in isolation
- **Integration Tests**: Test command execution through UI
- **State Tests**: Verify UI enables/disables correctly
- **Error Scenarios**: Test error handling and fallbacks

## Troubleshooting Common Issues

### 1. "Command not found" Error
- **Cause**: CommandProvider hasn't registered commands yet
- **Solution**: Ensure CommandProvider is rendered after ApplicationProvider sets up menu listeners
- **Prevention**: Add existence checks before command execution

### 2. Commands Not Updating UI
- **Cause**: Missing state updates or React re-renders
- **Solution**: Ensure state changes trigger React updates
- **Prevention**: Use proper React state management patterns

### 3. Menu Items Always Disabled
- **Cause**: `canExecute()` returning false or missing context
- **Solution**: Check command context and application state
- **Prevention**: Add logging to `canExecute()` methods

### 4. Keyboard Shortcuts Not Working
- **Cause**: Menu shortcuts vs. component-level shortcuts conflict
- **Solution**: Ensure consistent shortcut handling between menu and UI
- **Prevention**: Use command system for all shortcut handling

This command management system provides a robust foundation for building complex interactions while maintaining consistency and extensibility across the application.

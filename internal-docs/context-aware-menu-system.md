# Context-Aware Menu System

## Overview

Nodebook.js implements a context-aware menu system that follows VS Code patterns, where menu items are dynamically shown/hidden and enabled/disabled based on the current application state and context.

## Architecture

### Core Components

1. **MainProcessMenuManager** (`src/lib/MainProcessMenuManager.ts`)
   - Responsible for building Electron menus from configuration
   - Evaluates visibility and enabled state based on application context
   - Handles command execution through registered command handlers

2. **MainProcessMenuConfig** (`src/lib/MainProcessMenuConfig.ts`)
   - Declarative menu configuration with helper functions
   - Defines when menu items should be visible/enabled
   - Contains dynamic label logic for context-sensitive menu items

3. **ApplicationContext** (`src/Types/CommandTypes.ts`)
   - Central state object that drives menu behavior
   - Updated by the renderer process when application state changes
   - Contains current view, notebook state, undo/redo availability, etc.

### Menu Update Flow

```
1. Renderer State Changes
   ↓
2. Update ApplicationContext via IPC
   ↓  
3. Main Process evaluates menu config
   ↓
4. Menu is rebuilt with new state
   ↓
5. User sees updated menu items
```

## VS Code Pattern Compliance

Following VS Code's approach:

1. **Command-Driven**: Menu items map to command IDs for consistency
2. **Context-Aware**: Items shown/hidden based on application context  
3. **Declarative**: Menu structure defined in configuration, not imperatively
4. **Dynamic**: Menu rebuilds when context changes (not just enabled/disabled)
5. **Performance**: Only rebuilds when context actually changes

## Application Context

The `ApplicationContext` interface drives all menu behavior:

```typescript
interface ApplicationContext {
    currentView: 'home' | 'notebook' | 'settings' | 'docs' | 'about';
    hasOpenNotebook: boolean;
    isNotebookDirty: boolean;
    canUndo: boolean;
    canRedo: boolean;
    readingMode: boolean;
    selectedCellId: string | null;
    totalCells: number;
}
```

### View-Based Menu Logic

- **home**: Minimal menu, no notebook-specific items
- **notebook**: Full menu with cell operations, save/export enabled
- **settings**: Menu shows "Close Settings" instead of "Close Notebook"
- **docs**: Menu shows "Close Documentation"

## Menu Configuration Patterns

### Visibility Helpers

```typescript
const menuHelpers = {
    hasNotebook: (context) => context.hasOpenNotebook,
    showCloseNotebook: (context) => {
        switch (context.currentView) {
            case 'home': return false;
            case 'settings': return true; // "Close Settings"
            case 'notebook': return context.hasOpenNotebook;
            default: return false;
        }
    }
};
```

### Dynamic Labels

```typescript
const closeNotebookMenuItem = {
    label: 'Close Notebook', // Updated dynamically
    commandId: 'file.closeNotebook',
    visibleWhen: menuHelpers.showCloseNotebook
};

// Helper updates label based on context
function updateCloseMenuItemLabel(context: ApplicationContext) {
    closeNotebookMenuItem.label = getCloseLabel(context);
}
```

### Menu Item Configuration

```typescript
{
    label: 'Save',
    commandId: 'file.save',
    accelerator: 'CmdOrCtrl+S',
    enabledWhen: (context) => context.hasOpenNotebook
}
```

## Integration Points

### Main Process Setup

```typescript
// Initialize menu manager with command handlers
const commandHandlers = {
    'file.save': () => mainWindow.webContents.send('menu-save-notebook'),
    'edit.undo': () => mainWindow.webContents.send('menu-undo'),
    // ... other handlers
};

const menuManager = new MainProcessMenuManager(commandHandlers);

// Create menu with current context
function createMenuWithManager(mainWindow: BrowserWindow) {
    const menu = menuManager.buildMenu(currentApplicationContext);
    Menu.setApplicationMenu(menu);
}

// Update context and rebuild menu
function updateApplicationContext(updates: Partial<ApplicationContext>) {
    currentApplicationContext = { ...currentApplicationContext, ...updates };
    createMenuWithManager(mainWindow);
}
```

### Renderer Process Integration

The renderer process must update the application context when state changes:

```typescript
// When opening a notebook
await electronAPI.updateApplicationContext({
    currentView: 'notebook',
    hasOpenNotebook: true,
    totalCells: model.cells.length
});

// When navigating to home
await electronAPI.updateApplicationContext({
    currentView: 'home',
    hasOpenNotebook: false,
    selectedCellId: null
});

// When selecting a different cell
await electronAPI.updateApplicationContext({
    selectedCellId: newCellId
});

// When undo/redo availability changes
await electronAPI.updateApplicationContext({
    canUndo: historyManager.canUndo(),
    canRedo: historyManager.canRedo()
});
```

## Key Benefits

1. **Consistency**: Same patterns as VS Code for familiar behavior
2. **Performance**: Menu only rebuilds when context changes
3. **Maintainability**: Declarative configuration is easier to modify
4. **Extensibility**: Easy to add new menu items and context conditions
5. **Debugging**: Clear separation between menu config and state logic

## Common Patterns

### Context-Sensitive Items

- **File operations**: Only enabled when notebook is open
- **Cell operations**: Only enabled when cells exist or cell is selected
- **Undo/Redo**: Enabled based on history availability
- **Reading mode**: Toggle state based on current mode

### View-Specific Menus

- **Home view**: Hide notebook-specific menus (Insert, Cell)
- **Settings view**: Change "Close Notebook" to "Close Settings"
- **Documentation view**: Change to "Close Documentation"

### Dynamic Labels

Items like "Close Notebook" change their label based on context while maintaining the same command ID for consistency.

## Implementation Notes

- Menu rebuilds are debounced to avoid excessive updates
- Context changes are batched when possible
- Separators are automatically managed in menu configuration
- Platform-specific menu adjustments (macOS app menu) are handled automatically
- All menu actions route through the same IPC system for consistency

## Future Enhancements

1. **Command Palette**: Could use the same command system
2. **Toolbar Buttons**: Could share the same visibility/enabled logic
3. **Context Menus**: Could use similar configuration patterns
4. **Keyboard Shortcuts**: Already integrated through accelerator properties

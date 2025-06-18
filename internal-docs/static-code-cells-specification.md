# Static Code Cells Specification

## Overview

This document specifies the implementation of static code cells in NotebookJS. Static code cells are regular code cells that can be toggled to not participate in the reactive system, allowing for manual execution without affecting the reactive store or triggering formula updates.

## Requirements

### Core Functionality
1. **Toggle Mode**: Any code cell can be switched between "reactive" and "static" modes
2. **Default Behavior**: New code cells are reactive by default
3. **Manual Execution**: Static cells only execute when manually triggered (not through reactive dependencies)
4. **No Exports**: Static cells do not export variables to the reactive store
5. **No Dependencies**: Static cells do not track dependencies or trigger reactive updates
6. **Preserved Output**: Static cells still capture and display console output and results

### UI Requirements
1. **Toggle Button**: Clear visual toggle in the code cell header/toolbar
2. **Visual Feedback**: Static cells should have distinct visual styling
3. **No Static Cell Creation**: Remove any "Add Static Code Cell" buttons or commands
4. **Consistent UX**: Toggle should be easily discoverable and intuitive

### Backward Compatibility
1. **Existing Notebooks**: All existing code cells remain reactive
2. **Formula System**: Formulas continue to work unchanged
3. **Reactive System**: Core reactive functionality remains intact

## Implementation Strategy

### 1. Type System Changes

**File**: `src/Types/NotebookModel.ts`

Add an optional `isStatic` flag to `CodeCellDefinition`:

```typescript
export interface CodeCellDefinition extends BaseCellDefinition {
    type: 'code';
    content: string;
    language?: string;
    isStatic?: boolean; // Optional flag, defaults to false
}
```

### 2. Reactive System Updates

**File**: `src/Engine/ReactiveSystem.ts`

#### Code Cell Engine Updates

Modify the following methods to respect the `isStatic` flag:

1. **`executeCodeCell`**: Check if cell is static before tracking dependencies/exports
2. **`reExecuteCodeCell`**: Respect static mode during re-execution
3. **`updateCodeCell`**: Handle static mode changes appropriately

#### Key Logic Points

```typescript
// In executeCodeCell and related methods
const cell = this.notebookStateManager.getCell(cellId) as CodeCellDefinition;
const isStatic = cell?.isStatic || false;

if (!isStatic) {
    // Normal reactive behavior: track dependencies, handle exports
    this.trackDependencies(cellId, code);
    this.handleExports(cellId, exports);
} else {
    // Static behavior: execute without reactive participation
    // Still capture output and results, but don't affect reactive store
}
```

#### Dependency Tracking

- Static cells should not be included in dependency graphs
- Static cells should not trigger when their dependencies change
- Static cells should not cause other cells to re-execute

#### Export Handling

- Static cells should not export variables to the reactive store
- Variables from static cells should not be available to formulas or other cells
- Static cells can still have local scope and internal variables

### 3. UI Implementation

**File**: `src/components/CodeCell.tsx`

#### Toggle Button

Add a toggle button in the cell header/toolbar:

```typescript
// In CodeCell component
const [isStatic, setIsStatic] = useState(cell.isStatic || false);

const handleStaticToggle = () => {
    const newIsStatic = !isStatic;
    setIsStatic(newIsStatic);
    
    // Update the cell definition
    notebookStateManager.updateCell(cell.id, {
        ...cell,
        isStatic: newIsStatic
    });
    
    // If switching from static to reactive, may need to re-execute
    if (!newIsStatic) {
        codeCellEngine.reExecuteCodeCell(cell.id);
    }
};
```

#### Visual Styling

Static cells should have distinct visual indicators:
- Different border color or style
- Icon or label indicating static mode
- Muted or different background color

#### Button Placement

Place the toggle button in a logical location:
- Cell toolbar/header area
- Near other cell controls (run button, etc.)
- Should not interfere with existing UI elements

### 4. Cell State Management

**File**: `src/Engine/NotebookStateManager.ts`

Ensure the state manager properly handles the `isStatic` flag:
- Save/load static state in notebook files
- Handle cell updates with static flag changes
- Maintain backward compatibility with existing notebooks

### 5. Clean Up Existing Static Cell Implementation

Remove any existing "static code cell" functionality:

1. **Commands**: Remove static code cell creation commands
2. **UI Elements**: Remove "Add Static Code Cell" buttons
3. **Cell Types**: Remove any separate static cell types
4. **Components**: Remove dedicated static cell components

**Files to check and clean**:
- `src/Engine/Commands/NotebookCommands.ts`
- `src/Engine/CommandProvider.tsx`
- `src/components/CellSeparator.tsx`
- `src/components/DynamicNotebook.tsx`

## Testing Strategy

### Unit Tests
1. Test static flag behavior in ReactiveSystem
2. Test toggle functionality in CodeCell component
3. Test cell state management with static flag

### Integration Tests
1. Verify reactive system continues working with mixed cell types
2. Test formula execution with static cells present
3. Test dependency tracking with static cells

### Manual Testing Scenarios
1. Create a new notebook - verify cells are reactive by default
2. Toggle a cell to static - verify it doesn't affect reactive store
3. Toggle back to reactive - verify it rejoins reactive system
4. Test formulas with static cells - verify formulas still work
5. Test complex dependency chains with mixed cell types

## Edge Cases and Considerations

### 1. Toggle State Changes
- When switching from reactive to static: cell should stop participating in reactive updates
- When switching from static to reactive: cell should re-evaluate and rejoin reactive system

### 2. Formula Dependencies
- Formulas should not be able to reference variables from static cells
- This should fail gracefully with appropriate error messages

### 3. Notebook Serialization
- Static flag should be saved in notebook files
- Loading notebooks should respect static settings
- Backward compatibility: missing `isStatic` flag defaults to `false`

### 4. Performance Considerations
- Static cells should not impact reactive system performance
- Toggle operation should be fast and responsive
- Large notebooks with many static cells should perform well

## Implementation Order

1. **Type System**: Add `isStatic` flag to `CodeCellDefinition`
2. **Reactive System**: Update code cell engine to respect static flag
3. **UI Toggle**: Implement toggle button in CodeCell component
4. **State Management**: Ensure proper saving/loading of static flag
5. **Clean Up**: Remove existing static cell creation functionality
6. **Testing**: Comprehensive testing of new functionality
7. **Documentation**: Update user documentation

## Success Criteria

- ✅ Any code cell can be toggled between reactive and static modes
- ✅ New cells are reactive by default
- ✅ Static cells execute manually without affecting reactive store
- ✅ Reactive system and formulas continue to work normally
- ✅ Clear visual feedback for static vs reactive cells
- ✅ No "Add Static Code Cell" buttons remain
- ✅ Backward compatibility maintained
- ✅ Performance is not negatively impacted

## Implementation Status

**COMPLETED**: Initial implementation of static code cells has been completed as of June 18, 2025.

### Changes Made:

1. **Type System** ✅
   - Added `isStatic?: boolean` flag to `CodeCellDefinition` in `src/Types/NotebookModel.ts`

2. **Reactive System** ✅  
   - Updated `executeCodeCell` method to accept `isStatic` parameter
   - Added logic to prevent dependency tracking for static cells
   - Added logic to prevent exports to reactive store for static cells  
   - Added logic to prevent reactive execution setup for static cells
   - Updated `reExecuteCodeCell` to also accept `isStatic` parameter

3. **UI Components** ✅
   - Added static mode toggle button to `CodeCell.tsx` component
   - Added visual styling (orange border/background) for static cells
   - Added state management for static mode with automatic syncing
   - Added auto re-execution when switching from static to reactive mode

4. **Integration** ✅
   - Updated all calls to `executeCodeCell` throughout the codebase to pass static flag
   - Updated `DynamicNotebook.tsx` initialization and execution
   - Updated `CommandProvider.tsx` for "Execute All" functionality
   - Ensured formula execution remains reactive (static=false)

5. **Test Data** ✅
   - Created `static-cells-test.nbjs` test notebook with mixed reactive/static cells

### Files Modified:
- `src/Types/NotebookModel.ts` - Added isStatic flag
- `src/Engine/ReactiveSystem.ts` - Core static cell logic
- `src/components/CodeCell.tsx` - UI toggle and styling
- `src/Components/DynamicNotebook.tsx` - Initialization and execution
- `src/Engine/CommandProvider.tsx` - Execute all functionality
- `static-cells-test.nbjs` - Test notebook

**Ready for testing and integration.**

## Notes

- Keep changes minimal and focused
- Preserve existing reactive system behavior
- Ensure the toggle is discoverable but not intrusive
- Test thoroughly with existing notebooks
- Consider user experience when designing the toggle UI

This specification should guide a clean, incremental implementation that adds static cell functionality without breaking existing features.

# Reading Mode

The Reading Mode feature in Nodebook.js provides a clean, distraction-free view of your notebooks by hiding all editing UI elements while preserving the interactive functionality.

## What is Reading Mode?

Reading Mode transforms your notebook into a clean, output-focused view that's perfect for:
- **Presentations**: Show your work without editing clutter
- **Sharing**: Let others view and interact with your notebook without accidentally editing it
- **Focus**: Concentrate on the content and results without distractions
- **Documentation**: Present your notebook as a polished document

## What Works in Reading Mode

✅ **Interactive Elements**
- Input cells remain fully functional
- Reactive value changes trigger automatic recalculations
- All outputs are displayed and updated in real-time

✅ **Content Display**
- Markdown content is rendered beautifully
- Code cell outputs are shown clearly
- Formula results are displayed
- All visualizations and charts work normally

## What's Hidden in Reading Mode

❌ **Editing UI**
- Cell separators (can't add new cells)
- Edit buttons and controls
- Hover effects and cell selection
- Code cell headers and editing interfaces
- Cell type indicators

❌ **Interaction**
- Double-click to edit cells
- Cell selection and highlighting
- Move, delete, and modify operations

## How to Use Reading Mode

### Toggle Reading Mode

You can toggle reading mode in several ways:

1. **Toolbar Button**: Click the reading mode toggle button in the toolbar
   - 📖 Book icon: Click to enter reading mode
   - ✏️ Pencil icon: Click to exit reading mode (when in reading mode)

2. **Keyboard Shortcut**: Press `Ctrl+R` (or `Cmd+R` on Mac) to toggle between modes

3. **View Menu**: Select "Toggle Reading Mode" from the View menu

4. **Command Palette**: Search for "reading mode" commands

### Reading Mode Persistence

Reading mode state is preserved across ALL operations:
- ✅ Changing reactive values and recalculating cells
- ✅ Loading different notebooks (including from recent files and examples)
- ✅ Creating new notebooks
- ✅ Using undo/redo operations
- ✅ Opening welcome tutorial
- ✅ Returning to the homepage (clearing the notebook)

Reading mode persists until explicitly toggled by the user.

### Component Props

The `DynamicNotebook` component accepts a `readingMode` prop:

```tsx
interface DynamicNotebookProps {
  model: NotebookModel;
  readingMode?: boolean; // Default: false
}
```

## Implementation Details

### Cell Components

All cell components (`CodeCell`, `MarkdownCell`, `FormulaCell`, `InputCell`) accept a `readingMode` prop that:

- **CodeCell**: Hides the code editor, headers, and editing controls, shows only outputs
- **MarkdownCell**: Always shows rendered content, never the editor
- **FormulaCell**: Shows formula and result in a clean format, no editing interface
- **InputCell**: Keeps inputs interactive but hides configuration options

### Styling

Reading mode uses specific CSS classes for clean styling:

- `.cell-reading-mode`: Base reading mode cell styling
- `.markdown-cell-reading`: Clean markdown display
- `.formula-cell-reading`: Minimal formula display
- `.input-cell-reading`: Clean input display

### Reactive System

The reactive system continues to work normally in reading mode:
- Dependencies are tracked and updated
- Formula recalculations happen automatically
- Code cell outputs refresh when inputs change
- All reactive values remain synchronized

## Example Use Cases

### 1. Dashboard Mode
```tsx
// Create a notebook with input controls and data visualizations
// Use reading mode to present it as a clean dashboard
<DynamicNotebook model={dashboardNotebook} readingMode={true} />
```

### 2. Interactive Document
```tsx
// Mix markdown explanations with interactive inputs
// Reading mode creates a clean document with interactive elements
<DynamicNotebook model={documentNotebook} readingMode={true} />
```

### 3. Mode Toggle
```tsx
// Allow users to switch between edit and reading modes
const [readingMode, setReadingMode] = useState(false);

return (
  <div>
    <button onClick={() => setReadingMode(!readingMode)}>
      {readingMode ? 'Edit Mode' : 'Reading Mode'}
    </button>
    <DynamicNotebook model={notebook} readingMode={readingMode} />
  </div>
);
```

### Programmatic Usage

```tsx
import { DynamicNotebook } from './components/DynamicNotebook';

function MyNotebook() {
  const [readingMode, setReadingMode] = useState(false);
  
  return (
    <DynamicNotebook 
      model={notebookModel} 
      readingMode={readingMode}
    />
  );
}
```

## Best Practices

1. **Use for Presentations**: Reading mode is perfect for presenting your work
2. **Interactive Demos**: Create interactive demonstrations without editing clutter
3. **Embedded Views**: Embed notebooks in other applications with reading mode
4. **User-Friendly Sharing**: Share notebooks with non-technical users in reading mode
5. **Documentation**: Use reading mode for polished documentation with interactive examples

## Technical Notes

- Reading mode is a pure UI feature - no data is modified
- All reactive functionality remains intact
- Cell outputs continue to update automatically
- The notebook model is unchanged, only the presentation differs
- Performance is identical to normal mode (no additional overhead)

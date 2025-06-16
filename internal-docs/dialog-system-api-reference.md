# Dialog System API Reference

## Core Types

### Dialog Configuration Types

#### AppErrorDialogConfig
```typescript
interface AppErrorDialogConfig {
  title: string;                    // Dialog title
  message: string;                  // Main error message
  error?: string;                   // Optional error details/stack trace
  onRetry?: () => void;            // Optional retry button callback
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Dialog size
}
```

#### AppConfirmDialogConfig
```typescript
interface AppConfirmDialogConfig {
  title: string;                    // Dialog title
  message: string;                  // Main message
  variant?: 'default' | 'destructive'; // Visual style
  confirmText?: string;             // Custom confirm button text (default: "Confirm")
  cancelText?: string;              // Custom cancel button text (default: "Cancel")
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Dialog size
}
```

#### AppInfoDialogConfig
```typescript
interface AppInfoDialogConfig {
  title: string;                    // Dialog title
  message: string;                  // Main message
  details?: string;                 // Optional additional details
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Dialog size
}
```

#### AppPromptDialogConfig
```typescript
interface AppPromptDialogConfig {
  title: string;                    // Dialog title
  message: string;                  // Main message
  placeholder?: string;             // Input placeholder text
  defaultValue?: string;            // Default input value
  validation?: (value: string) => string | null; // Validation function
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Dialog size
}
```

#### AppProgressDialogConfig
```typescript
interface AppProgressDialogConfig {
  title: string;                    // Dialog title
  message: string;                  // Main message
  progressValue?: number;           // 0-100 for determinate, undefined for indeterminate
  onCancel?: () => void;           // Optional cancel callback
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Dialog size
}
```

## React Hook API

### useAppDialogs()

Returns the dialog context with all available methods.

```typescript
const dialogs = useAppDialogs();
```

### Direct Control Methods

These methods are designed for React components that need immediate control over dialog state.

#### showErrorDialog(config)
```typescript
showErrorDialog(config: AppErrorDialogConfig): void
```

**Example**:
```typescript
dialogs.showErrorDialog({
  title: "Save Failed",
  message: "Could not save the notebook to disk",
  error: error.stack,
  onRetry: () => saveAgain(),
  size: 'md'
});
```

#### showConfirmDialog(config)
```typescript
showConfirmDialog(config: AppConfirmDialogConfig & {
  onConfirm: () => void;
  onCancel?: () => void;
}): void
```

**Example**:
```typescript
dialogs.showConfirmDialog({
  title: "Delete File",
  message: "This action cannot be undone",
  variant: 'destructive',
  confirmText: "Delete",
  onConfirm: () => deleteFile(),
  onCancel: () => console.log('Cancelled')
});
```

#### showInfoDialog(config)
```typescript
showInfoDialog(config: AppInfoDialogConfig): void
```

**Example**:
```typescript
dialogs.showInfoDialog({
  title: "Success",
  message: "Notebook exported successfully",
  details: `Exported to: ${filename}\nSize: ${fileSize} KB`,
  size: 'lg'
});
```

#### showPromptDialog(config)
```typescript
showPromptDialog(config: AppPromptDialogConfig & {
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}): void
```

**Example**:
```typescript
dialogs.showPromptDialog({
  title: "Rename Notebook",
  message: "Enter new name:",
  defaultValue: currentName,
  validation: (name) => name.trim() ? null : "Name cannot be empty",
  onSubmit: (name) => renameNotebook(name),
  onCancel: () => console.log('Rename cancelled')
});
```

#### showProgressDialog(config)
```typescript
showProgressDialog(config: AppProgressDialogConfig): void
```

**Example**:
```typescript
dialogs.showProgressDialog({
  title: "Exporting",
  message: "Preparing export...",
  progressValue: 0,
  onCancel: () => cancelExport()
});
```

#### updateProgress(progressValue?, message?)
```typescript
updateProgress(progressValue?: number, message?: string): void
```

**Example**:
```typescript
dialogs.updateProgress(25, "Processing cells...");
dialogs.updateProgress(50, "Generating output...");
dialogs.updateProgress(); // Update without changing progress or message
```

#### hideProgress()
```typescript
hideProgress(): void
```

**Example**:
```typescript
dialogs.hideProgress();
```

#### closeAllDialogs()
```typescript
closeAllDialogs(): void
```

**Example**:
```typescript
// Close all open dialogs (useful for cleanup)
dialogs.closeAllDialogs();
```

### Promise-Based Methods

These methods return promises and are designed for async operations and helper integration.

#### showError(config)
```typescript
showError(config: AppErrorDialogConfig): Promise<void>
```

**Example**:
```typescript
try {
  await saveFile();
} catch (error) {
  await dialogs.showError({
    title: "Save Error",
    message: "Failed to save file",
    error: error.message
  });
}
```

#### showConfirm(config)
```typescript
showConfirm(config: AppConfirmDialogConfig): Promise<boolean>
```

**Returns**: `true` if confirmed, `false` if cancelled

**Example**:
```typescript
const shouldDelete = await dialogs.showConfirm({
  title: "Confirm Delete",
  message: "Are you sure you want to delete this notebook?",
  variant: 'destructive'
});

if (shouldDelete) {
  await deleteNotebook();
}
```

#### showInfo(config)
```typescript
showInfo(config: AppInfoDialogConfig): Promise<void>
```

**Example**:
```typescript
await dialogs.showInfo({
  title: "Export Complete",
  message: "Your notebook has been exported successfully"
});
```

#### showPrompt(config)
```typescript
showPrompt(config: AppPromptDialogConfig): Promise<string | null>
```

**Returns**: User input string or `null` if cancelled

**Example**:
```typescript
const filename = await dialogs.showPrompt({
  title: "Save As",
  message: "Enter filename:",
  defaultValue: "untitled.nbjs",
  validation: (name) => {
    if (!name.endsWith('.nbjs')) {
      return "Filename must end with .nbjs";
    }
    return null;
  }
});

if (filename) {
  await saveAs(filename);
}
```

#### showProgress(config)
```typescript
showProgress(config: AppProgressDialogConfig): Promise<void>
```

**Note**: This method resolves immediately. Progress is controlled externally via `updateProgress` and `hideProgress`.

**Example**:
```typescript
await dialogs.showProgress({
  title: "Loading",
  message: "Loading notebook...",
  onCancel: () => cancelLoad()
});

// Progress is now showing
// Update it externally as needed
dialogs.updateProgress(50, "Loading cells...");
// Hide when done
dialogs.hideProgress();
```

## Helper API (Non-React)

### AppDialogHelper

Singleton class for non-React code.

```typescript
import { appDialogHelper } from '@/lib/AppDialogHelper';
```

### Core Methods

#### showError(title, message, error?)
```typescript
showError(title: string, message: string, error?: string): Promise<void>
```

**Example**:
```typescript
try {
  await performOperation();
} catch (error) {
  await appDialogHelper.showError(
    "Operation Failed",
    "Could not complete the operation",
    error.stack
  );
}
```

#### showConfirm(title, message, options?)
```typescript
showConfirm(
  title: string, 
  message: string, 
  options?: {
    variant?: 'default' | 'destructive';
    confirmText?: string;
    cancelText?: string;
  }
): Promise<boolean>
```

**Example**:
```typescript
const confirmed = await appDialogHelper.showConfirm(
  "Delete All",
  "This will delete all data. Continue?",
  { variant: 'destructive', confirmText: 'Delete All' }
);

if (confirmed) {
  await deleteAllData();
}
```

#### showInfo(title, message, details?)
```typescript
showInfo(title: string, message: string, details?: string): Promise<void>
```

**Example**:
```typescript
await appDialogHelper.showInfo(
  "Import Complete",
  "Successfully imported notebook",
  `Cells imported: ${cellCount}\nTime taken: ${duration}ms`
);
```

#### showPrompt(title, message, options?)
```typescript
showPrompt(
  title: string,
  message: string,
  options?: {
    placeholder?: string;
    defaultValue?: string;
    validation?: (value: string) => string | null;
  }
): Promise<string | null>
```

**Example**:
```typescript
const url = await appDialogHelper.showPrompt(
  "Import from URL",
  "Enter notebook URL:",
  {
    placeholder: "https://example.com/notebook.json",
    validation: (url) => {
      try {
        new URL(url);
        return null; // Valid
      } catch {
        return "Please enter a valid URL";
      }
    }
  }
);

if (url) {
  await importFromUrl(url);
}
```

#### showProgress(title, message, options?)
```typescript
showProgress(
  title: string,
  message: string,
  options?: {
    progressValue?: number;
    onCancel?: () => void;
  }
): Promise<void>
```

**Example**:
```typescript
await appDialogHelper.showProgress(
  "Processing",
  "Processing notebook data...",
  { onCancel: () => cancelProcessing() }
);
```

### Convenience Methods

#### showFileError(operation, filename, error)
```typescript
showFileError(operation: string, filename: string, error: Error): Promise<void>
```

**Example**:
```typescript
try {
  await fs.writeFile(filename, data);
} catch (error) {
  await appDialogHelper.showFileError("save", filename, error);
}
```

#### showUnsavedChangesConfirm(filename?)
```typescript
showUnsavedChangesConfirm(filename?: string): Promise<'save' | 'discard' | 'cancel'>
```

**Example**:
```typescript
const action = await appDialogHelper.showUnsavedChangesConfirm("my-notebook.nbjs");

switch (action) {
  case 'save':
    await saveNotebook();
    break;
  case 'discard':
    discardChanges();
    break;
  case 'cancel':
    // Stay on current notebook
    break;
}
```

### System Methods

#### isInitialized()
```typescript
isInitialized(): boolean
```

Check if dialog handlers are registered.

**Example**:
```typescript
if (!appDialogHelper.isInitialized()) {
  console.warn("Dialog system not ready");
  return;
}
```

#### registerHandlers(handlers)
```typescript
registerHandlers(handlers: AppDialogHandlers): void
```

**Note**: This is called automatically by the provider. Don't call manually.

## Dialog Variants

### Size Variants

- **sm**: Small dialogs (max-width: 425px) - Simple messages, basic confirmations
- **md**: Medium dialogs (max-width: 500px) - Default size for most dialogs
- **lg**: Large dialogs (max-width: 640px) - Dialogs with details, longer content
- **xl**: Extra large dialogs (max-width: 768px) - Complex forms, detailed errors

### Visual Variants

- **default**: Standard appearance with primary colors
- **destructive**: Red-themed for dangerous actions (delete, permanent changes)
- **progress**: Special styling for progress dialogs with progress bars

## Common Usage Patterns

### File Operations

```typescript
// Save with error handling
async function saveNotebook() {
  try {
    await dialogs.showProgress({
      title: "Saving",
      message: "Saving notebook..."
    });

    await performSave();
    dialogs.hideProgress();

    await dialogs.showInfo({
      title: "Saved",
      message: "Notebook saved successfully"
    });
  } catch (error) {
    dialogs.hideProgress();
    await dialogs.showError({
      title: "Save Failed",
      message: "Could not save notebook",
      error: error.message,
      onRetry: () => saveNotebook()
    });
  }
}
```

### User Input with Validation

```typescript
async function createNewNotebook() {
  const name = await dialogs.showPrompt({
    title: "New Notebook",
    message: "Enter notebook name:",
    placeholder: "My Notebook",
    validation: (name) => {
      if (!name.trim()) return "Name is required";
      if (name.length > 50) return "Name too long";
      if (existingNames.includes(name)) return "Name already exists";
      return null;
    }
  });

  if (name) {
    await createNotebook(name);
  }
}
```

### Confirmation with Context

```typescript
async function deleteNotebook(notebook: Notebook) {
  const confirmed = await dialogs.showConfirm({
    title: "Delete Notebook",
    message: `Delete "${notebook.name}"? This action cannot be undone.`,
    variant: 'destructive',
    confirmText: "Delete Forever",
    size: 'md'
  });

  if (confirmed) {
    await performDelete(notebook);
    await dialogs.showInfo({
      title: "Deleted",
      message: `"${notebook.name}" has been deleted`
    });
  }
}
```

### Progress with Updates

```typescript
async function exportNotebook() {
  let cancelled = false;

  dialogs.showProgressDialog({
    title: "Exporting Notebook",
    message: "Preparing export...",
    progressValue: 0,
    onCancel: () => {
      cancelled = true;
    }
  });

  try {
    for (let i = 0; i < steps.length; i++) {
      if (cancelled) break;

      const progress = ((i + 1) / steps.length) * 100;
      dialogs.updateProgress(progress, `Step ${i + 1}: ${steps[i].name}`);
      
      await steps[i].execute();
    }

    dialogs.hideProgress();

    if (!cancelled) {
      await dialogs.showInfo({
        title: "Export Complete",
        message: "Notebook exported successfully"
      });
    }
  } catch (error) {
    dialogs.hideProgress();
    await dialogs.showError({
      title: "Export Failed",
      message: "Could not export notebook",
      error: error.message
    });
  }
}
```

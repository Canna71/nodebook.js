# Dialog System Usage Guide

## Overview

NotebookJS uses a unified dialog system built around the `AppDialogProvider` that supports all types of dialogs: error, confirm, info, prompt, and progress dialogs. This system provides both React hooks for components and a helper class for non-React code.

## Architecture

The dialog system consists of:

- **`AppDialogProvider`**: React context provider that manages all dialog state
- **`AppDialogHelper`**: Singleton helper class for non-React code (commands, utilities)
- **Dialog Components**: Individual dialog components (`AppErrorDialog`, `AppConfirmDialog`, etc.)
- **Unified API**: Consistent interface across all dialog types

## Setup

The `AppDialogProvider` should wrap your application root:

```tsx
// Views/App.tsx
import { AppDialogProvider } from '@/components/AppDialogProvider';

function App() {
  return (
    <AppDialogProvider>
      {/* Your app content */}
    </AppDialogProvider>
  );
}
```

## Usage in React Components

### Hook Access

```tsx
import { useAppDialogs } from '@/components/AppDialogProvider';

function MyComponent() {
  const dialogs = useAppDialogs();
  // or destructure specific methods
  const { showErrorDialog, showConfirmDialog, showProgressDialog } = useAppDialogs();
}
```

### Error Dialogs

```tsx
// Simple error
dialogs.showErrorDialog({
  title: "Operation Failed",
  message: "Unable to save the file"
});

// Error with details and retry
dialogs.showErrorDialog({
  title: "Network Error",
  message: "Failed to connect to server",
  error: error.stack, // Optional error details
  onRetry: () => retryOperation(), // Optional retry button
  size: 'lg' // Optional size: 'sm' | 'md' | 'lg' | 'xl'
});

// Promise-based (for async operations)
await dialogs.showError({
  title: "Save Failed",
  message: "Could not save notebook"
});
```

### Confirmation Dialogs

```tsx
// Basic confirmation
dialogs.showConfirmDialog({
  title: "Delete File",
  message: "Are you sure you want to delete this file?",
  onConfirm: () => deleteFile(),
  onCancel: () => console.log('Cancelled')
});

// Destructive confirmation
dialogs.showConfirmDialog({
  title: "Permanent Delete",
  message: "This action cannot be undone",
  variant: 'destructive',
  confirmText: "Delete Forever",
  cancelText: "Keep File",
  onConfirm: () => permanentDelete()
});

// Promise-based
const confirmed = await dialogs.showConfirm({
  title: "Confirm Action",
  message: "Do you want to proceed?"
});
if (confirmed) {
  // User clicked confirm
}
```

### Info Dialogs

```tsx
// Simple info
dialogs.showInfoDialog({
  title: "Success",
  message: "File saved successfully"
});

// Info with details
dialogs.showInfoDialog({
  title: "Import Complete",
  message: "Successfully imported 150 cells",
  details: "Imported from: /path/to/file.ipynb\nCells: 150\nTime: 2.3s"
});

// Promise-based
await dialogs.showInfo({
  title: "Welcome",
  message: "Welcome to NotebookJS!"
});
```

### Prompt Dialogs

```tsx
// Basic prompt
dialogs.showPromptDialog({
  title: "Enter Name",
  message: "Please enter a name for this notebook:",
  placeholder: "My Notebook",
  onSubmit: (value) => setNotebookName(value),
  onCancel: () => console.log('Cancelled')
});

// Prompt with validation
dialogs.showPromptDialog({
  title: "Enter URL",
  message: "Please enter a valid URL:",
  defaultValue: "https://",
  validation: (value) => {
    if (!value.startsWith('http')) {
      return "URL must start with http:// or https://";
    }
    return null; // Valid
  },
  onSubmit: (value) => loadFromUrl(value)
});

// Promise-based
const name = await dialogs.showPrompt({
  title: "Enter Name",
  message: "What should we call this?"
});
if (name) {
  // User entered a name
}
```

### Progress Dialogs

```tsx
// Indeterminate progress (spinner)
dialogs.showProgressDialog({
  title: "Processing",
  message: "Please wait while we process your request...",
  onCancel: () => cancelOperation()
});

// Determinate progress (progress bar)
dialogs.showProgressDialog({
  title: "Uploading",
  message: "Uploading file...",
  progressValue: 0 // 0-100
});

// Update progress during operation
dialogs.updateProgress(25, "Processing step 1...");
dialogs.updateProgress(50, "Processing step 2...");
dialogs.updateProgress(75, "Almost done...");

// Hide when complete
dialogs.hideProgress();

// Promise-based
await dialogs.showProgress({
  title: "Loading",
  message: "Loading data..."
});
```

### Complete Progress Example

```tsx
async function uploadFile(file: File) {
  // Show initial progress
  dialogs.showProgressDialog({
    title: "Uploading File",
    message: `Uploading ${file.name}...`,
    progressValue: 0,
    onCancel: () => {
      // Handle cancellation
      uploadAbortController.abort();
    }
  });

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: file,
      signal: uploadAbortController.signal
    });

    // Update progress based on upload
    const reader = response.body?.getReader();
    let received = 0;
    const total = file.size;

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      received += value.length;
      const progress = (received / total) * 100;
      dialogs.updateProgress(progress, `Uploaded ${Math.round(progress)}%`);
    }

    dialogs.hideProgress();
    
    dialogs.showInfoDialog({
      title: "Upload Complete",
      message: `Successfully uploaded ${file.name}`
    });
  } catch (error) {
    dialogs.hideProgress();
    dialogs.showErrorDialog({
      title: "Upload Failed",
      message: `Failed to upload ${file.name}`,
      error: error.message
    });
  }
}
```

## Usage in Non-React Code

For commands, utilities, and other non-React code, use the `AppDialogHelper`:

```typescript
import { appDialogHelper } from '@/lib/AppDialogHelper';

// In a command class
export class SaveCommand {
  async execute() {
    try {
      await this.saveFile();
      
      await appDialogHelper.showInfo(
        "Save Complete",
        "File saved successfully"
      );
    } catch (error) {
      await appDialogHelper.showError(
        "Save Failed",
        "Could not save file",
        error.stack
      );
    }
  }

  async confirmOverwrite(): Promise<boolean> {
    return await appDialogHelper.showConfirm(
      "File Exists",
      "File already exists. Overwrite?"
    );
  }

  async promptForFilename(): Promise<string | null> {
    return await appDialogHelper.showPrompt(
      "Save As",
      "Enter filename:",
      { defaultValue: "untitled.nbjs" }
    );
  }

  async showProgress() {
    await appDialogHelper.showProgress(
      "Saving",
      "Saving file to disk..."
    );
  }
}
```

## Dialog Configuration Options

### Common Options

All dialogs support these common options:

```typescript
interface CommonOptions {
  title: string;           // Dialog title
  message: string;         // Main message
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Dialog size
}
```

### Error Dialog Options

```typescript
interface AppErrorDialogConfig extends CommonOptions {
  error?: string;          // Optional error details/stack trace
  onRetry?: () => void;    // Optional retry button callback
}
```

### Confirm Dialog Options

```typescript
interface AppConfirmDialogConfig extends CommonOptions {
  variant?: 'default' | 'destructive'; // Visual style
  confirmText?: string;    // Custom confirm button text
  cancelText?: string;     // Custom cancel button text
}
```

### Info Dialog Options

```typescript
interface AppInfoDialogConfig extends CommonOptions {
  details?: string;        // Optional additional details
}
```

### Prompt Dialog Options

```typescript
interface AppPromptDialogConfig extends CommonOptions {
  placeholder?: string;    // Input placeholder text
  defaultValue?: string;   // Default input value
  validation?: (value: string) => string | null; // Validation function
}
```

### Progress Dialog Options

```typescript
interface AppProgressDialogConfig extends CommonOptions {
  progressValue?: number;  // 0-100 for determinate, undefined for indeterminate
  onCancel?: () => void;   // Optional cancel callback
}
```

## Best Practices

### 1. Choose the Right Dialog Type

- **Error**: For operation failures, validation errors, exceptions
- **Confirm**: For destructive actions, important decisions
- **Info**: For success messages, notifications, information
- **Prompt**: For user input, simple forms
- **Progress**: For long-running operations, file operations, network requests

### 2. Use Appropriate Sizing

- **sm**: Simple messages, confirmations
- **md**: Default for most dialogs
- **lg**: Dialogs with details, longer messages
- **xl**: Complex forms, detailed error information

### 3. Progress Dialog Guidelines

- Use **indeterminate** progress (no progressValue) when you can't measure progress
- Use **determinate** progress (0-100) when you can track completion
- Always provide meaningful messages that update during the operation
- Include cancel functionality for operations that can be interrupted
- Hide progress dialogs when operations complete (success or failure)

### 4. Error Handling

```typescript
// Good: Specific error messages
dialogs.showErrorDialog({
  title: "Network Error",
  message: "Failed to connect to the server. Please check your internet connection.",
  error: error.message,
  onRetry: () => retryConnection()
});

// Avoid: Generic error messages
dialogs.showErrorDialog({
  title: "Error",
  message: "Something went wrong"
});
```

### 5. Confirmation Patterns

```typescript
// Good: Clear consequences
const confirmed = await dialogs.showConfirm({
  title: "Delete Notebook",
  message: "This will permanently delete 'My Analysis.nbjs' and cannot be undone.",
  variant: 'destructive',
  confirmText: "Delete Forever",
  cancelText: "Cancel"
});

// Good: Use promise-based API for cleaner async code
if (await dialogs.showConfirm({ title: "Save Changes?", message: "You have unsaved changes." })) {
  await saveNotebook();
}
```

## Integration with Commands

The dialog system integrates seamlessly with the command system:

```typescript
// Engine/Commands/FileCommands.ts
import { appDialogHelper } from '@/lib/AppDialogHelper';

export class SaveAsCommand extends Command {
  async execute() {
    try {
      const filename = await appDialogHelper.showPrompt(
        "Save As",
        "Enter filename for the notebook:",
        { 
          defaultValue: this.generateDefaultName(),
          validation: this.validateFilename
        }
      );

      if (!filename) return; // User cancelled

      // Show progress for file operation
      await appDialogHelper.showProgress(
        "Saving Notebook",
        `Saving as ${filename}...`
      );

      await this.saveToFile(filename);

      // Success notification
      await appDialogHelper.showInfo(
        "Save Complete",
        `Notebook saved as ${filename}`
      );
    } catch (error) {
      await appDialogHelper.showError(
        "Save Failed",
        "Could not save the notebook",
        error.message
      );
    }
  }

  private validateFilename(name: string): string | null {
    if (!name.trim()) return "Filename cannot be empty";
    if (!/^[^<>:"/\\|?*]+$/.test(name)) return "Invalid filename characters";
    return null;
  }
}
```

## Migrating from Old Dialog Systems

If you have existing AI dialogs or other dialog implementations:

### Before (AI-specific):
```typescript
// Old AI dialog approach
import { useAIDialogs } from '@/components/AIDialogProvider';

const { showProgress, updateProgress, hideProgress } = useAIDialogs();
```

### After (Unified):
```typescript
// New unified approach
import { useAppDialogs } from '@/components/AppDialogProvider';

const { showProgressDialog, updateProgress, hideProgress } = useAppDialogs();
```

The API is very similar, but now all dialog types are available from a single provider.

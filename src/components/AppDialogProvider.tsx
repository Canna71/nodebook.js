import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  AppErrorDialog,
  AppConfirmDialog,
  AppInfoDialog,
  AppPromptDialog,
  AppErrorDialogProps,
  AppConfirmDialogProps,
  AppInfoDialogProps,
  AppPromptDialogProps,
} from './AppDialogs';
import { AppDialogProps } from './AppDialog';
import anylogger from 'anylogger';

const log = anylogger('AppDialogProvider');

// Configuration interfaces for the helper methods
export interface AppErrorDialogConfig {
  title: string;
  message: string;
  error?: string;
  onRetry?: () => void;
  size?: AppDialogProps['size'];
}

export interface AppConfirmDialogConfig {
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
  confirmText?: string;
  cancelText?: string;
  size?: AppDialogProps['size'];
}

export interface AppInfoDialogConfig {
  title: string;
  message: string;
  details?: string;
  size?: AppDialogProps['size'];
}

export interface AppPromptDialogConfig {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  validation?: (value: string) => string | null;
  size?: AppDialogProps['size'];
}

// Dialog state interfaces
interface ErrorDialogState extends AppErrorDialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConfirmDialogState extends AppConfirmDialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface InfoDialogState extends AppInfoDialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PromptDialogState extends AppPromptDialogConfig {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}

interface AppDialogState {
  errorDialog: ErrorDialogState;
  confirmDialog: ConfirmDialogState;
  infoDialog: InfoDialogState;
  promptDialog: PromptDialogState;
}

interface AppDialogContextType {
  // Direct dialog control methods (for React components)
  showErrorDialog: (config: AppErrorDialogConfig) => void;
  showConfirmDialog: (config: AppConfirmDialogConfig & { onConfirm: () => void; onCancel?: () => void }) => void;
  showInfoDialog: (config: AppInfoDialogConfig) => void;
  showPromptDialog: (config: AppPromptDialogConfig & { onSubmit: (value: string) => void; onCancel?: () => void }) => void;
  
  // Promise-based methods (for use with the helper)
  showError: (config: AppErrorDialogConfig) => Promise<void>;
  showConfirm: (config: AppConfirmDialogConfig) => Promise<boolean>;
  showInfo: (config: AppInfoDialogConfig) => Promise<void>;
  showPrompt: (config: AppPromptDialogConfig) => Promise<string | null>;
  
  closeAllDialogs: () => void;
}

const AppDialogContext = createContext<AppDialogContextType | undefined>(undefined);

export function useAppDialogs() {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error('useAppDialogs must be used within an AppDialogProvider');
  }
  return context;
}

interface AppDialogProviderProps {
  children: ReactNode;
}

export function AppDialogProvider({ children }: AppDialogProviderProps) {
  const [state, setState] = useState<AppDialogState>({
    errorDialog: {
      open: false,
      title: '',
      message: '',
      onOpenChange: () => {},
    },
    confirmDialog: {
      open: false,
      title: '',
      message: '',
      onOpenChange: () => {},
      onConfirm: () => {},
    },
    infoDialog: {
      open: false,
      title: '',
      message: '',
      onOpenChange: () => {},
    },
    promptDialog: {
      open: false,
      title: '',
      message: '',
      onOpenChange: () => {},
      onSubmit: () => {},
    },
  });

  // Direct dialog control methods
  const showErrorDialog = useCallback((config: AppErrorDialogConfig) => {
    setState(prev => ({
      ...prev,
      errorDialog: {
        ...config,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            setState(prev => ({
              ...prev,
              errorDialog: { ...prev.errorDialog, open: false },
            }));
          }
        },
      },
    }));
  }, []);

  const showConfirmDialog = useCallback((config: AppConfirmDialogConfig & { onConfirm: () => void; onCancel?: () => void }) => {
    setState(prev => ({
      ...prev,
      confirmDialog: {
        ...config,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            setState(prev => ({
              ...prev,
              confirmDialog: { ...prev.confirmDialog, open: false },
            }));
          }
        },
      },
    }));
  }, []);

  const showInfoDialog = useCallback((config: AppInfoDialogConfig) => {
    setState(prev => ({
      ...prev,
      infoDialog: {
        ...config,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            setState(prev => ({
              ...prev,
              infoDialog: { ...prev.infoDialog, open: false },
            }));
          }
        },
      },
    }));
  }, []);

  const showPromptDialog = useCallback((config: AppPromptDialogConfig & { onSubmit: (value: string) => void; onCancel?: () => void }) => {
    setState(prev => ({
      ...prev,
      promptDialog: {
        ...config,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            setState(prev => ({
              ...prev,
              promptDialog: { ...prev.promptDialog, open: false },
            }));
          }
        },
      },
    }));
  }, []);

  // Promise-based methods for use with helper
  const showError = useCallback((config: AppErrorDialogConfig): Promise<void> => {
    return new Promise((resolve) => {
      showErrorDialog({
        ...config,
        // Override onRetry to resolve the promise if provided
        onRetry: config.onRetry ? () => {
          config.onRetry!();
          resolve();
        } : undefined,
      });
      // Error dialogs resolve immediately as they don't require user input beyond closing
      resolve();
    });
  }, [showErrorDialog]);

  const showConfirm = useCallback((config: AppConfirmDialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      const handleConfirm = () => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      };
      
      const handleCancel = () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      };
      
      showConfirmDialog({
        ...config,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      });
    });
  }, [showConfirmDialog]);

  const showInfo = useCallback((config: AppInfoDialogConfig): Promise<void> => {
    return new Promise((resolve) => {
      showInfoDialog(config);
      // Info dialogs resolve immediately as they don't require user input beyond closing
      resolve();
    });
  }, [showInfoDialog]);

  const showPrompt = useCallback((config: AppPromptDialogConfig): Promise<string | null> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      const handleSubmit = (value: string) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };
      
      const handleCancel = () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      };
      
      showPromptDialog({
        ...config,
        onSubmit: handleSubmit,
        onCancel: handleCancel,
      });
    });
  }, [showPromptDialog]);

  const closeAllDialogs = useCallback(() => {
    setState(prev => ({
      ...prev,
      errorDialog: { ...prev.errorDialog, open: false },
      confirmDialog: { ...prev.confirmDialog, open: false },
      infoDialog: { ...prev.infoDialog, open: false },
      promptDialog: { ...prev.promptDialog, open: false },
    }));
  }, []);
  // Register handlers with the helper on mount
  React.useEffect(() => {
    // Import and register handlers dynamically to avoid circular dependency
    import('@/lib/AppDialogHelper').then(({ appDialogHelper }) => {
      appDialogHelper.registerHandlers({
        showError,
        showConfirm,
        showInfo,
        showPrompt,
      });
      log.debug('App dialog handlers registered with helper');
    }).catch((error) => {
      log.error('Failed to register app dialog handlers:', error);
    });
  }, [showError, showConfirm, showInfo, showPrompt]);

  const contextValue: AppDialogContextType = {
    showErrorDialog,
    showConfirmDialog,
    showInfoDialog,
    showPromptDialog,
    showError,
    showConfirm,
    showInfo,
    showPrompt,
    closeAllDialogs,
  };

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}
      
      {/* Render dialogs */}
      <AppErrorDialog
        open={state.errorDialog.open}
        onOpenChange={state.errorDialog.onOpenChange}
        title={state.errorDialog.title}
        message={state.errorDialog.message}
        error={state.errorDialog.error}
        onRetry={state.errorDialog.onRetry}
        size={state.errorDialog.size}
      />
      
      <AppConfirmDialog
        open={state.confirmDialog.open}
        onOpenChange={state.confirmDialog.onOpenChange}
        title={state.confirmDialog.title}
        message={state.confirmDialog.message}
        variant={state.confirmDialog.variant}
        confirmText={state.confirmDialog.confirmText}
        cancelText={state.confirmDialog.cancelText}
        onConfirm={state.confirmDialog.onConfirm}
        onCancel={state.confirmDialog.onCancel}
        size={state.confirmDialog.size}
      />
      
      <AppInfoDialog
        open={state.infoDialog.open}
        onOpenChange={state.infoDialog.onOpenChange}
        title={state.infoDialog.title}
        message={state.infoDialog.message}
        details={state.infoDialog.details}
        size={state.infoDialog.size}
      />
      
      <AppPromptDialog
        open={state.promptDialog.open}
        onOpenChange={state.promptDialog.onOpenChange}
        title={state.promptDialog.title}
        message={state.promptDialog.message}
        placeholder={state.promptDialog.placeholder}
        defaultValue={state.promptDialog.defaultValue}
        validation={state.promptDialog.validation}
        onSubmit={state.promptDialog.onSubmit}
        onCancel={state.promptDialog.onCancel}
        size={state.promptDialog.size}
      />
    </AppDialogContext.Provider>
  );
}

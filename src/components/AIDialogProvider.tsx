import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AIPromptDialog, AIErrorDialog, AISuccessDialog } from '@/components/AIDialogs';
import { aiDialogHelper } from '@/lib/AIDialogHelper';

interface AIDialogState {
  promptDialog: {
    open: boolean;
    title: string;
    description: string;
    placeholder?: string;
    isGenerating: boolean;
    generationProgress?: string;
    onSubmit?: (prompt: string) => void;
    onCancel?: () => void;
  };
  errorDialog: {
    open: boolean;
    title: string;
    message: string;
    error?: string;
  };
  successDialog: {
    open: boolean;
    title: string;
    message: string;
  };
}

interface AIDialogContextType {
  showPromptDialog: (config: {
    title: string;
    description: string;
    placeholder?: string;
    onSubmit: (prompt: string) => void;
  }) => void;
  
  showGenerationProgress: (progress?: string) => void;
  hideGenerationProgress: () => void;
  
  showErrorDialog: (config: {
    title: string;
    message: string;
    error?: string;
  }) => void;
  
  showSuccessDialog: (config: {
    title: string;
    message: string;
  }) => void;
  
  closeAllDialogs: () => void;

  // Helper methods for use with the dialog helper
  showPrompt: (title: string, message: string, placeholder?: string) => Promise<string | null>;
  showError: (title: string, message: string) => Promise<void>;
  showSuccess: (title: string, message: string) => Promise<void>;
  showProgress: (title: string, message: string) => Promise<void>;
  hideProgress: () => void;
}

const AIDialogContext = createContext<AIDialogContextType | undefined>(undefined);

export function useAIDialogs() {
  const context = useContext(AIDialogContext);
  if (!context) {
    throw new Error('useAIDialogs must be used within an AIDialogProvider');
  }
  return context;
}

interface AIDialogProviderProps {
  children: ReactNode;
}

export function AIDialogProvider({ children }: AIDialogProviderProps) {
  const [state, setState] = useState<AIDialogState>({
    promptDialog: {
      open: false,
      title: '',
      description: '',
      isGenerating: false,
    },
    errorDialog: {
      open: false,
      title: '',
      message: '',
    },
    successDialog: {
      open: false,
      title: '',
      message: '',
    },
  });

  const showPromptDialog = (config: {
    title: string;
    description: string;
    placeholder?: string;
    onSubmit: (prompt: string) => void;
  }) => {
    setState(prev => ({
      ...prev,
      promptDialog: {
        ...config,
        open: true,
        isGenerating: false,
      },
    }));
  };

  const showGenerationProgress = (progress?: string) => {
    setState(prev => ({
      ...prev,
      promptDialog: {
        ...prev.promptDialog,
        isGenerating: true,
        generationProgress: progress,
      },
    }));
  };

  const hideGenerationProgress = () => {
    setState(prev => ({
      ...prev,
      promptDialog: {
        ...prev.promptDialog,
        open: false,
        isGenerating: false,
        generationProgress: undefined,
      },
    }));
  };

  const showErrorDialog = (config: {
    title: string;
    message: string;
    error?: string;
  }) => {
    // Close any other dialogs first
    setState(prev => ({
      ...prev,
      promptDialog: { ...prev.promptDialog, open: false },
      errorDialog: {
        ...config,
        open: true,
      },
    }));
  };

  const showSuccessDialog = (config: {
    title: string;
    message: string;
  }) => {
    // Close any other dialogs first
    setState(prev => ({
      ...prev,
      promptDialog: { ...prev.promptDialog, open: false },
      successDialog: {
        ...config,
        open: true,
      },
    }));
  };

  const closeAllDialogs = () => {
    setState(prev => ({
      ...prev,
      promptDialog: { ...prev.promptDialog, open: false },
      errorDialog: { ...prev.errorDialog, open: false },
      successDialog: { ...prev.successDialog, open: false },
    }));
  };

  // Helper methods for use with the dialog helper
  const showPrompt = (title: string, message: string, placeholder?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      let resolved = false;
      
      const handleSubmit = (prompt: string) => {
        if (!resolved) {
          resolved = true;
          resolve(prompt);
        }
      };
      
      const handleCancel = () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      };
      
      setState(prev => ({
        ...prev,
        promptDialog: {
          open: true,
          title,
          description: message,
          placeholder,
          isGenerating: false,
          onSubmit: handleSubmit,
          onCancel: handleCancel,
        },
      }));
    });
  };

  const showError = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      showErrorDialog({
        title,
        message,
      });
      // Resolve immediately as error dialogs don't need user interaction
      resolve();
    });
  };

  const showSuccess = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      showSuccessDialog({
        title,
        message,
      });
      // Resolve immediately as success dialogs don't need user interaction
      resolve();
    });
  };

  const showProgress = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      showGenerationProgress(message);
      resolve();
    });
  };

  const hideProgress = () => {
    hideGenerationProgress();
  };

  // Register handlers with the helper on mount
  useEffect(() => {
    aiDialogHelper.registerHandlers({
      showPrompt,
      showError,
      showSuccess,
      showProgress,
      hideProgress,
    });
  }, []);

  return (
    <AIDialogContext.Provider
      value={{
        showPromptDialog,
        showGenerationProgress,
        hideGenerationProgress,
        showErrorDialog,
        showSuccessDialog,
        closeAllDialogs,
        showPrompt,
        showError,
        showSuccess,
        showProgress,
        hideProgress,
      }}
    >
      {children}
      
      {/* Render dialogs */}
      <AIPromptDialog
        open={state.promptDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            // Call onCancel if dialog is closed without submission
            if (state.promptDialog.onCancel) {
              state.promptDialog.onCancel();
            }
            setState(prev => ({
              ...prev,
              promptDialog: { ...prev.promptDialog, open: false },
            }));
          }
        }}
        title={state.promptDialog.title}
        description={state.promptDialog.description}
        placeholder={state.promptDialog.placeholder}
        isGenerating={state.promptDialog.isGenerating}
        generationProgress={state.promptDialog.generationProgress}
        onSubmit={state.promptDialog.onSubmit || (() => {})}
      />
      
      <AIErrorDialog
        open={state.errorDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setState(prev => ({
              ...prev,
              errorDialog: { ...prev.errorDialog, open: false },
            }));
          }
        }}
        title={state.errorDialog.title}
        message={state.errorDialog.message}
        error={state.errorDialog.error}
      />
      
      <AISuccessDialog
        open={state.successDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setState(prev => ({
              ...prev,
              successDialog: { ...prev.successDialog, open: false },
            }));
          }
        }}
        title={state.successDialog.title}
        message={state.successDialog.message}
      />
    </AIDialogContext.Provider>
  );
}

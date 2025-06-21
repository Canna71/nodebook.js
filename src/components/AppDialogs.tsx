import React, { useState } from 'react';
import { AppDialog, AppDialogProps } from './AppDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import anylogger from 'anylogger';

const log = anylogger('AppDialogs');

// Error Dialog
export interface AppErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  error?: string; // Technical error details
  onRetry?: () => void; // Optional retry button
  size?: AppDialogProps['size'];
}

export function AppErrorDialog({
  open,
  onOpenChange,
  title,
  message,
  error,
  onRetry,
  size = 'md'
}: AppErrorDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  const footer = (
    <div className="flex gap-2 w-full">
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="flex-1"
        >
          Retry
        </Button>
      )}
      <Button
        onClick={() => onOpenChange(false)}
        className="flex-1"
      >
        Close
      </Button>
    </div>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      variant="destructive"
      size={size}
      footer={footer}    >
      {error && (
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start p-0 h-auto"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronDownIcon className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 mr-1" />
            )}
            Show technical details
          </Button>
          {showDetails && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-800 mb-1">
                <strong>Error details:</strong>
              </div>
              <div className="text-xs text-red-600 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                {error}
              </div>
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );
}

// Confirm Dialog
export interface AppConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
  confirmText?: string; // Default: "Confirm"
  cancelText?: string; // Default: "Cancel"
  onConfirm: () => void;
  onCancel?: () => void;
  size?: AppDialogProps['size'];
}

export function AppConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  size = 'sm'
}: AppConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const footer = (
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        onClick={handleCancel}
        className="flex-1"
      >
        {cancelText}
      </Button>
      <Button
        variant={variant === 'destructive' ? 'destructive' : 'default'}
        onClick={handleConfirm}
        className="flex-1"
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      variant={variant}
      size={size}
      footer={footer}
    />
  );
}

// Info Dialog
export interface AppInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  details?: string; // Optional expandable details
  size?: AppDialogProps['size'];
}

export function AppInfoDialog({
  open,
  onOpenChange,
  title,
  message,
  details,
  size = 'md'
}: AppInfoDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  const footer = (
    <Button onClick={() => onOpenChange(false)} className="w-full">
      OK
    </Button>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      variant="info"
      size={size}
      footer={footer}
    >
      {details && (
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start p-0 h-auto"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <ChevronDownIcon className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 mr-1" />
            )}
            Show details
          </Button>
          {showDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm text-blue-800 whitespace-pre-wrap">
                {details}
              </div>
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );
}

// Prompt Dialog
export interface AppPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  validation?: (value: string) => string | null; // Return error message or null
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  size?: AppDialogProps['size'];
}

export function AppPromptDialog({
  open,
  onOpenChange,
  title,
  message,
  placeholder,
  defaultValue = '',
  validation,
  onSubmit,
  onCancel,
  size = 'md'
}: AppPromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
    }
  }, [open, defaultValue]);

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    
    // Validate input
    if (validation) {
      const validationError = validation(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Clear error and submit
    setError(null);
    onSubmit(trimmedValue);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const footer = (
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        onClick={handleCancel}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="flex-1"
      >
        Submit
      </Button>
    </div>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      variant="default"
      size={size}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt-input">Input</Label>
          <Input
            id="prompt-input"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          Tip: Use Cmd/Ctrl + Enter to submit
        </div>
      </div>
    </AppDialog>
  );
}

// Progress Dialog
export interface AppProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  progressValue?: number; // 0-100 for determinate progress, undefined for indeterminate
  onCancel?: () => void; // Optional cancel button
  size?: AppDialogProps['size'];
}

export function AppProgressDialog({
  open,
  onOpenChange,
  title,
  message,
  progressValue,
  onCancel,
  size = 'md'
}: AppProgressDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={message}
      variant="progress"
      size={size}
      persistent={true} // Progress dialogs are persistent by default
      showCloseButton={false}
      isProgress={true}
      progressMessage={message}
      progressValue={progressValue}
      onCancel={onCancel}
    />
  );
}

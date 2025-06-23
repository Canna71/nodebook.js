import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AlertCircleIcon, CheckIcon, InfoIcon, AlertTriangleIcon, LoaderIcon } from 'lucide-react';

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info' | 'progress';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: string; // Custom max width
  persistent?: boolean; // Prevents closing with Escape or backdrop click
  showCloseButton?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  // Progress tracking properties
  isProgress?: boolean;
  progressMessage?: string;
  progressValue?: number; // 0-100 for determinate progress
  onCancel?: () => void; // For cancellable operations
}

const sizeClasses = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[500px]',
  lg: 'sm:max-w-[600px]',
  xl: 'sm:max-w-[800px]',
};

const variantStyles = {
  default: {
    icon: null as React.ComponentType<any> | null,
    titleClass: 'text-foreground',
    iconClass: '',
  },
  destructive: {
    icon: AlertCircleIcon,
    titleClass: 'text-error',
    iconClass: 'text-error',
  },
  warning: {
    icon: AlertTriangleIcon,
    titleClass: 'text-warning',
    iconClass: 'text-warning',
  },
  success: {
    icon: CheckIcon,
    titleClass: 'text-success',
    iconClass: 'text-success',
  },
  info: {
    icon: InfoIcon,
    titleClass: 'text-info',
    iconClass: 'text-info',
  },
  progress: {
    icon: LoaderIcon,
    titleClass: 'text-info',
    iconClass: 'text-info animate-spin',
  },
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  size = 'md',
  maxWidth,
  persistent = false,
  showCloseButton = true,
  children,
  footer,
  className,
  // Progress properties
  isProgress = false,
  progressMessage,
  progressValue,
  onCancel,
}: AppDialogProps) {
  const variantConfig = variantStyles[variant];
  const IconComponent = variantConfig.icon;

  const handleOpenChange = (newOpen: boolean) => {
    // If persistent is true, prevent closing
    if (persistent && !newOpen) {
      return;
    }
    onOpenChange(newOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle Escape key
    if (event.key === 'Escape' && !persistent) {
      onOpenChange(false);
    }
  };

  // Determine content class based on maxWidth or size
  const contentClass = maxWidth 
    ? className
    : cn(sizeClasses[size], className);
    
  const contentStyle = maxWidth 
    ? { maxWidth } 
    : undefined;

  // Handle title rendering - if it's already a React element, use it as-is
  // Otherwise wrap with icon if variant has one
  const titleContent = React.isValidElement(title) ? (
    title
  ) : (
    <div className={cn('flex items-center gap-2', variantConfig.titleClass)}>
      {IconComponent && (
        <IconComponent className={cn('h-5 w-5', variantConfig.iconClass)} />
      )}
      {title}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={contentClass}
        style={contentStyle}
        showCloseButton={showCloseButton && !persistent}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>
            {titleContent}
          </DialogTitle>
          {description && (
            <DialogDescription className="whitespace-pre-line">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Progress section for progress dialogs */}
        {isProgress && (
          <div className="py-4 space-y-4">
            {progressMessage && (
              <p className="text-sm text-muted-foreground">{progressMessage}</p>
            )}
            
            {typeof progressValue === 'number' ? (
              // Determinate progress bar
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            ) : (
              // Indeterminate progress bar
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {onCancel && (
              <div className="flex justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {children && !isProgress && (
          <div className="py-4">
            {children}
          </div>
        )}

        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

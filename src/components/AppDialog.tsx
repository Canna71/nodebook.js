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
import { AlertCircleIcon, CheckIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';

export interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: string; // Custom max width
  persistent?: boolean; // Prevents closing with Escape or backdrop click
  showCloseButton?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
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
    titleClass: 'text-red-600',
    iconClass: 'text-red-600',
  },
  warning: {
    icon: AlertTriangleIcon,
    titleClass: 'text-yellow-600',
    iconClass: 'text-yellow-600',
  },
  success: {
    icon: CheckIcon,
    titleClass: 'text-green-600',
    iconClass: 'text-green-600',
  },
  info: {
    icon: InfoIcon,
    titleClass: 'text-blue-600',
    iconClass: 'text-blue-600',
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
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
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

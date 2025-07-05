import React from 'react';
import { AppDialog } from './AppDialog';
import { Button } from '@/components/ui/button';
import NotebookCellsStack from '@/components/icons/NotebookCellsStack';

export interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  version: string;
  author: string;
  license: string;
}

export function AboutDialog({
  open,
  onOpenChange,
  appName,
  version,
  author,
  license
}: AboutDialogProps) {
  const customTitle = (
    <div className="flex items-center space-x-3">
      <NotebookCellsStack size={32} className="text-primary flex-shrink-0" />
      <span>{appName}</span>
    </div>
  );

  const footer = (
    <Button onClick={() => onOpenChange(false)} className="w-full">
      OK
    </Button>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={customTitle}
      description={`Version ${version}\n\n© 2025 ${author}\n\nLicense: ${license}`}
      variant="info"
      size="md"
      footer={footer}
    />
  );
}

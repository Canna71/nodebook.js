import React, { useState } from 'react';
import { AppDialog, AppDialogProps } from './AppDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SparklesIcon, AlertCircleIcon, CheckIcon } from 'lucide-react';
import anylogger from 'anylogger';

const log = anylogger('AIDialogs');

interface AIPromptDialogProps extends Omit<AppDialogProps, 'variant' | 'children' | 'footer'> {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  isGenerating?: boolean;
  generationProgress?: string;
}

export function AIPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  placeholder = 'Enter your prompt here...',
  isGenerating = false,
  generationProgress
}: AIPromptDialogProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt.trim());
      setPrompt(''); // Clear for next time
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const titleWithIcon = (
    <div className="flex items-center gap-2">
      <SparklesIcon className="h-5 w-5" />
      {title}
    </div>
  );

  const content = isGenerating ? (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
        <span className="text-sm text-secondary-foreground">
          {generationProgress || 'Generating with AI...'}
        </span>
      </div>
      
      {/* Progress skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="text-xs text-secondary-foreground bg-background-secondary p-3 rounded-md">
        <strong>Generating:</strong> {prompt}
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-prompt">Prompt</Label>
        <textarea
          id="ai-prompt"
          placeholder={placeholder}
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>
      
      <div className="text-xs text-secondary-foreground">
        Tip: Use Cmd/Ctrl + Enter to submit
      </div>
    </div>
  );

  const footer = isGenerating ? (
    <Button disabled className="w-full">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
      Generating...
    </Button>
  ) : (
    <div className="flex gap-2 w-full">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={!prompt.trim()}
        className="flex-1"
      >
        <SparklesIcon className="h-4 w-4 mr-2" />
        Generate
      </Button>
    </div>
  );

  return (
    <AppDialog
      variant="default"
      open={open}
      onOpenChange={onOpenChange}
      title={titleWithIcon}
      description={description}
      maxWidth="600px"
      footer={footer}
    >
      {content}
    </AppDialog>
  );
}

interface AIErrorDialogProps extends Omit<AppDialogProps, 'variant' | 'children' | 'footer'> {
  message?: string; // Keep backward compatibility 
  error?: string;
}

export function AIErrorDialog({
  open,
  onOpenChange,
  title,
  description,
  message,
  error
}: AIErrorDialogProps) {
  const titleWithIcon = (
    <div className="flex items-center gap-2 text-red-600">
      <AlertCircleIcon className="h-5 w-5" />
      {title}
    </div>
  );

  // Use description if provided, fallback to message for backward compatibility
  const dialogDescription = description || message;

  const content = error ? (
    <div className="bg-red-50 border border-red-200 rounded-md p-3">
      <div className="text-sm text-red-800">
        <strong>Error details:</strong>
      </div>
      <div className="text-xs text-red-600 font-mono mt-1 max-h-32 overflow-y-auto">
        {error}
      </div>
    </div>
  ) : null;

  const footer = (
    <Button onClick={() => onOpenChange(false)} className="w-full">
      Close
    </Button>
  );

  return (
    <AppDialog
      variant="destructive"
      open={open}
      onOpenChange={onOpenChange}
      title={titleWithIcon}
      description={dialogDescription}
      maxWidth="500px"
      footer={footer}
    >
      {content}
    </AppDialog>
  );
}

interface AISuccessDialogProps extends Omit<AppDialogProps, 'variant' | 'children' | 'footer'> {
  message?: string; // Keep backward compatibility
}

export function AISuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  message
}: AISuccessDialogProps) {
  const titleWithIcon = (
    <div className="flex items-center gap-2 text-green-600">
      <CheckIcon className="h-5 w-5" />
      {title}
    </div>
  );

  // Use description if provided, fallback to message for backward compatibility
  const dialogDescription = description || message;

  const footer = (
    <Button onClick={() => onOpenChange(false)} className="w-full">
      Great!
    </Button>
  );

  return (
    <AppDialog
      variant="success"
      open={open}
      onOpenChange={onOpenChange}
      title={titleWithIcon}
      description={dialogDescription}
      maxWidth="500px"
      footer={footer}
    />
  );
}

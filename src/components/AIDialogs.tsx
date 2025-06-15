import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SparklesIcon, AlertCircleIcon, CheckIcon } from 'lucide-react';
import anylogger from 'anylogger';

const log = anylogger('AIDialogs');

interface AIPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (prompt: string) => void;
  title: string;
  description: string;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">
                {generationProgress || 'Generating with AI...'}
              </span>
            </div>
            
            {/* Progress skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Generating:</strong> {prompt}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Prompt</Label>
              <textarea
                id="ai-prompt"
                placeholder={placeholder}
                value={prompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
            
            <div className="text-xs text-muted-foreground">
              Tip: Use Cmd/Ctrl + Enter to submit
            </div>
          </div>
        )}

        <DialogFooter>
          {isGenerating ? (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AIErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  error?: string;
}

export function AIErrorDialog({
  open,
  onOpenChange,
  title,
  message,
  error
}: AIErrorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircleIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-sm text-red-800">
              <strong>Error details:</strong>
            </div>
            <div className="text-xs text-red-600 font-mono mt-1 max-h-32 overflow-y-auto">
              {error}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AISuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
}

export function AISuccessDialog({
  open,
  onOpenChange,
  title,
  message
}: AISuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Great!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Keyboard, Command } from 'lucide-react';
import { useCommands } from '@/Engine/CommandProvider';

interface KeyboardShortcutsViewProps {
  onClose?: () => void;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: Array<{
    keys: string;
    description: string;
    commandId?: string;
  }>;
}

export function KeyboardShortcutsView({ onClose }: KeyboardShortcutsViewProps) {
  const { commandManager } = useCommands();
  // Static list of ONLY working shortcuts - no dynamic loading needed
  const shortcuts = (() => {
    // Detect platform for display
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const cmdKey = isMac ? '⌘' : 'Ctrl';
    const altKey = isMac ? '⌥' : 'Alt';
    const shiftKey = isMac ? '⇧' : 'Shift';

    return [
      {
        title: 'File Operations',
        icon: <Command className="w-4 h-4" />,
        shortcuts: [
          { keys: `${cmdKey}+N`, description: 'New Notebook' },
          { keys: `${cmdKey}+O`, description: 'Open Notebook' },
          { keys: `${cmdKey}+S`, description: 'Save Notebook' },
          { keys: `${shiftKey}+${cmdKey}+S`, description: 'Save As...' },
        ]
      },
      {
        title: 'Cell Operations',
        icon: <Keyboard className="w-4 h-4" />,
        shortcuts: [
          { keys: `${shiftKey}+Enter`, description: 'Run Cell' },
          { keys: `${shiftKey}+${cmdKey}+Enter`, description: 'Run All Cells' },
          { keys: `${shiftKey}+${cmdKey}+C`, description: 'Insert Code Cell' },
          { keys: `${shiftKey}+${cmdKey}+M`, description: 'Insert Markdown Cell' },
          { keys: `${shiftKey}+${cmdKey}+F`, description: 'Insert Formula Cell' },
          { keys: `${shiftKey}+${cmdKey}+I`, description: 'Insert Input Cell' },
          { keys: `${cmdKey}+D`, description: 'Duplicate Cell' },
          { keys: `${shiftKey}+${cmdKey}+D`, description: 'Delete Cell' },
        ]
      },
      {
        title: 'AI Features',
        icon: <Command className="w-4 h-4" />,
        shortcuts: [
          { keys: `${cmdKey}+${altKey}+G`, description: 'Generate Notebook with AI' },
          { keys: `${cmdKey}+${altKey}+C`, description: 'Generate Code Cell with AI' },
        ]
      },
      {
        title: 'Editing',
        icon: <Keyboard className="w-4 h-4" />,
        shortcuts: [
          { keys: `${cmdKey}+Z`, description: 'Undo' },
          { keys: `${shiftKey}+${cmdKey}+Z`, description: 'Redo' },
        ]
      },
      {
        title: 'View & Navigation',
        icon: <Command className="w-4 h-4" />,
        shortcuts: [
          { keys: `${cmdKey}+R`, description: 'Reload Application' },
          { keys: `${cmdKey}+0`, description: 'Reset Zoom' },
          { keys: `${cmdKey}+/`, description: 'Show Keyboard Shortcuts' },
          { keys: `${cmdKey}+\``, description: 'Toggle Console Viewer' },
          { keys: `${shiftKey}+${cmdKey}+\``, description: 'Toggle Output Panel' },
        ]
      }
    ];
  })();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Keyboard className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Keyboard Shortcuts</h1>
            <p className="text-sm text-secondary-foreground">
              Master Nodebook.js with these keyboard shortcuts
            </p>
          </div>
        </div>
        {onClose && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
            <div className="max-w-4xl mx-auto flex justify-start">
              <Button variant="outline" onClick={onClose}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shortcuts.map((group, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                {group.icon}
                <span>{group.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.shortcuts.map((shortcut, shortcutIndex) => (
                  <div key={shortcutIndex} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.split(/[\+\s]/).map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-xs text-secondary-foreground">+</span>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-secondary-foreground bg-secondary border border-border rounded">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Tips */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-foreground">💡 Pro Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-foreground">
              <div>
                <strong>Cell Execution:</strong> Use Shift+Enter to run individual cells, Shift+Cmd+Enter for all
              </div>
              <div>
                <strong>Quick Cell Creation:</strong> Use Shift+Cmd+[Letter] to insert different cell types
              </div>
              <div>
                <strong>AI Integration:</strong> Use Cmd+Alt+G to generate entire notebooks with AI
              </div>
              <div>
                <strong>Console Access:</strong> Use Cmd+` to toggle the console viewer for debugging
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Fixed Bottom Actions */}
      {onClose && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex justify-start">
            <Button variant="outline" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

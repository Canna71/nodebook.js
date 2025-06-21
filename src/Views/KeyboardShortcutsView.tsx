import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Keyboard, Command } from 'lucide-react';
import { useCommands } from '@/Engine/CommandProvider';
import anylogger from 'anylogger';

const log = anylogger('KeyboardShortcutsView');

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
  const [shortcuts, setShortcuts] = useState<ShortcutGroup[]>([]);

  useEffect(() => {
    loadShortcuts();
  }, [commandManager]);

  const loadShortcuts = () => {
    try {
      // Get all commands with shortcuts from the command manager
      const allCommands = commandManager.getAllCommands();
      const commandsWithShortcuts = allCommands.filter(cmd => cmd.shortcut);

      // Detect platform for display
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const cmdKey = isMac ? '⌘' : 'Ctrl';
      const altKey = isMac ? '⌥' : 'Alt';
      const shiftKey = isMac ? '⇧' : 'Shift';

      // Helper function to format shortcuts for display
      const formatShortcut = (shortcut: string): string => {
        return shortcut
          .replace(/Ctrl/g, cmdKey)
          .replace(/Alt/g, altKey)
          .replace(/Shift/g, shiftKey)
          .replace(/\+/g, isMac ? '' : '+');
      };

      // Group shortcuts by category
      const shortcutGroups: ShortcutGroup[] = [
        {
          title: 'File Operations',
          icon: <Command className="w-4 h-4" />,
          shortcuts: [
            { keys: `${cmdKey}+N`, description: 'New Notebook' },
            { keys: `${cmdKey}+O`, description: 'Open Notebook' },
            { keys: `${cmdKey}+S`, description: 'Save Notebook' },
            { keys: `${cmdKey}+${shiftKey}+S`, description: 'Save As...' },
          ]
        },
        {
          title: 'Cell Operations',
          icon: <Keyboard className="w-4 h-4" />,
          shortcuts: [
            { keys: `${shiftKey}+Enter`, description: 'Run Cell' },
            { keys: `${cmdKey}+${shiftKey}+Enter`, description: 'Run All Cells' },
            { keys: `${cmdKey}+${shiftKey}+C`, description: 'Insert Code Cell' },
            { keys: `${cmdKey}+${shiftKey}+M`, description: 'Insert Markdown Cell' },
            { keys: `${cmdKey}+${shiftKey}+F`, description: 'Insert Formula Cell' },
            { keys: `${cmdKey}+${shiftKey}+I`, description: 'Insert Input Cell' },
            { keys: `${cmdKey}+${shiftKey}+D`, description: 'Delete Cell' },
          ]
        },
        {
          title: 'View & Navigation',
          icon: <Command className="w-4 h-4" />,
          shortcuts: [
            { keys: 'F1', description: 'Show Documentation' },
            { keys: `${cmdKey}+R`, description: 'Reload Application' },
            { keys: 'F11', description: 'Toggle Fullscreen' },
            { keys: `${cmdKey}+0`, description: 'Reset Zoom' },
            { keys: `${cmdKey}+\``, description: 'Toggle Console Viewer' },
            { keys: `${cmdKey}+${shiftKey}+\``, description: 'Toggle Output Panel' },
          ]
        }
      ];

      // Add any additional shortcuts from command manager
      const dynamicShortcuts = commandsWithShortcuts
        .filter(cmd => !isShortcutAlreadyListed(cmd.shortcut || '', shortcutGroups))
        .map(cmd => ({
          keys: formatShortcut(cmd.shortcut || ''),
          description: cmd.tooltip || cmd.id,
          commandId: cmd.id
        }));

      if (dynamicShortcuts.length > 0) {
        shortcutGroups.push({
          title: 'Additional Commands',
          icon: <Command className="w-4 h-4" />,
          shortcuts: dynamicShortcuts
        });
      }

      setShortcuts(shortcutGroups);
      log.debug('Loaded shortcuts:', shortcutGroups);
    } catch (error) {
      log.error('Failed to load shortcuts:', error);
      // Fallback shortcuts if command manager fails
      setShortcuts([
        {
          title: 'Basic Operations',
          icon: <Keyboard className="w-4 h-4" />,
          shortcuts: [
            { keys: 'Ctrl+N', description: 'New Notebook' },
            { keys: 'Ctrl+O', description: 'Open Notebook' },
            { keys: 'Ctrl+S', description: 'Save Notebook' },
            { keys: 'Shift+Enter', description: 'Run Cell' },
          ]
        }
      ]);
    }
  };

  const isShortcutAlreadyListed = (shortcut: string, groups: ShortcutGroup[]): boolean => {
    const normalizedShortcut = shortcut.toLowerCase().replace(/\s/g, '');
    return groups.some(group => 
      group.shortcuts.some(s => 
        s.keys.toLowerCase().replace(/\s/g, '').includes(normalizedShortcut) ||
        normalizedShortcut.includes(s.keys.toLowerCase().replace(/\s/g, ''))
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
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
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
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
                <strong>Cell Navigation:</strong> Use arrow keys to move between cells when not editing
              </div>
              <div>
                <strong>Quick Edit:</strong> Double-click any cell to start editing immediately
              </div>
              <div>
                <strong>Batch Operations:</strong> Hold Shift while clicking to select multiple cells
              </div>
              <div>
                <strong>Context Menu:</strong> Right-click on cells for additional options
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

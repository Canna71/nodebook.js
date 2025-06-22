import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useCommands } from '@/Engine/CommandProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { FeatureFlags } from '@/config/features';
import {
  SaveIcon,
  FileIcon,
  FolderOpenIcon,
  PlayIcon,
  UndoIcon,
  RedoIcon,
  VariableIcon,
  SparklesIcon,
  SettingsIcon,
  TerminalIcon,
  ScrollTextIcon,
  XIcon,
  BookOpenIcon,
  PencilIcon
} from 'lucide-react';
import { MarkdownIcon } from './icons/MarkdownIcon';
import { JavascriptIcon } from './icons/JavascriptIcon';

export function Toolbar() {
  const { commandManager } = useCommands();
  const { currentModel, readingMode } = useApplication(); // Get reading mode state
  // Removed outputPanelVisible and consolePanelVisible state since buttons are now in View menu

  const handleCommand = (commandId: string) => {
    commandManager.executeCommand(commandId);
  };

  const handleAddCell = (cellType: string) => {
    // Use the new command system with proper parameters
    const commandId = `cell.add.${cellType}`;
    commandManager.executeCommand(commandId, {
      cellType: cellType as any,
      insertStrategy: 'after-selected'
    });
  };

  // Get command info for tooltips and shortcuts
  const getCommandInfo = (commandId: string) => {
    return commandManager.getAllCommands().find(info => info.id === commandId);
  };

  const saveInfo = getCommandInfo('notebook.save');
  const newInfo = getCommandInfo('notebook.new');
  const openInfo = getCommandInfo('notebook.open');
  const closeInfo = getCommandInfo('notebook.close');
  const executeAllInfo = getCommandInfo('notebook.executeAll');
  const undoInfo = getCommandInfo('edit.undo');
  const redoInfo = getCommandInfo('edit.redo');
  const aiGenerateNotebookInfo = getCommandInfo('ai.generateNotebook');

  return (
    <div className="sticky top-0 left-0 right-0 z-40 flex items-center h-12 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <TooltipProvider>
        {/* Sidebar Toggle - only show if sidebar is enabled */}
        {FeatureFlags.SIDEBAR_ENABLED && (
          <>
            <SidebarTrigger className="mr-2 bg-background/80 hover:bg-background/90" />
            <Separator orientation="vertical" className="mx-2 h-6" />
          </>
        )}

        {/* File Operations */}
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('notebook.new')}
              >
                <FileIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {newInfo?.tooltip}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('notebook.open')}
              >
                <FolderOpenIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {openInfo?.tooltip}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('ai.generateNotebook')}
              >
                <SparklesIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {aiGenerateNotebookInfo?.tooltip}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('help.documentation')}
              >
                <BookOpenIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              View Documentation
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('notebook.save')}
                disabled={!currentModel}
              >
                <SaveIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {saveInfo?.tooltip} {!currentModel && "(No notebook loaded)"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('notebook.close')}
                disabled={!currentModel}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {closeInfo?.tooltip} {!currentModel && "(No notebook loaded)"}
            </TooltipContent>
          </Tooltip>
        </div>

        {currentModel && (
          <>
            <Separator orientation="vertical" className="mx-2 h-6" />

            {/* Execution */}
            <Tooltip>
              <TooltipTrigger asChild>          
                <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('notebook.executeAll')}
              >
                  <PlayIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {executeAllInfo?.tooltip}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="mx-2 h-6" />

            {/* Add Cell Buttons */}
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCell('code')}
                  >
                    <JavascriptIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add Code Cell
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCell('markdown')}
                  >
                    <MarkdownIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add Markdown Cell
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCell('formula')}
                  >
                    <span className="font-bold text-current text-sm">𝒇𝑥</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add Formula Cell
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddCell('input')}
                  >
                    <VariableIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add Input Cell
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCommand('cell.add.ai')}
                  >
                    <SparklesIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Generate Cell with AI
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}

        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('edit.undo')}
                disabled={true} // Disabled until undo/redo is implemented
              >
                <UndoIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {undoInfo?.tooltip} (Coming Soon)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCommand('edit.redo')}
                disabled={true} // Disabled until undo/redo is implemented
              >
                <RedoIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {redoInfo?.tooltip} (Coming Soon)
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('view.settings')}
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Open Settings
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Reading Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('view.toggleReadingMode')}
              disabled={!currentModel}
            >
              {readingMode ? (
                <PencilIcon className="h-4 w-4" />
              ) : (
                <BookOpenIcon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {readingMode ? 'Exit Reading Mode (Ctrl+R)' : 'Enter Reading Mode (Ctrl+R)'} {!currentModel && "(No notebook loaded)"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Output and Console Panel toggles moved to View menu - buttons commented out */}
        {/*
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setOutputPanelVisible(!outputPanelVisible);
                // Also dispatch a custom event that the App component can listen to
                window.dispatchEvent(new CustomEvent('toggleOutputPanel'));
              }}
            >
              <TerminalIcon className="h-3 w-3 mr-1" />
              <span className="text-xs">Output</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Toggle global output panel (Ctrl+Shift+`)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setConsolePanelVisible(!consolePanelVisible);
                // Also dispatch a custom event that the App component can listen to
                window.dispatchEvent(new CustomEvent('toggleConsolePanel'));
              }}
            >
              <ScrollTextIcon className="h-3 w-3 mr-1" />
              <span className="text-xs">Console</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Toggle console viewer (Ctrl+`)
          </TooltipContent>
        </Tooltip>
        */}
      </TooltipProvider>
    </div>
  );
}

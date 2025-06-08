import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useCommands } from '@/Engine/CommandProvider';
import {
  SaveIcon,
  FileIcon,
  PlayIcon,
  PlusIcon,
  UndoIcon,
  RedoIcon,
  ChevronDownIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Toolbar() {
  const { commandManager } = useCommands();

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
  const executeAllInfo = getCommandInfo('notebook.executeAll');
  const undoInfo = getCommandInfo('edit.undo');
  const redoInfo = getCommandInfo('edit.redo');

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center h-12 pl-12 pr-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <TooltipProvider>
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
                onClick={() => handleCommand('notebook.save')}
              >
                <SaveIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {saveInfo?.tooltip}
            </TooltipContent>
          </Tooltip>
        </div>

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

        {/* Add Cell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <>
              <PlusIcon className="h-4 w-4" />
              Add Cell
              <ChevronDownIcon className="h-3 w-3" />
                </>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAddCell('code')}>
              <span className="mr-2">{'{ }'}</span>
              Code Cell
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddCell('markdown')}>
              <span className="mr-2">Md</span>
              Markdown Cell
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddCell('formula')}>
              <span className="mr-2">fx</span>
              Formula Cell
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddCell('input')}>
              <span className="mr-2">⚪</span>
              Input Cell
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
      </TooltipProvider>
    </div>
  );
}

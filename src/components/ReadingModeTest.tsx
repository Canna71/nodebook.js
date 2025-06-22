import React, { useState } from 'react';
import { DynamicNotebook } from './DynamicNotebook';
import { NotebookModel } from '../Types/NotebookModel';
import { Button } from './ui/button';
import { Eye, Edit } from 'lucide-react';

interface ReadingModeTestProps {
  notebook: NotebookModel;
}

export function ReadingModeTest({ notebook }: ReadingModeTestProps) {
  const [readingMode, setReadingMode] = useState(false);

  return (
    <div className="reading-mode-test">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between p-4 bg-background-secondary border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {notebook.metadata?.title || 'Notebook'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-secondary-foreground">
            {readingMode ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Reading Mode</span>
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                <span>Edit Mode</span>
              </>
            )}
          </div>
        </div>
        
        <Button
          onClick={() => setReadingMode(!readingMode)}
          variant={readingMode ? "default" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          {readingMode ? (
            <>
              <Edit className="w-4 h-4" />
              Switch to Edit Mode
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Switch to Reading Mode
            </>
          )}
        </Button>
      </div>

      {/* Notebook Content */}
      <div className={`notebook-container ${readingMode ? 'reading-mode-active' : 'edit-mode-active'}`}>
        <DynamicNotebook 
          model={notebook} 
          readingMode={readingMode}
        />
      </div>

      {/* Mode Info */}
      <div className="p-4 bg-background-secondary border-t border-border">
        <div className="text-sm text-secondary-foreground">
          {readingMode ? (
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <div className="font-medium text-blue-500 mb-1">Reading Mode Active</div>
                <div>
                  Only content and interactive elements are shown. 
                  Input values can still be changed and will trigger reactive updates.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Edit className="w-4 h-4 mt-0.5 text-green-500" />
              <div>
                <div className="font-medium text-green-500 mb-1">Edit Mode Active</div>
                <div>
                  Full editing capabilities are available. 
                  You can add, edit, delete, and rearrange cells.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

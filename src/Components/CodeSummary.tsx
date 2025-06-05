import React from 'react';

interface CodeSummaryProps {
  code: string;
  exports?: string[];
  dependencies?: string[];
}

interface CodeMetadata {
  title?: string;
  description?: string;
  purpose?: string;
  firstLine: string;
  hasComments: boolean;
}

/**
 * Parse code to extract metadata from comments and structure
 */
function parseCodeMetadata(code: string): CodeMetadata {
  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let title: string | undefined;
  let description: string | undefined;
  let purpose: string | undefined;
  let firstLine = '';
  let hasComments = false;

  // Find first non-comment line for fallback display
  const firstCodeLine = lines.find(line => 
    !line.startsWith('//') && 
    !line.startsWith('/*') && 
    !line.startsWith('*') &&
    line.length > 0
  );
  firstLine = firstCodeLine || lines[0] || '';

  // Parse comment-based metadata
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('//') || line.startsWith('*')) {
      hasComments = true;
      const comment = line.replace(/^(\/\/|\*)\s*/, '');
      
      // Look for metadata patterns
      if (comment.match(/^@title\s+(.+)/i)) {
        title = comment.replace(/^@title\s+/i, '');
      } else if (comment.match(/^@description\s+(.+)/i)) {
        description = comment.replace(/^@description\s+/i, '');
      } else if (comment.match(/^@purpose\s+(.+)/i)) {
        purpose = comment.replace(/^@purpose\s+/i, '');
      } else if (!title && comment.length > 0 && !comment.includes('@')) {
        // Use first meaningful comment as title if no explicit @title
        title = comment;
      }
    }
  }

  return {
    title,
    description,
    purpose,
    firstLine,
    hasComments
  };
}

export function CodeSummary({ code, exports = [], dependencies = [] }: CodeSummaryProps) {
  const metadata = parseCodeMetadata(code);
  
  // Determine what to display as the main summary
  const displayText = metadata.title || metadata.purpose || metadata.firstLine;
  
  return (
    <div className="code-summary p-4 bg-background-secondary border-b border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Main summary text */}
          <div className="text-sm text-foreground mb-2">
            {displayText.length > 100 ? `${displayText.substring(0, 100)}...` : displayText}
          </div>
          
          {/* Additional metadata if available */}
          {metadata.description && metadata.description !== metadata.title && (
            <div className="text-xs text-secondary-foreground mb-2">
              {metadata.description}
            </div>
          )}
          
          {/* Exports and dependencies summary */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {exports.length > 0 && (
              <span>
                <strong>Exports:</strong> {exports.join(', ')}
              </span>
            )}
            {dependencies.length > 0 && (
              <span>
                <strong>Uses:</strong> {dependencies.join(', ')}
              </span>
            )}
          </div>
        </div>
        
        {/* Code type indicator */}
        <div className="ml-4 text-xs text-muted-foreground">
          {metadata.hasComments ? '📄' : '⚡'} JavaScript
        </div>
      </div>
    </div>
  );
}

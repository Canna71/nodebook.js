import { CodeIcon, AlertTriangleIcon } from 'lucide-react';
import React from 'react';

interface CodeSummaryProps {
  code: string;
  exports?: string[];
  dependencies?: string[];
  error?: Error | null; // Add error prop
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
  // Handle undefined or null code
  if (!code || typeof code !== 'string') {
    return {
      firstLine: '',
      hasComments: false
    };
  }
  
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

export function CodeSummary({ code, exports = [], dependencies = [], error = null }: CodeSummaryProps) {
  const metadata = parseCodeMetadata(code);
  
  // Determine what to display as the main summary
  const displayText = metadata.title || metadata.purpose || metadata.firstLine;
  
  return (
    <div className="code-summary bg-muted/20 px-4 py-2 border-b border-border font-mono text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {/* Language indicator with code icon */}
        <CodeIcon className="w-3 h-3" />
        
        {/* Error indicator */}
        {error && (
          <>
            <AlertTriangleIcon className="w-3 h-3 text-destructive" />
            <span className="text-xs text-destructive font-medium">Error</span>
            <span className="text-muted-foreground/60">{'•'}</span>
          </>
        )}
        
        {/* Code preview with comment styling */}
        {displayText && (
          <>
            <span className="text-muted-foreground/60">{'•'}</span>
            <span className="text-xs text-muted-foreground/80 italic">
              {displayText}
            </span>
          </>
        )}
      </div>
      
      {/* Dependencies and exports with comment-style indicators */}
      {(dependencies.length > 0 || exports.length > 0) && (
        <div className="flex items-center gap-4 mt-1 text-xs">
          {dependencies.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/60">depends:</span>
              <div className="flex gap-1">
                {dependencies.map((dep, index) => (
                  <span key={dep} className="text-info font-medium">
                    {dep}{index < dependencies.length - 1 && ','}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {exports.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground/60">exports:</span>
              <div className="flex gap-1">
                {exports.map((exp, index) => (
                  <span key={exp} className="text-success font-medium">
                    {exp}{index < exports.length - 1 && ','}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

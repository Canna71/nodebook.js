import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { initializeDocumentationHelpers, getDocumentationHelpers, DocumentationFileInfo } from '@/lib/documentationHelpers';
import { useCommands } from '@/Engine/CommandProvider';
import anylogger from 'anylogger';

const log = anylogger('DocumentationViewer');

// Enhanced markdown-it setup for documentation
import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

interface DocumentationViewerProps {
  onClose?: () => void;
  initialDocument?: string;
}

export function DocumentationViewer({ onClose, initialDocument = 'index.md' }: DocumentationViewerProps) {
  const [currentDoc, setCurrentDoc] = useState(initialDocument);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableDocs, setAvailableDocs] = useState<DocumentationFileInfo[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const { commandManager } = useCommands();

  useEffect(() => {
    initializeDocumentationSystem();
  }, []);

  const initializeDocumentationSystem = async () => {
    try {
      await initializeDocumentationHelpers();
      await loadAvailableDocuments();
      await loadDocument(currentDoc);
    } catch (error) {
      log.error('Failed to initialize documentation system:', error);
      setError(`Failed to initialize documentation: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (availableDocs.length > 0) {
      loadDocument(currentDoc);
    }
  }, [currentDoc]);

  const loadAvailableDocuments = async () => {
    try {
      const docHelpers = getDocumentationHelpers();
      const result = await docHelpers.listDocuments();
      if (result.success && result.data) {
        setAvailableDocs(result.data);
      } else {
        log.warn('Failed to load available documents:', result.error);
      }
    } catch (error) {
      log.error('Could not load available documents:', error);
    }
  };

  const loadDocument = async (filename: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const docHelpers = getDocumentationHelpers();
      const result = await docHelpers.loadDocument(filename);
      
      if (result.success && result.data) {
        // Process markdown content and handle internal links
        const processedContent = await processMarkdownContent(result.data);
        setContent(processedContent);
      } else {
        setError(result.error || 'Failed to load document');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      log.error('Failed to load document:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMarkdownContent = async (markdownContent: string): Promise<string> => {
    // Convert markdown to HTML
    let html = markdown.render(markdownContent);
    
    // Process internal links (./file.md) to make them clickable
    html = html.replace(
      /href="\.\/([^"]+\.md)"/g,
      'href="#" data-internal-link="$1" onclick="event.preventDefault(); window.navigateToDoc && window.navigateToDoc(\'$1\')"'
    );
    
    // Process image sources to load them as data URLs
    const imageRegex = /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g;
    let match;
    const imagePromises: Promise<void>[] = [];
    
    while ((match = imageRegex.exec(html)) !== null) {
      const [fullMatch, beforeSrc, src, afterSrc] = match;
      
      // If the image source is relative and doesn't start with http/https/data:
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        imagePromises.push(
          (async () => {
            try {
              const docHelpers = getDocumentationHelpers();
              const result = await docHelpers.loadImage(src);
              
              if (result.success && result.data) {
                // Replace the image src with the data URL
                html = html.replace(
                  fullMatch,
                  `<img${beforeSrc}src="${result.data}"${afterSrc} style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">`
                );
              } else {
                // If image loading fails, show a placeholder
                html = html.replace(
                  fullMatch,
                  `<div class="documentation-image-placeholder border-2 border-dashed border-border rounded-lg p-8 text-center text-secondary-foreground my-4">
                    📷 Image not found: ${src}
                    <br><small>Could not load image file</small>
                  </div>`
                );
              }
            } catch (error) {
              log.warn(`Failed to load image ${src}:`, error);
              // Replace with placeholder on error
              html = html.replace(
                fullMatch,
                `<div class="documentation-image-placeholder border-2 border-dashed border-border rounded-lg p-8 text-center text-secondary-foreground my-4">
                  📷 Image error: ${src}
                  <br><small>Error loading image</small>
                </div>`
              );
            }
          })()
        );
      }
    }
    
    // Wait for all image loading to complete
    await Promise.all(imagePromises);
    
    return html;
  };

  const navigateToDocument = (filename: string) => {
    // Don't add to history if we're navigating to the same document
    if (filename !== currentDoc) {
      // Add current document to history before navigating
      setNavigationHistory(prev => [...prev, currentDoc]);
      setCurrentDoc(filename);
    }
  };

  const navigateBack = () => {
    if (navigationHistory.length > 0) {
      const previousDoc = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentDoc(previousDoc);
    }
  };

  const canGoBack = navigationHistory.length > 0;

  // Make navigation function available globally for link clicks
  useEffect(() => {
    (window as any).navigateToDoc = navigateToDocument;
    
    return () => {
      delete (window as any).navigateToDoc;
    };
  }, [currentDoc]);

  const getCurrentDocInfo = () => {
    return availableDocs.find(doc => doc.filename === currentDoc);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Documentation</span>
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-secondary-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Failed to load documentation</p>
            <p className="text-xs">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDocInfo = getCurrentDocInfo();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documentation</h1>
            {currentDocInfo && (
              <p className="text-sm text-secondary-foreground">{currentDocInfo.title}</p>
            )}
          </div>
        </div>
        
        {/* Navigation Controls */}
        <div className="flex items-center space-x-2">
          {canGoBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={navigateBack}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          )}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 pb-8">
          <div 
            className="prose prose-slate dark:prose-invert max-w-none
                       prose-headings:text-foreground prose-p:text-foreground 
                       prose-strong:text-foreground prose-code:text-foreground
                       prose-pre:bg-background-secondary prose-pre:border prose-pre:border-border
                       prose-blockquote:border-l-primary prose-blockquote:text-secondary-foreground
                       prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:cursor-pointer"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  );
}

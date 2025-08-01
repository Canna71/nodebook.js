import React, { useEffect, useState } from 'react';
import { useApplication } from '@/Engine/ApplicationProvider';
import { useCommands } from '@/Engine/CommandProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FolderOpen, Sparkles, Clock, Monitor, Brain, Zap, Database, BookOpen } from 'lucide-react';
import { RecentNotebooksManager, RecentNotebook } from '@/lib/recentNotebooks';
import { moduleRegistry } from '@/Engine/ModuleRegistry';
import { getFileSystemHelpers, NotebookFileInfo } from '@/lib/fileSystemHelpers';
import NotebookCellsStack from '@/components/icons/NotebookCellsStack';

const path = require('node:path');

export function HomePage() {
  const { createNewNotebook, loadNotebook } = useApplication();
  const { commandManager } = useCommands();
  const [recentNotebooks, setRecentNotebooks] = useState<RecentNotebook[]>([]);
  const [exampleNotebooks, setExampleNotebooks] = useState<NotebookFileInfo[]>([]);
  const [systemInfo, setSystemInfo] = useState({
    appVersion: '1.0.0',
    moduleCount: 0,
    notebookCount: 0,
    storageSize: '0MB',
    platform: 'Unknown',
    runtimeVersions: {
      node: 'N/A',
      chromium: 'N/A',
      v8: 'N/A',
      electron: 'N/A'
    }
  });

  useEffect(() => {
    loadRecentNotebooks();
    loadExampleNotebooks();
  }, []);

  // Update system info when recent notebooks change
  useEffect(() => {
    loadSystemInfo();
  }, [recentNotebooks]);

  const loadRecentNotebooks = async () => {
    try {
      const recent = await RecentNotebooksManager.getRecentNotebooks();
      setRecentNotebooks(recent);
    } catch (error) {
      console.warn('Could not load recent notebooks:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      // Get app version from package.json
      let appVersion = '0.8.0'; // Fallback version
      try {
        const appInfo = await window.api.getAppInfo();
        appVersion = appInfo.version;
      } catch (error) {
        console.warn('Could not get app version, using fallback:', error);
      }

      // Get runtime versions
      let runtimeVersions = {
        node: 'N/A',
        chromium: 'N/A',
        v8: 'N/A',
        electron: 'N/A'
      };
      try {
        const versions = await window.api.getRuntimeVersions();
        runtimeVersions = versions;
      } catch (error) {
        console.warn('Could not get runtime versions, using fallback:', error);
      }

      // Get system information
      const moduleCount = moduleRegistry.getAvailableModules().length;
      const info = {
        appVersion,
        moduleCount,
        notebookCount: recentNotebooks.length, // Use current state
        storageSize: '2.3MB', // TODO: Calculate actual size
        platform: navigator.platform,
        runtimeVersions
      };
      setSystemInfo(info);
    } catch (error) {
      console.warn('Could not load system info:', error);
    }
  };

  const loadExampleNotebooks = async () => {
    try {
      const fileSystemHelpers = await getFileSystemHelpers();
      const result = await fileSystemHelpers.listExamples();
      if (result.success && result.data) {
        setExampleNotebooks(result.data);
      } else {
        console.warn('Failed to load examples:', result.error);
        setExampleNotebooks([]);
      }
    } catch (error) {
      console.warn('Could not load example notebooks:', error);
      setExampleNotebooks([]);
    }
  };

  const handleOpenRecent = async (notebook: RecentNotebook) => {
    try {
      await loadNotebook(notebook.path);
      await RecentNotebooksManager.addRecentNotebook(notebook.path, notebook.name);
      loadRecentNotebooks(); // Refresh the list
    } catch (error) {
      console.error('Failed to open recent notebook:', error);
    }
  };  const handleOpenExample = async (example: NotebookFileInfo) => {
    try {
      await loadNotebook(example.filepath);
      // Add to recent notebooks for easy access
      const fileName = path.basename(example.filepath);
      await RecentNotebooksManager.addRecentNotebook(example.filepath, fileName);
      loadRecentNotebooks(); // Refresh the list
    } catch (error) {
      console.error('Failed to open example notebook:', error);
    }
  };

  const handleCreateWithAI = () => {
    // Use the command manager directly like the toolbar does
    commandManager.executeCommand('ai.generateNotebook');
  };

  const handleOpenFile = () => {
    // Use the command manager directly like the toolbar does
    commandManager.executeCommand('notebook.open');
  };  const extractFileName = (filePath: string): string => {
    // Use path.basename to get the filename, then remove extension
    const fileName = path.basename(filePath);
    return fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  };

  const extractDirectory = (filePath: string): string => {
    // Use path.dirname to get the directory path
    return path.dirname(filePath);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <>
      <div className="max-w-5xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-4">
          <NotebookCellsStack size={64} className="text-primary" />
          <div className="space-y-1">
            <h1 className="text-5xl font-bold text-foreground tracking-tight">Nodebook.js</h1>
            <p className="text-xl text-secondary-foreground">Interactive Reactive Notebooks</p>
          </div>
          <Badge variant="secondary" className="ml-4 text-sm px-3 py-1">
            v{systemInfo.appVersion}
          </Badge>
        </div>
        
        <div className="flex justify-center space-x-8 text-sm text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Reactive Programming</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Rich Data Support</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Start Section - Row 1, Col 1 */}
        <div className="space-y-4 order-1 lg:order-1">
          <h2 className="text-lg font-semibold text-foreground">Start</h2>
          <div className="space-y-2">
            <button
              onClick={() => commandManager.executeCommand('notebook.new')}
              className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm">New file...</span>
            </button>
            
            <button
              onClick={handleOpenFile}
              className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm">Open file...</span>
            </button>
            
            <button
              onClick={handleCreateWithAI}
              className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors cursor-pointer"
            >
              <Brain className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm">Generate with AI...</span>
            </button>
            
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('showDocumentation'))}
              className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm">View documentation</span>
            </button>
          </div>
        </div>

        {/* Recent Section - Row 2 on mobile, Row 2 Col 1 on desktop */}
        <div className="space-y-4 order-2 lg:order-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent</h2>
            {recentNotebooks.length > 0 && (
              <button
                onClick={() => RecentNotebooksManager.clearRecentNotebooks().then(loadRecentNotebooks)}
                className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
          
          {recentNotebooks.length > 0 ? (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {recentNotebooks.map((notebook, index) => (
                <div
                  key={notebook.path}
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-accent/50 rounded transition-colors"
                  onClick={() => handleOpenRecent(notebook)}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-primary hover:text-primary/80">
                        {extractFileName(notebook.path)}
                      </span>
                      <span className="text-xs text-secondary-foreground ml-2">
                        {extractDirectory(notebook.path)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-secondary-foreground flex-shrink-0">
                    {formatTimeAgo(notebook.lastOpened)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent files</p>
              <p className="text-xs">Files you've worked on will appear here</p>
            </div>
          )}
        </div>

        {/* Examples Section - Row 3 on mobile, Row 1-2 Col 2 on desktop */}
        <div className="space-y-4 order-3 lg:order-2 lg:row-span-2">
          <h2 className="text-lg font-semibold text-foreground">Examples</h2>
          
          {exampleNotebooks.length > 0 ? (
            <div className="space-y-1 overflow-y-auto">
              {exampleNotebooks.map((example, index) => {
                const filename = extractFileName(example.filepath);
                
                return (
                  <div
                    key={example.filepath}
                    className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-accent/50 rounded transition-colors"
                    onClick={() => handleOpenExample(example)}
                  >
                    <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-primary hover:text-primary/80 truncate">
                        {filename}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No example notebooks found</p>
              <p className="text-xs">Example notebooks will appear here</p>
            </div>
          )}
        </div>

        {/* System Section - Row 4 on mobile, Row 3 Col 1 on desktop */}
        <Card className="order-4 lg:order-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Version</span>
              <Badge variant="outline" className="text-xs">v{systemInfo.appVersion}</Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Node.js</span>
              <Badge variant="secondary" className="text-xs">v{systemInfo.runtimeVersions.node}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Chromium</span>
              <Badge variant="secondary" className="text-xs">v{systemInfo.runtimeVersions.chromium}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>V8</span>
              <Badge variant="secondary" className="text-xs">v{systemInfo.runtimeVersions.v8}</Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Platform</span>
              <span className="text-xs text-secondary-foreground">{systemInfo.platform}</span>
            </div>
          </CardContent>
        </Card>

        {/* Modules Section - Row 5 on mobile, Row 3 Col 2 on desktop */}
        <Card className="order-5 lg:order-5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base">
              <Database className="w-4 h-4" />
              <span>Modules ({systemInfo.moduleCount})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {(() => {
                try {
                  const modules = moduleRegistry.getAvailableModulesWithVersions(); // Restore version display
                  return modules.map((module, index) => {
                    // Ensure module name is a string
                    let safeModuleName: string;
                    let safeModuleVersion: string | undefined;
                    
                    try {
                      if (typeof module.name === 'string') {
                        safeModuleName = module.name;
                      } else if (module.name && typeof module.name === 'object') {
                        safeModuleName = `Module ${index + 1}`;
                        console.warn('Module name is an object:', module.name);
                      } else {
                        safeModuleName = String(module.name);
                      }

                      // Safely handle version - ensure it's always a string
                      if (typeof module.version === 'string') {
                        safeModuleVersion = module.version;
                      } else if (module.version && typeof module.version === 'object') {
                        // This should not happen anymore with our fixed version detection
                        safeModuleVersion = undefined;
                        console.warn('Module version is still an object for', safeModuleName, ':', module.version);
                      } else if (module.version) {
                        safeModuleVersion = String(module.version);
                      }
                    } catch (error) {
                      console.error('Error processing module:', error);
                      safeModuleName = `Unknown Module ${index + 1}`;
                      safeModuleVersion = undefined;
                    }
                    
                    return (
                      <div key={`module-${index}-${safeModuleName}`} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
                          <span className="font-mono text-xs truncate">{safeModuleName}</span>
                        </div>
                        {safeModuleVersion && (
                          <span className="text-xs text-secondary-foreground flex-shrink-0 ml-2">
                            v{safeModuleVersion}
                          </span>
                        )}
                      </div>
                    );
                  });
                } catch (error) {
                  console.error('Error loading modules:', error);
                  return (
                    <div className="text-secondary-foreground text-xs">
                      Error loading modules
                    </div>
                  );
                }
              })()}
              {systemInfo.moduleCount === 0 && (
                <div className="text-secondary-foreground text-xs">No modules loaded</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}

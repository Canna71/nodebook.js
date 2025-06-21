import React, { useEffect, useState } from 'react';
import { useApplication } from '@/Engine/ApplicationProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FolderOpen, Sparkles, Clock, Monitor, Brain, Zap, Database } from 'lucide-react';
import { RecentNotebooksManager, RecentNotebook } from '@/lib/recentNotebooks';
import { moduleRegistry } from '@/Engine/ModuleRegistry';

export function HomePage() {
  const { createNewNotebook, loadNotebook } = useApplication();
  const [recentNotebooks, setRecentNotebooks] = useState<RecentNotebook[]>([]);
  const [systemInfo, setSystemInfo] = useState({
    appVersion: '1.0.0',
    moduleCount: 0,
    notebookCount: 0,
    storageSize: '0MB',
    platform: 'Unknown'
  });

  useEffect(() => {
    loadRecentNotebooks();
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
      // Get system information
      const moduleCount = moduleRegistry.getAvailableModules().length;
      const info = {
        appVersion: '1.0.0', // TODO: Get from package.json or electron
        moduleCount,
        notebookCount: recentNotebooks.length, // Use current state
        storageSize: '2.3MB', // TODO: Calculate actual size
        platform: navigator.platform
      };
      setSystemInfo(info);
    } catch (error) {
      console.warn('Could not load system info:', error);
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
  };

  const handleCreateWithAI = () => {
    // Trigger AI notebook creation dialog
    window.dispatchEvent(new CustomEvent('openAIDialog', { 
      detail: { type: 'createNotebook' } 
    }));
  };

  const handleOpenFile = () => {
    // Use the command system to open file dialog
    window.dispatchEvent(new CustomEvent('executeCommand', { 
      detail: { commandId: 'notebook.open' } 
    }));
  };

  const extractFileName = (path: string): string => {
    const fileName = path.split('/').pop() || path.split('\\').pop() || path;
    return fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  };

  const extractDirectory = (path: string): string => {
    const parts = path.split('/');
    if (parts.length > 1) {
      parts.pop(); // Remove filename
      return parts.join('/');
    }
    return path;
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
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-5xl">🔬</div>
          <div className="space-y-1">
            <h1 className="text-5xl font-bold text-foreground tracking-tight">NotebookJS</h1>
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

      {/* Quick Actions - VSCode Style */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Start</h2>
        <div className="space-y-2">
          <button
            onClick={createNewNotebook}
            className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors"
          >
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm">New file...</span>
          </button>
          
          <button
            onClick={handleOpenFile}
            className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm">Open file...</span>
          </button>
          
          <button
            onClick={handleCreateWithAI}
            className="flex items-center space-x-3 text-left p-2 w-full text-primary hover:text-primary/80 hover:bg-accent/50 rounded transition-colors"
          >
            <Brain className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm">Generate with AI...</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Notebooks - VSCode Style */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent</h2>
            {recentNotebooks.length > 0 && (
              <button
                onClick={() => RecentNotebooksManager.clearRecentNotebooks().then(loadRecentNotebooks)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          
          {recentNotebooks.length > 0 ? (
            <div className="space-y-1">
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

        {/* System Information */}
        <div className="space-y-6">
          <Card>
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
                <span>Recent files</span>
                <Badge variant="secondary" className="text-xs">{systemInfo.notebookCount}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Platform</span>
                <span className="text-xs text-secondary-foreground">{systemInfo.platform}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
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
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
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
    </div>
  );
}

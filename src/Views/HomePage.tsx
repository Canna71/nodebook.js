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
    loadSystemInfo();
  }, []);

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
        notebookCount: recentNotebooks.length,
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

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Sparkles className="w-6 h-6" />
            <span>Get Started</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={createNewNotebook}
              className="flex items-center justify-center space-x-3 h-16 text-lg"
              size="lg"
            >
              <FileText className="w-6 h-6" />
              <span>New Notebook</span>
            </Button>
            
            <Button
              onClick={handleOpenFile}
              variant="outline"
              className="flex items-center justify-center space-x-3 h-16 text-lg"
              size="lg"
            >
              <FolderOpen className="w-6 h-6" />
              <span>Open Notebook</span>
            </Button>
            
            <Button
              onClick={handleCreateWithAI}
              variant="outline"
              className="flex items-center justify-center space-x-3 h-16 text-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800"
              size="lg"
            >
              <Brain className="w-6 h-6" />
              <span>Create with AI</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Notebooks */}
        <div className="lg:col-span-2">
          {recentNotebooks.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Notebooks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentNotebooks.map((notebook, index) => (
                    <div
                      key={notebook.path}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                      onClick={() => handleOpenRecent(notebook)}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground truncate">
                            {notebook.name}
                          </div>
                          <div className="text-sm text-secondary-foreground truncate">
                            {notebook.path}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-secondary-foreground flex-shrink-0 ml-4">
                        {formatTimeAgo(notebook.lastOpened)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Notebooks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-secondary-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent notebooks</p>
                  <p className="text-sm">Your recently opened notebooks will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* System Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">App Version</span>
                  <Badge variant="outline">v{systemInfo.appVersion}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Modules Loaded</span>
                  <Badge variant="secondary">{systemInfo.moduleCount}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recent Files</span>
                  <Badge variant="secondary">{systemInfo.notebookCount}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platform</span>
                  <span className="text-sm text-secondary-foreground">{systemInfo.platform}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <strong>Reactive Variables:</strong> Use <code className="bg-secondary px-1 rounded">exports.name = value</code> to create reactive variables that automatically update dependent cells.
              </div>
              <div>
                <strong>LaTeX Support:</strong> Write mathematical expressions directly in markdown cells using <code className="bg-secondary px-1 rounded">$formula$</code> syntax.
              </div>
              <div>
                <strong>AI Assistant:</strong> Use the AI features to generate notebooks, analyze data, and create visualizations automatically.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

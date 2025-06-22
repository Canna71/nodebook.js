import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { KeyIcon, CheckIcon, AlertCircleIcon, SparklesIcon, BookOpenIcon, PencilIcon, SettingsIcon, XIcon, SunIcon, MoonIcon, MonitorIcon } from 'lucide-react';
import { AIService } from '@/Engine/AIService';
import { useView } from '@/Engine/ViewProvider';
import { useCommands } from '@/Engine/CommandProvider';
import anylogger from 'anylogger';

const log = anylogger('SettingsView');

interface AISettingsState {
    openaiApiKey: string;
    claudeApiKey: string;
    provider: 'openai' | 'claude';
    model: string;
    isTestingConnection: boolean;
    connectionTestResult: 'idle' | 'success' | 'error';
    connectionTestMessage: string;
}

interface AppSettingsState {
    defaultReadingMode: boolean;
    theme: 'light' | 'dark' | 'system';
}

export function SettingsView() {
    const aiService = AIService.getInstance();
    const { setCurrentView } = useView();
    const { commandManager } = useCommands();
    
    // Map internal provider names to UI display names
    const getUIProvider = (internalProvider: 'openai' | 'anthropic'): 'openai' | 'claude' => {
        return internalProvider === 'anthropic' ? 'claude' : internalProvider;
    };
    
    const getInternalProvider = (uiProvider: 'openai' | 'claude'): 'openai' | 'anthropic' => {
        return uiProvider === 'claude' ? 'anthropic' : uiProvider;
    };
    
    const [aiSettings, setAiSettings] = useState<AISettingsState>({
        openaiApiKey: aiService.getApiKey('openai') || '',
        claudeApiKey: aiService.getApiKey('claude') || '',
        provider: getUIProvider(aiService.getProvider()),
        model: aiService.getModel(),
        isTestingConnection: false,
        connectionTestResult: 'idle',
        connectionTestMessage: ''
    });

    const [appSettings, setAppSettings] = useState<AppSettingsState>({
        defaultReadingMode: false,
        theme: 'system'
    });

    // Load app settings on component mount
    useEffect(() => {
        const loadAppSettings = async () => {
            try {
                const defaultReadingMode = await window.api.getAppSetting('defaultReadingMode', false);
                const theme = await window.api.getAppSetting('theme', 'system');
                setAppSettings({
                    defaultReadingMode,
                    theme
                });
                // Apply the theme immediately
                applyTheme(theme);
            } catch (error) {
                log.error('Failed to load app settings:', error);
            }
        };
        
        loadAppSettings();
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = async () => {
            // Only apply if current theme is system
            try {
                const currentTheme = await window.api.getAppSetting('theme', 'system');
                if (currentTheme === 'system') {
                    applyTheme('system');
                }
            } catch (error) {
                log.error('Failed to check theme setting:', error);
            }
        };
        
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        
        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    const handleApiKeyChange = (provider: 'openai' | 'claude', value: string) => {
        setAiSettings(prev => ({
            ...prev,
            [`${provider}ApiKey`]: value
        }));
    };

    const handleProviderChange = (provider: 'openai' | 'claude') => {
        const models = provider === 'openai' 
            ? ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
            : ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
        
        setAiSettings(prev => ({
            ...prev,
            provider,
            model: models[0]
        }));
    };

    const handleSaveSettings = async () => {
        try {
            // Save AI settings
            // Prepare API keys object
            const apiKeys: any = {};
            if (aiSettings.openaiApiKey) {
                apiKeys.openai = aiSettings.openaiApiKey;
            }
            if (aiSettings.claudeApiKey) {
                apiKeys.anthropic = aiSettings.claudeApiKey; // Note: internal name is 'anthropic'
            }
            
            // Save API keys using the saveAPIKeys method
            await aiService.saveAPIKeys(apiKeys);
            
            // Save provider and model
            aiService.setProvider(getInternalProvider(aiSettings.provider));
            aiService.setModel(aiSettings.model);
            
            // Save app settings
            await window.api.setAppSetting('defaultReadingMode', appSettings.defaultReadingMode);
            await window.api.setAppSetting('theme', appSettings.theme);
            
            log.info('Settings saved successfully');
            
            // Show success feedback
            setAiSettings(prev => ({
                ...prev,
                connectionTestResult: 'success',
                connectionTestMessage: 'Settings saved successfully!'
            }));
            
            setTimeout(() => {
                setAiSettings(prev => ({
                    ...prev,
                    connectionTestResult: 'idle',
                    connectionTestMessage: ''
                }));
            }, 3000);
        } catch (error) {
            log.error('Error saving settings:', error);
            setAiSettings(prev => ({
                ...prev,
                connectionTestResult: 'error',
                connectionTestMessage: 'Failed to save settings'
            }));
        }
    };

    const handleTestConnection = async () => {
        setAiSettings(prev => ({
            ...prev,
            isTestingConnection: true,
            connectionTestResult: 'idle',
            connectionTestMessage: ''
        }));

        try {
            // Temporarily set the settings for testing
            const currentApiKey = aiSettings.provider === 'openai' ? aiSettings.openaiApiKey : aiSettings.claudeApiKey;
            if (!currentApiKey) {
                throw new Error('API key is required for testing');
            }

            // Prepare API keys object for testing
            const testApiKeys: any = {};
            if (aiSettings.provider === 'openai') {
                testApiKeys.openai = currentApiKey;
            } else {
                testApiKeys.anthropic = currentApiKey; // Note: internal name is 'anthropic'
            }
            
            // Save API keys and configuration for testing
            await aiService.saveAPIKeys(testApiKeys);
            aiService.setProvider(getInternalProvider(aiSettings.provider));
            aiService.setModel(aiSettings.model);

            const testResult = await aiService.testConnection();
            
            setAiSettings(prev => ({
                ...prev,
                connectionTestResult: testResult.success ? 'success' : 'error',
                connectionTestMessage: testResult.message,
                isTestingConnection: false
            }));
        } catch (error) {
            log.error('Connection test failed:', error);
            setAiSettings(prev => ({
                ...prev,
                connectionTestResult: 'error',
                connectionTestMessage: error instanceof Error ? error.message : 'Connection test failed',
                isTestingConnection: false
            }));
        }
    };

    const getAvailableModels = () => {
        return aiSettings.provider === 'openai' 
            ? ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
            : ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
    };

    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
        const root = document.documentElement;
        
        if (theme === 'system') {
            // Remove manual theme classes and let CSS media query handle it
            root.classList.remove('dark', 'light');
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            }
        } else if (theme === 'dark') {
            root.classList.remove('light');
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }
    };

    const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
        setAppSettings(prev => ({ ...prev, theme }));
        applyTheme(theme);
        
        // Save theme setting immediately for better UX
        try {
            await window.api.setAppSetting('theme', theme);
            log.info('Theme setting saved:', theme);
        } catch (error) {
            log.error('Failed to save theme setting:', error);
        }
    };

    return (
        <div className="relative min-h-screen bg-background">
            <div className="flex-1 space-y-6 p-6 pb-24">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Configure your Nodebook.js preferences and integrations.
                </p>
            </div>
            
            <Separator />
            
            {/* Application Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Application Preferences
                    </CardTitle>
                    <CardDescription>
                        Configure default behavior and user interface preferences.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Default Reading Mode Setting */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Default Document Mode</h4>
                        
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="default-reading-mode"
                                checked={appSettings.defaultReadingMode}
                                onCheckedChange={(checked) => 
                                    setAppSettings(prev => ({ ...prev, defaultReadingMode: !!checked }))
                                }
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label 
                                    htmlFor="default-reading-mode"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Start in Reading Mode by default
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, notebooks will open in reading mode (clean view without editing controls). 
                                    You can still toggle to edit mode anytime with Ctrl+R.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {appSettings.defaultReadingMode ? (
                                <>
                                    <BookOpenIcon className="h-4 w-4" />
                                    <span>Notebooks will start in reading mode (clean view)</span>
                                </>
                            ) : (
                                <>
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Notebooks will start in edit mode (normal view)</span>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Theme Setting */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Appearance</h4>
                        
                        <div className="space-y-2">
                            <Label htmlFor="theme-select">Theme</Label>
                            <Select value={appSettings.theme} onValueChange={handleThemeChange}>
                                <SelectTrigger id="theme-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="system">
                                        <div className="flex items-center gap-2">
                                            <MonitorIcon className="h-4 w-4" />
                                            <span>System</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="light">
                                        <div className="flex items-center gap-2">
                                            <SunIcon className="h-4 w-4" />
                                            <span>Light</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="dark">
                                        <div className="flex items-center gap-2">
                                            <MoonIcon className="h-4 w-4" />
                                            <span>Dark</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Choose your preferred theme. System will follow your operating system's theme preference.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {appSettings.theme === 'system' ? (
                                <>
                                    <MonitorIcon className="h-4 w-4" />
                                    <span>Follows system theme preference</span>
                                </>
                            ) : appSettings.theme === 'light' ? (
                                <>
                                    <SunIcon className="h-4 w-4" />
                                    <span>Light theme enabled</span>
                                </>
                            ) : (
                                <>
                                    <MoonIcon className="h-4 w-4" />
                                    <span>Dark theme enabled</span>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Separator />
            
            {/* AI Assistant Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5" />
                        AI Assistant
                    </CardTitle>
                    <CardDescription>
                        Configure AI providers and models for notebook and code cell generation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* API Keys Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">API Keys</h4>
                        
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="openai-key">OpenAI API Key</Label>
                                <Input
                                    id="openai-key"
                                    type="password"
                                    placeholder="sk-..."
                                    value={aiSettings.openaiApiKey}
                                    onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="claude-key">Claude API Key</Label>
                                <Input
                                    id="claude-key"
                                    type="password"
                                    placeholder="sk-ant-..."
                                    value={aiSettings.claudeApiKey}
                                    onChange={(e) => handleApiKeyChange('claude', e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                            API keys are stored in memory only and will need to be re-entered when the app restarts.
                        </p>
                    </div>
                    
                    <Separator />
                    
                    {/* Provider and Model Selection */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Model Configuration</h4>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="provider">Provider</Label>
                                <Select 
                                    value={aiSettings.provider} 
                                    onValueChange={handleProviderChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="openai">OpenAI</SelectItem>
                                        <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Select 
                                    value={aiSettings.model} 
                                    onValueChange={(value) => setAiSettings(prev => ({ ...prev, model: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getAvailableModels().map(model => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    {/* AI-specific Actions */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={handleTestConnection}
                                disabled={aiSettings.isTestingConnection || 
                                    !(aiSettings.provider === 'openai' ? aiSettings.openaiApiKey : aiSettings.claudeApiKey)}
                            >
                                {aiSettings.isTestingConnection ? 'Testing...' : 'Test Connection'}
                            </Button>
                        </div>
                        
                        {/* Connection Test Result */}
                        {aiSettings.connectionTestResult !== 'idle' && (
                            <div className={`flex items-center gap-2 text-sm ${
                                aiSettings.connectionTestResult === 'success' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                            }`}>
                                {aiSettings.connectionTestResult === 'success' ? (
                                    <CheckIcon className="h-4 w-4" />
                                ) : (
                                    <AlertCircleIcon className="h-4 w-4" />
                                )}
                                <span>{aiSettings.connectionTestMessage}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {/* Debug Section */}
            {process.env.NODE_ENV === 'development' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5" />
                            Debug Information
                        </CardTitle>
                        <CardDescription>
                            Development tools and storage diagnostics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            onClick={async () => {
                                try {                                    const info = await window.api.getApiKeyStorageInfo();
                                    console.log('API Key Storage Info:', info);
                                    
                                    // Show the info in a proper dialog instead of alert
                                    const { appDialogHelper } = await import('@/lib/AppDialogHelper');
                                    await appDialogHelper.showInfo(
                                        'API Key Storage Info',
                                        'Storage information for debugging:',
                                        JSON.stringify(info, null, 2)
                                    );
                                } catch (error) {
                                    console.error('Failed to get storage info:', error);
                                }
                            }}
                            variant="outline"
                        >
                            Check Storage Info
                        </Button>
                    </CardContent>
                </Card>            )}
            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
                <div className="max-w-4xl mx-auto flex justify-between">
                    <Button variant="outline" onClick={() => commandManager.executeCommand('view.close')}>
                        <XIcon className="h-4 w-4 mr-2" />
                        Close
                    </Button>
                    <Button onClick={handleSaveSettings}>
                        Save Settings
                    </Button>
                </div>
            </div>
            
            {/* Future settings sections can be added here */}
        </div>
    );
}

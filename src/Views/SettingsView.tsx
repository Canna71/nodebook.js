import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { KeyIcon, CheckIcon, AlertCircleIcon, SparklesIcon } from 'lucide-react';
import { AIService } from '@/Engine/AIService';
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

export function SettingsView() {
    const aiService = AIService.getInstance();
    
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
            
            log.info('AI settings saved successfully');
            
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
            log.error('Error saving AI settings:', error);
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

    return (
        <div className="flex-1 space-y-6 p-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Configure your NotebookJS preferences and integrations.
                </p>
            </div>
            
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
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <Button onClick={handleSaveSettings}>
                                Save Settings
                            </Button>
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
                </Card>
            )}
            
            {/* Future settings sections can be added here */}
        </div>
    );
}

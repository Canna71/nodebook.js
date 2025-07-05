import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SettingsIcon, KeyIcon, CheckIcon, AlertCircleIcon } from 'lucide-react';
import { AIService, LLMProvider } from '@/Engine/AIService';
import { toast } from 'sonner';
import anylogger from 'anylogger';

const log = anylogger('AISettings');

interface AISettingsProps {
    children?: React.ReactNode;
}

export function AISettings({ children }: AISettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openAIKey, setOpenAIKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
    const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
    const [isLoading, setIsLoading] = useState(false);
    const [hasKeys, setHasKeys] = useState(false);
    const [availableProviders, setAvailableProviders] = useState<LLMProvider[]>([]);

    const aiService = AIService.getInstance();

    const openAIModels = [
        { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Economical)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
    ];

    const anthropicModels = [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' }
    ];

    useEffect(() => {
        checkAPIKeysStatus();
    }, []);

    const checkAPIKeysStatus = async () => {
        try {
            await aiService.initializeAPIKeys();
            setHasKeys(aiService.hasAPIKeys());
            setAvailableProviders(aiService.getAvailableProviders());
            
            if (aiService.hasAPIKeys()) {
                // Set default provider to first available
                const providers = aiService.getAvailableProviders();
                if (providers.length > 0) {
                    setSelectedProvider(providers[0]);
                }
            }
        } catch (error) {
            log.error('Failed to check API keys status:', error);
        }
    };

    const handleSaveAPIKeys = async () => {
        if (!openAIKey && !anthropicKey) {
            toast.error('Please enter at least one API key');
            return;
        }

        setIsLoading(true);
        try {
            const keys = {
                ...(openAIKey && { openai: openAIKey }),
                ...(anthropicKey && { anthropic: anthropicKey })
            };

            await aiService.saveAPIKeys(keys);
            setHasKeys(true);
            setAvailableProviders(aiService.getAvailableProviders());
            
            toast.success('API keys saved successfully', {
                description: 'Your API keys have been securely stored.'
            });
            
            // Clear the input fields for security
            setOpenAIKey('');
            setAnthropicKey('');
            
        } catch (error) {
            log.error('Failed to save API keys:', error);
            toast.error('Failed to save API keys', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!hasKeys) {
            toast.error('Please save API keys first');
            return;
        }

        setIsLoading(true);
        try {
            // Test with a simple prompt
            await aiService.generateText(
                'You are a helpful assistant.',
                'Respond with just "Hello" to test the connection.',
                { provider: selectedProvider, model: selectedModel }
            );
            
            toast.success('Connection successful!', {
                description: `${selectedProvider} API is working correctly.`
            });
        } catch (error) {
            log.error('Connection test failed:', error);
            toast.error('Connection test failed', {
                description: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div onClick={() => setIsOpen(true)}>
                {children || (
                    <Button variant="ghost" size="sm">
                        <SettingsIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <KeyIcon className="h-5 w-5" />
                        AI Assistant Settings
                    </h2>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsOpen(false)}
                    >
                        ✕
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* API Keys Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium">API Keys</h3>
                        
                        <div className="bg-muted p-3 rounded-md">
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircleIcon className="h-4 w-4" />
                                <span>Your API keys are stored securely and only used to communicate with AI providers.</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="openai-key">OpenAI API Key</Label>
                                <Input
                                    id="openai-key"
                                    type="password"
                                    value={openAIKey}
                                    onChange={(e) => setOpenAIKey(e.target.value)}
                                    placeholder="sk-..."
                                />
                                <p className="text-sm text-muted-foreground">
                                    Get your API key from{' '}
                                    <a 
                                        href="https://platform.openai.com/api-keys" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-info hover:underline"
                                    >
                                        OpenAI Platform
                                    </a>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                                <Input
                                    id="anthropic-key"
                                    type="password"
                                    value={anthropicKey}
                                    onChange={(e) => setAnthropicKey(e.target.value)}
                                    placeholder="sk-ant-..."
                                />
                                <p className="text-sm text-muted-foreground">
                                    Get your API key from{' '}
                                    <a 
                                        href="https://console.anthropic.com/" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-info hover:underline"
                                    >
                                        Anthropic Console
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                onClick={handleSaveAPIKeys} 
                                disabled={isLoading || (!openAIKey && !anthropicKey)}
                                className="flex-1"
                            >
                                {isLoading ? 'Saving...' : 'Save API Keys'}
                            </Button>
                            
                            {hasKeys && (
                                <Button 
                                    variant="outline" 
                                    onClick={handleTestConnection}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Testing...' : 'Test Connection'}
                                </Button>
                            )}
                        </div>

                        {hasKeys && (
                            <div className="bg-success/10 border border-success/30 rounded-md p-3">
                                <div className="flex items-center gap-2 text-sm text-success">
                                    <CheckIcon className="h-4 w-4" />
                                    <span>API keys configured for: {availableProviders.join(', ')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Model Configuration</h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="provider">AI Provider</Label>
                                <Select value={selectedProvider} onValueChange={(value: LLMProvider) => setSelectedProvider(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="openai">OpenAI</SelectItem>
                                        <SelectItem value="anthropic">Anthropic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProvider === 'openai' 
                                            ? openAIModels.map(model => (
                                                <SelectItem key={model.value} value={model.value}>
                                                    {model.label}
                                                </SelectItem>
                                            ))
                                            : anthropicModels.map(model => (
                                                <SelectItem key={model.value} value={model.value}>
                                                    {model.label}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm">
                                    {selectedProvider === 'openai' 
                                        ? 'GPT-4o Mini offers the best balance of performance and cost for most use cases.'
                                        : 'Claude 3.5 Sonnet provides excellent coding and analysis capabilities.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

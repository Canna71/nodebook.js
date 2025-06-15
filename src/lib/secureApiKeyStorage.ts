import { safeStorage } from 'electron';
import appConfig from 'electron-settings';
import anylogger from 'anylogger';

const log = anylogger('SecureApiKeyStorage');

export interface APIKeys {
    openai?: string;
    anthropic?: string;
}

/**
 * Secure API Key Storage using electron-settings + safeStorage encryption
 * Falls back gracefully if encryption is not available
 */
export class SecureApiKeyStorage {
    private static readonly STORAGE_KEY = 'aiApiKeys';
    private static readonly ENCRYPTED_SUFFIX = '_encrypted';

    /**
     * Check if encryption is available on this platform
     */
    private static isEncryptionAvailable(): boolean {
        try {
            return safeStorage.isEncryptionAvailable();
        } catch (error) {
            log.warn('safeStorage not available:', error);
            return false;
        }
    }

    /**
     * Save API keys securely
     * Uses encryption if available, falls back to obfuscated storage
     */
    static async saveApiKeys(keys: APIKeys): Promise<void> {
        try {
            const keysToStore = { ...keys };
            
            if (this.isEncryptionAvailable()) {
                // Use Electron's safeStorage for encryption
                const encryptedKeys: Record<string, string> = {};
                
                if (keys.openai) {
                    const encrypted = safeStorage.encryptString(keys.openai);
                    encryptedKeys.openai = encrypted.toString('base64');
                }
                
                if (keys.anthropic) {
                    const encrypted = safeStorage.encryptString(keys.anthropic);
                    encryptedKeys.anthropic = encrypted.toString('base64');
                }
                
                await appConfig.set(`${this.STORAGE_KEY}${this.ENCRYPTED_SUFFIX}`, encryptedKeys);
                // Clear any non-encrypted keys
                await appConfig.unset(this.STORAGE_KEY);
                
                log.info('API keys saved with encryption');
            } else {
                // Fallback: Basic obfuscation (better than plain text)
                const obfuscatedKeys: Record<string, string> = {};
                
                if (keys.openai) {
                    obfuscatedKeys.openai = Buffer.from(keys.openai, 'utf8').toString('base64');
                }
                
                if (keys.anthropic) {
                    obfuscatedKeys.anthropic = Buffer.from(keys.anthropic, 'utf8').toString('base64');
                }
                
                await appConfig.set(this.STORAGE_KEY, obfuscatedKeys);
                // Clear any encrypted keys
                await appConfig.unset(`${this.STORAGE_KEY}${this.ENCRYPTED_SUFFIX}`);
                
                log.warn('API keys saved with basic obfuscation (encryption not available)');
            }
        } catch (error) {
            log.error('Failed to save API keys:', error);
            throw new Error('Failed to save API keys securely');
        }
    }

    /**
     * Load API keys securely
     * Handles both encrypted and obfuscated storage
     */
    static async loadApiKeys(): Promise<APIKeys | null> {
        try {
            // Try encrypted storage first
            if (await appConfig.has(`${this.STORAGE_KEY}${this.ENCRYPTED_SUFFIX}`)) {
                if (this.isEncryptionAvailable()) {
                    const encryptedKeys = await appConfig.get(`${this.STORAGE_KEY}${this.ENCRYPTED_SUFFIX}`) as Record<string, string>;
                    const decryptedKeys: APIKeys = {};
                    
                    if (encryptedKeys.openai) {
                        try {
                            const encrypted = Buffer.from(encryptedKeys.openai, 'base64');
                            decryptedKeys.openai = safeStorage.decryptString(encrypted);
                        } catch (error) {
                            log.error('Failed to decrypt OpenAI key:', error);
                        }
                    }
                    
                    if (encryptedKeys.anthropic) {
                        try {
                            const encrypted = Buffer.from(encryptedKeys.anthropic, 'base64');
                            decryptedKeys.anthropic = safeStorage.decryptString(encrypted);
                        } catch (error) {
                            log.error('Failed to decrypt Anthropic key:', error);
                        }
                    }
                    
                    log.info('API keys loaded with encryption');
                    return decryptedKeys;
                } else {
                    log.warn('Encrypted keys found but encryption not available');
                    return null;
                }
            }
            
            // Try obfuscated storage
            if (await appConfig.has(this.STORAGE_KEY)) {
                const obfuscatedKeys = await appConfig.get(this.STORAGE_KEY) as Record<string, string>;
                const deobfuscatedKeys: APIKeys = {};
                
                if (obfuscatedKeys.openai) {
                    try {
                        deobfuscatedKeys.openai = Buffer.from(obfuscatedKeys.openai, 'base64').toString('utf8');
                    } catch (error) {
                        log.error('Failed to deobfuscate OpenAI key:', error);
                    }
                }
                
                if (obfuscatedKeys.anthropic) {
                    try {
                        deobfuscatedKeys.anthropic = Buffer.from(obfuscatedKeys.anthropic, 'base64').toString('utf8');
                    } catch (error) {
                        log.error('Failed to deobfuscate Anthropic key:', error);
                    }
                }
                
                log.info('API keys loaded with obfuscation');
                return deobfuscatedKeys;
            }
            
            log.debug('No stored API keys found');
            return null;
        } catch (error) {
            log.error('Failed to load API keys:', error);
            return null;
        }
    }

    /**
     * Clear all stored API keys
     */
    static async clearApiKeys(): Promise<void> {
        try {
            await appConfig.unset(this.STORAGE_KEY);
            await appConfig.unset(`${this.STORAGE_KEY}${this.ENCRYPTED_SUFFIX}`);
            log.info('API keys cleared');
        } catch (error) {
            log.error('Failed to clear API keys:', error);
        }
    }

    /**
     * Get storage info for debugging
     */
    static async getStorageInfo(): Promise<{
        hasEncryptedKeys: boolean;
        hasObfuscatedKeys: boolean;
        encryptionAvailable: boolean;
    }> {
        return {
            hasEncryptedKeys: await appConfig.has(`${this.STORAGE_KEY}${this.ENCRYPTED_SUFFIX}`),
            hasObfuscatedKeys: await appConfig.has(this.STORAGE_KEY),
            encryptionAvailable: this.isEncryptionAvailable()
        };
    }
}

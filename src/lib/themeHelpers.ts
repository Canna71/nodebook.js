import * as React from 'react';
import { ThemeKeys } from 'react-json-view';

/**
 * Theme detection utilities for components that need to adapt to light/dark mode
 */

export type ThemeMode = 'light' | 'dark';

/**
 * Detect the current theme mode by checking the document element's classes
 * @returns 'dark' if dark mode is active, 'light' otherwise
 */
export function getCurrentTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Check if the current theme is dark mode
 * @returns true if dark mode is active
 */
export function isDarkMode(): boolean {
  return getCurrentTheme() === 'dark';
}

/**
 * Check if the current theme is light mode  
 * @returns true if light mode is active
 */
export function isLightMode(): boolean {
  return getCurrentTheme() === 'light';
}

/**
 * Get the appropriate react-json-view theme based on current mode
 * @returns theme string suitable for react-json-view
 */
export function getReactJsonTheme(): ThemeKeys {
  return isDarkMode() ? 'codeschool' : 'rjv-default';
}

/**
 * Get the appropriate CodeMirror theme based on current mode
 * @returns theme string suitable for CodeMirror
 */
export function getCodeMirrorTheme(): string {
  return isDarkMode() ? 'dark' : 'light';
}

/**
 * Create a theme-aware event listener that calls a callback when theme changes
 * @param callback Function to call when theme changes, receives new theme mode
 * @returns Cleanup function to remove the listener
 */
export function onThemeChange(callback: (theme: ThemeMode) => void): () => void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const newTheme = getCurrentTheme();
        callback(newTheme);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  return () => observer.disconnect();
}

/**
 * React hook for theme detection with automatic updates
 * @returns Current theme mode that updates when theme changes
 */
export function useTheme(): ThemeMode {
  const [theme, setTheme] = React.useState<ThemeMode>(getCurrentTheme);

  React.useEffect(() => {
    const cleanup = onThemeChange(setTheme);
    return cleanup;
  }, []);

  return theme;
}

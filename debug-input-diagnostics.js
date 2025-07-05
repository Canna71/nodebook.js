// Diagnostic patch for InputCell text input issue
// This will help identify what's different between dev and packaged mode

import React, { useState, useEffect, useRef } from 'react';

// Add this diagnostic component temporarily to InputCell.tsx
export function InputDiagnostics({ definition, value, setValue }: any) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    
    const info = {
      renderCount: renderCount.current,
      timestamp: new Date().toISOString(),
      isDev: process.env.NODE_ENV === 'development',
      isPackaged: process.env.ISDEV !== '1',
      definition: {
        id: definition.id,
        type: definition.inputType,
        variableName: definition.variableName,
        value: definition.value
      },
      reactiveValue: value,
      reactElement: {
        canEdit: true,
        hasOnChange: true,
        hasSetValue: typeof setValue === 'function'
      },
      environment: {
        hasWindow: typeof window !== 'undefined',
        hasDocument: typeof document !== 'undefined',
        hasReact: typeof React !== 'undefined',
        nodeIntegration: window.require !== undefined
      }
    };
    
    setDebugInfo(info);
    console.log('[InputCell Debug]', info);
  }, [definition, value, setValue]);

  const testInput = () => {
    const testValue = `test-${Date.now()}`;
    console.log('[InputCell Test] Setting value to:', testValue);
    setValue(testValue);
  };

  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'yellow',
        padding: '10px',
        fontSize: '10px',
        zIndex: 9999,
        maxWidth: '300px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        <button onClick={testInput}>Test Input</button>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    );
  }

  return null;
}

// Additional event debugging
export function addInputEventDebugging() {
  if (typeof window !== 'undefined') {
    // Override common input events for debugging
    const originalAddEventListener = HTMLInputElement.prototype.addEventListener;
    HTMLInputElement.prototype.addEventListener = function(type, listener, options) {
      if (['input', 'change', 'focus', 'blur'].includes(type)) {
        console.log(`[Input Event Debug] Adding ${type} listener to input:`, this);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Monitor all input events
    document.addEventListener('input', (e) => {
      if (e.target instanceof HTMLInputElement) {
        console.log('[Input Event Debug] Input event fired:', {
          target: e.target,
          value: e.target.value,
          type: e.target.type,
          id: e.target.id,
          className: e.target.className
        });
      }
    }, true);

    document.addEventListener('change', (e) => {
      if (e.target instanceof HTMLInputElement) {
        console.log('[Input Event Debug] Change event fired:', {
          target: e.target,
          value: e.target.value,
          type: e.target.type,
          id: e.target.id,
          className: e.target.className
        });
      }
    }, true);
  }
}

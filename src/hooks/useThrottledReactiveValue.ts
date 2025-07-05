import { useCallback, useRef, useEffect, useState } from 'react';
import { useReactiveValue } from '@/Engine/ReactiveProvider';
import anylogger from 'anylogger';

const log = anylogger('useThrottledReactiveValue');

/**
 * Hook for managing throttled reactive values - improves UI performance for rapid changes
 * like sliders while still maintaining reactive system integrity.
 * 
 * @param name - The reactive variable name
 * @param initialValue - Initial value if the reactive variable doesn't exist
 * @param throttleMs - Throttle delay in milliseconds (default: 100ms)
 * @returns [currentValue, throttledSetValue, immediateSetValue]
 */
export function useThrottledReactiveValue<T>(
    name: string, 
    initialValue?: T,
    throttleMs: number = 100
): [T | undefined, (value: T) => void, (value: T) => void] {
    const [reactiveValue, setReactiveValue] = useReactiveValue<T>(name, initialValue);
    const throttleRef = useRef<NodeJS.Timeout | null>(null);
    const pendingValueRef = useRef<T | undefined>(undefined);
    const lastCommittedRef = useRef<T | undefined>(reactiveValue);
    
    // Local state for immediate UI feedback during throttled updates
    const [localValue, setLocalValue] = useState<T | undefined>(reactiveValue);

    // Track the last committed value to avoid unnecessary updates
    useEffect(() => {
        lastCommittedRef.current = reactiveValue;
        // Update local value when reactive value changes (from external sources)
        if (pendingValueRef.current === undefined) {
            setLocalValue(reactiveValue);
        }
    }, [reactiveValue]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (throttleRef.current) {
                clearTimeout(throttleRef.current);
                throttleRef.current = null;
            }
        };
    }, []);

    // Throttled setter - batches rapid changes
    const throttledSetValue = useCallback((value: T) => {
        // Update local state immediately for UI feedback
        setLocalValue(value);
        
        // If throttle is 0, update immediately
        if (throttleMs === 0) {
            if (value !== lastCommittedRef.current) {
                log.debug(`Setting immediate value for ${name}:`, value);
                setReactiveValue(value);
                lastCommittedRef.current = value;
            }
            return;
        }

        // Store the latest value
        pendingValueRef.current = value;

        // Clear existing timeout
        if (throttleRef.current) {
            clearTimeout(throttleRef.current);
        }

        // Set new timeout
        throttleRef.current = setTimeout(() => {
            const valueToCommit = pendingValueRef.current;
            
            // Only update if we have a pending value and it's different from last committed
            if (valueToCommit !== undefined && valueToCommit !== lastCommittedRef.current) {
                log.debug(`Committing throttled value for ${name}:`, valueToCommit);
                setReactiveValue(valueToCommit);
                lastCommittedRef.current = valueToCommit;
            }
            
            throttleRef.current = null;
            pendingValueRef.current = undefined;
        }, throttleMs);
    }, [name, throttleMs, setReactiveValue]);

    // Immediate setter - bypasses throttling for final values
    const immediateSetValue = useCallback((value: T) => {
        // Update local state immediately
        setLocalValue(value);
        
        // Clear any pending throttled update
        if (throttleRef.current) {
            clearTimeout(throttleRef.current);
            throttleRef.current = null;
        }
        pendingValueRef.current = undefined;
        
        // Update immediately if different from last committed
        if (value !== lastCommittedRef.current) {
            log.debug(`Setting immediate value for ${name}:`, value);
            setReactiveValue(value);
            lastCommittedRef.current = value;
        }
    }, [name, setReactiveValue]);

    // Return the local value for immediate UI feedback, or reactive value for non-throttled
    const currentDisplayValue = throttleMs === 0 ? reactiveValue : localValue;

    return [currentDisplayValue, throttledSetValue, immediateSetValue];
}

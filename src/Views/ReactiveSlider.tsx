import React, { useState, useEffect, useContext } from "react";
import { ReactiveStore } from "@/Engine/ReactiveSystem";

/**
 * Props for reactive UI components
 */
interface ReactiveComponentProps {
  name: string;
  label?: string;
  initialValue?: any;
  min?: number;
  max?: number;
  step?: number;
  [key: string]: any;
}

// Create context for ReactiveStore
const ReactiveStoreContext = React.createContext<ReactiveStore | null>(null);

/**
 * React component for a reactive slider
 */
const ReactiveSlider: React.FC<ReactiveComponentProps> = (props) => {
  const { name, label, initialValue = 0, min = 0, max = 100, step = 1 } = props;
  const reactiveStore = useContext(ReactiveStoreContext);
  const [value, setValue] = useState<number>(initialValue);

  useEffect(() => {
    if (!reactiveStore) return;

    // Define reactive value in store
    reactiveStore.define(name, value);
    
    // Subscribe to changes
    const unsubscribe = reactiveStore.subscribe(name, (newValue: number) => {
      if (newValue !== value) {
        setValue(newValue);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [reactiveStore, name, value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setValue(newValue);
    
    // Update reactive store
    if (reactiveStore) {
      const reactiveValue = reactiveStore.get<number>(name);
      if (reactiveValue) {
        reactiveValue.setValue(newValue);
      }
    }
  };

  return (
    <div className="reactive-slider">
      <label>{label || name}: {value}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default ReactiveSlider;

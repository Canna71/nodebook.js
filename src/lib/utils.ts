import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// utiliti function to memoize a function
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache: Record<string, ReturnType<T>> = {};
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache[key] === undefined) {
      cache[key] = fn(...args);
    }
    return cache[key];
  }) as T;
}
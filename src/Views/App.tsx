import React from 'react'
import { PricingCalculator } from './PricingCalculator';
import { ReactiveProvider } from '../Engine/ReactiveProvider';

export default function App() {


    const  handleClick = async () => {
        console.log('Button clicked!');
        const todos = await fetch('https://jsonplaceholder.typicode.com/todos/1');
        console.log('Todos:', await todos.json());
    }

    return (
        <div>
            <h2>Hello from React!</h2>
            <p>Welcome to your Electron + Vite + React app!</p>

            <button 
                onClick={handleClick}
                
            >Click Me</button>
            <ReactiveProvider>
                <PricingCalculator />
            </ReactiveProvider>
        </div>
    )
}

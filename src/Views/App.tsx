import React from 'react'

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
        </div>
    )
}

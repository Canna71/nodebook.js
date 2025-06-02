/**
 * DOM Helper functions for code cells
 * Simplifies creating and manipulating DOM elements
 */

let elementCounter = 0;

/**
 * Generate a unique ID for elements
 */
function generateId(prefix: string = 'elem'): string {
    return `${prefix}-${Date.now()}-${++elementCounter}`;
}

/**
 * Create a DOM element with optional styling and content
 */
export function createElement(
    tag: string,
    options: {
        id?: string;
        className?: string;
        style?: string | Record<string, string>;
        textContent?: string;
        innerHTML?: string;
        attributes?: Record<string, string>;
    } = {}
): HTMLElement {
    const element = document.createElement(tag);
    
    // Set ID (auto-generate if not provided)
    element.id = options.id || generateId(tag);
    
    // Set class
    if (options.className) {
        element.className = options.className;
    }
    
    // Set style
    if (options.style) {
        if (typeof options.style === 'string') {
            element.style.cssText = options.style;
        } else {
            Object.assign(element.style, options.style);
        }
    }
    
    // Set content
    if (options.textContent) {
        element.textContent = options.textContent;
    } else if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }
    
    // Set attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    return element;
}

/**
 * Create a div with common styling
 */
export function createDiv(options: Parameters<typeof createElement>[1] = {}): HTMLDivElement {
    return createElement('div', options) as HTMLDivElement;
}

/**
 * Create a container with padding and border
 */
export function createContainer(options: Parameters<typeof createElement>[1] = {}): HTMLDivElement {
    const defaultStyle = 'margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: white;';
    return createDiv({
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    });
}

/**
 * Create a title element
 */
export function createTitle(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 3, options: Parameters<typeof createElement>[1] = {}): HTMLHeadingElement {
    const defaultStyle = 'margin: 0 0 15px 0; color: #333;';
    return createElement(`h${level}`, {
        textContent: text,
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    }) as HTMLHeadingElement;
}

/**
 * Create a table with headers
 */
export function createTable(
    headers: string[],
    rows: (string | number)[][],
    options: Parameters<typeof createElement>[1] = {}
): HTMLTableElement {
    const defaultStyle = 'width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;';
    const table = createElement('table', {
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    }) as HTMLTableElement;
    
    // Create header
    if (headers.length > 0) {
        const thead = createElement('thead');
        const headerRow = createElement('tr');
        
        headers.forEach(headerText => {
            const th = createElement('th', {
                textContent: headerText,
                style: 'padding: 10px; border: 1px solid #ddd; background: #f5f5f5; text-align: left; font-weight: bold;'
            });
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
    }
    
    // Create body
    if (rows.length > 0) {
        const tbody = createElement('tbody');
        
        rows.forEach(rowData => {
            const tr = createElement('tr', {
                style: 'cursor: pointer; transition: background-color 0.2s;'
            });
            
            // Add hover effects
            tr.addEventListener('mouseover', () => {
                tr.style.backgroundColor = '#f0f0f0';
            });
            tr.addEventListener('mouseout', () => {
                tr.style.backgroundColor = 'white';
            });
            
            rowData.forEach((cellData, i) => {
                const isNumeric = typeof cellData === 'number';
                const td = createElement('td', {
                    textContent: isNumeric ? cellData.toLocaleString() : String(cellData),
                    style: `padding: 8px 10px; border: 1px solid #ddd; text-align: ${isNumeric ? 'right' : 'left'};`
                });
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
    }
    
    return table;
}

/**
 * Create a button with styling
 */
export function createButton(
    text: string,
    onClick?: () => void,
    options: Parameters<typeof createElement>[1] = {}
): HTMLButtonElement {
    const defaultStyle = 'background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;';
    const button = createElement('button', {
        textContent: text,
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    }) as HTMLButtonElement;
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    // Add hover effect
    button.addEventListener('mouseover', () => {
        button.style.opacity = '0.8';
    });
    button.addEventListener('mouseout', () => {
        button.style.opacity = '1';
    });
    
    return button;
}

/**
 * Create a statistics grid
 */
export function createStatsGrid(
    stats: Record<string, string | number>,
    options: Parameters<typeof createElement>[1] = {}
): HTMLDivElement {
    const defaultStyle = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;';
    const grid = createDiv({
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    });
    
    Object.entries(stats).forEach(([key, value]) => {
        const statBox = createDiv({
            style: 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; text-align: center;'
        });
        
        const label = createDiv({
            textContent: key,
            style: 'font-size: 11px; opacity: 0.8; margin-bottom: 5px;'
        });
        
        const valueEl = createDiv({
            textContent: String(value),
            style: 'font-size: 16px; font-weight: bold;'
        });
        
        statBox.appendChild(label);
        statBox.appendChild(valueEl);
        grid.appendChild(statBox);
    });
    
    return grid;
}

/**
 * Create a gradient background container
 */
export function createGradientContainer(
    title: string,
    options: Parameters<typeof createElement>[1] = {}
): HTMLDivElement {
    const defaultStyle = 'margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;';
    const container = createDiv({
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    });
    
    const titleEl = createTitle(title, 3, {
        style: 'margin: 0 0 15px 0; color: white;'
    });
    
    container.appendChild(titleEl);
    return container;
}

/**
 * Chain helper for fluent API
 */
export class ElementBuilder {
    private element: HTMLElement;
    
    constructor(element: HTMLElement) {
        this.element = element;
    }
    
    append(...children: (HTMLElement | string)[]): ElementBuilder {
        children.forEach(child => {
            if (typeof child === 'string') {
                this.element.appendChild(document.createTextNode(child));
            } else {
                this.element.appendChild(child);
            }
        });
        return this;
    }
    
    style(styles: Record<string, string>): ElementBuilder {
        Object.assign(this.element.style, styles);
        return this;
    }
    
    on(event: string, handler: EventListener): ElementBuilder {
        this.element.addEventListener(event, handler);
        return this;
    }
    
    build(): HTMLElement {
        return this.element;
    }
}

/**
 * Start building an element with fluent API
 */
export function build(element: HTMLElement): ElementBuilder {
    return new ElementBuilder(element);
}

// Global helpers that can be injected into code cell scope
export const domHelpers = {
    createElement,
    createDiv,
    createContainer,
    createTitle,
    createTable,
    createButton,
    createStatsGrid,
    createGradientContainer,
    build,
    generateId
};

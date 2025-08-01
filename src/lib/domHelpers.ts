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
 * Create a container with padding and border that auto-outputs itself
 */
export function createContainer(options: Parameters<typeof createElement>[1] = {}): HTMLDivElement {
    const defaultStyle = 'margin: 20px 0; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);';
    const container = createDiv({
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    });
    
    // Auto-output the container to ensure it's in the DOM
    // This will be overridden by the bound version in code cells
    if (typeof window !== 'undefined' && typeof (globalThis as any).output === 'function') {
        (globalThis as any).output(container);
    }
    
    return container;
}

/**
 * Create a title element
 */
export function createTitle(text: string, level: 1 | 2 | 3 | 4 | 5 | 6 = 3, options: Parameters<typeof createElement>[1] = {}): HTMLHeadingElement {
    const defaultStyle = 'margin: 0 0 15px 0; color: var(--color-primary); font-weight: 600;';
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
    const defaultStyle = 'width: 100%; border-collapse: collapse; font-family: inherit;';
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
                style: 'padding: 10px; border: 1px solid var(--color-border); background: var(--color-background-secondary); text-align: left; font-weight: bold; color: var(--color-primary);'
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
            
            // Add hover effects using CSS custom properties
            tr.addEventListener('mouseover', () => {
                tr.style.backgroundColor = 'var(--color-background-hover)';
            });
            tr.addEventListener('mouseout', () => {
                tr.style.backgroundColor = 'var(--color-background)';
            });
            
            rowData.forEach((cellData, i) => {
                const isNumeric = typeof cellData === 'number';
                const td = createElement('td', {
                    textContent: isNumeric ? cellData.toLocaleString() : String(cellData),
                    style: `padding: 8px 10px; border: 1px solid var(--color-border); text-align: ${isNumeric ? 'right' : 'left'}; color: var(--color-primary);`
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
    const defaultStyle = 'background: var(--color-primary); color: var(--color-background); border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s ease;';
    const button = createElement('button', {
        textContent: text,
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    }) as HTMLButtonElement;
    
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    
    // Enhanced hover effect
    button.addEventListener('mouseover', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        button.style.opacity = '0.9';
    });
    button.addEventListener('mouseout', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
        button.style.opacity = '1';
    });
    
    return button;
}

/**
 * Create a responsive key-value grid (useful for metrics, stats, properties, etc.)
 */
export function createKeyValueGrid(
    data: Record<string, string | number>,
    options: Parameters<typeof createElement>[1] & {
        columns?: string; // CSS grid-template-columns value
        itemStyle?: string; // Style for each grid item
    } = {}
): HTMLDivElement {
    const { columns = 'repeat(auto-fit, minmax(160px, 1fr))', itemStyle = '', ...containerOptions } = options;
    
    const defaultStyle = `display: grid; grid-template-columns: ${columns}; gap: 12px; margin: 10px 0;`;
    const grid = createDiv({
        ...containerOptions,
        style: containerOptions.style ? `${defaultStyle} ${containerOptions.style}` : defaultStyle
    });
    
    Object.entries(data).forEach(([key, value]) => {
        const defaultItemStyle = 'background: var(--color-card); padding: 16px; border-radius: 8px; text-align: center; border: 1px solid var(--color-border); transition: all 0.2s ease;';
        const item = createDiv({
            style: itemStyle ? `${defaultItemStyle} ${itemStyle}` : defaultItemStyle
        });
        
        // Add hover effect to grid items
        item.addEventListener('mouseover', () => {
            item.style.transform = 'translateY(-2px)';
            item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        });
        item.addEventListener('mouseout', () => {
            item.style.transform = 'translateY(0)';
            item.style.boxShadow = 'none';
        });
        
        const label = createDiv({
            textContent: key,
            style: 'font-size: 12px; color: var(--color-primary); margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;'
        });
        
        const valueEl = createDiv({
            textContent: String(value),
            style: 'font-size: 18px; font-weight: 700; color: var(--color-primary); line-height: 1.2;'
        });
        
        item.appendChild(label);
        item.appendChild(valueEl);
        grid.appendChild(item);
    });
    
    return grid;
}

/**
 * Create a container specifically for outEl usage (doesn't auto-output)
 */
export function createOutElContainer(options: Parameters<typeof createElement>[1] = {}): HTMLDivElement {
    const defaultStyle = 'margin: 20px 0; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);';
    return createDiv({
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    });
}

/**
 * Create a gradient container for outEl usage (doesn't auto-output)
 */
export function createOutElGradientContainer(
    title: string,
    options: Parameters<typeof createElement>[1] = {}
): HTMLDivElement {
    const defaultStyle = 'margin: 20px 0; padding: 20px; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);';
    const container = createDiv({
        ...options,
        style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
    });
    
    const titleEl = createTitle(title, 3, {
        style: 'margin: 0 0 16px 0; color: var(--color-primary); font-size: 20px;'
    });
    
    container.appendChild(titleEl);
    return container;
}

/**
 * Create a list (ul or ol) with items
 */
export function createList(
    items: (string | HTMLElement)[],
    options: Parameters<typeof createElement>[1] & {
        ordered?: boolean; // true for <ol>, false for <ul>
        itemStyle?: string; // Style for each list item
    } = {}
): HTMLUListElement | HTMLOListElement {
    const { ordered = false, itemStyle = '', ...containerOptions } = options;
    
    const defaultStyle = 'margin: 12px 0; padding-left: 24px; line-height: 1.6;';
    const listTag = ordered ? 'ol' : 'ul';
    const list = createElement(listTag, {
        ...containerOptions,
        style: containerOptions.style ? `${defaultStyle} ${containerOptions.style}` : defaultStyle
    }) as HTMLUListElement | HTMLOListElement;
    
    items.forEach(item => {
        const defaultItemStyle = 'margin: 8px 0; color: var(--color-primary); font-size: 14px;';
        const li = createElement('li', {
            style: itemStyle ? `${defaultItemStyle} ${itemStyle}` : defaultItemStyle
        });
        
        if (typeof item === 'string') {
            li.textContent = item;
        } else {
            li.appendChild(item);
        }
        
        list.appendChild(li);
    });
    
    return list;
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

/**
 * Create DOM helpers with bound output function
 */
export function createBoundDomHelpers(outputFn: (value: any) => any) {
    // Create bound versions of auto-outputting functions
    const boundCreateContainer = (options: Parameters<typeof createElement>[1] = {}) => {
        const defaultStyle = 'margin: 20px 0; padding: 15px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background);';
        const container = createDiv({
            ...options,
            style: options.style ? `${defaultStyle} ${options.style}` : defaultStyle
        });
        
        // Auto-output the container
        outputFn(container);
        return container;
    };

    return {
        createElement,
        createDiv,
        createContainer: boundCreateContainer,
        createTitle,
        createTable,
        createButton,
        createList,
        createKeyValueGrid,
        createOutElContainer,
        createOutElGradientContainer,
        build,
        generateId
    };
}

// Global helpers that can be injected into code cell scope
// NOTE: This export is NOT actually used in code cells. The actual injection happens
// via spreading the individual exported functions (...domHelpers) in ReactiveSystem.ts
// which includes the original auto-outputting createContainer, not createOutElContainer
export const domHelpers = {
    createElement,
    createDiv,
    createContainer: createOutElContainer, // This mapping is NOT used in code cells
    createTitle,
    createTable,
    createButton,
    createList,
    createKeyValueGrid, // Renamed from createStatsGrid
    createOutElContainer,
    createOutElGradientContainer,
    build,
    generateId
};

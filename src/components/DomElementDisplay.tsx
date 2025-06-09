import React from 'react';

interface DomElementDisplayProps {
  element: HTMLElement | SVGElement;
  name?: string | false;
}

export function DomElementDisplay({ element, name }: DomElementDisplayProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current && element) {
      // Clear any existing content
      containerRef.current.innerHTML = '';
      
      // Clone the element to avoid moving it from its original location
      const clonedElement = element.cloneNode(true) as HTMLElement | SVGElement;
      
      // Ensure the element has proper styling for display
      if (clonedElement instanceof SVGElement) {
        // For SVG elements, ensure they have proper dimensions
        if (!clonedElement.hasAttribute('width') || !clonedElement.hasAttribute('height')) {
          clonedElement.setAttribute('width', '100%');
          clonedElement.setAttribute('height', 'auto');
        }
        // clonedElement.style.maxWidth = '100%';
        // clonedElement.style.height = 'auto';
      }
      
      containerRef.current.appendChild(clonedElement);
    }
  }, [element]);

  const getElementInfo = () => {
    if (!element) return 'Unknown DOM element';
    
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const id = element.id || '';
    
    let info = `<${tagName}`;
    if (id) info += ` id="${id}"`;
    if (className) info += ` class="${className}"`;
    info += '>';
    
    return info;
  };

  return (
    <div className="dom-element-display">
      {name !== false && (
        <div className="text-xs text-muted-foreground mb-2 font-mono">
          {name ? `${name}: ` : ''}{getElementInfo()}
        </div>
      )}
      <div 
        ref={containerRef}
        className="dom-element-container border border-border rounded p-2 bg-background"
        style={{ minHeight: '50px' }}
      />
    </div>
  );
}

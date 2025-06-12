import React, { useEffect, useRef } from 'react';
import anylogger from 'anylogger';

const log = anylogger('LatexRenderer');

interface LatexRendererProps {
    content: string;
    inline?: boolean;
}

// Import mathjax-electron
const { typesetMath } = require("mathjax-electron");

/**
 * Detect if content contains LaTeX syntax
 */
export function isLatexContent(content: string): boolean {
    if (typeof content !== 'string') return false;
    
    // Check for display math ($$...$$)
    const displayMathRegex = /\$\$.*?\$\$/s;
    // Check for inline math ($...$) - but be more restrictive to avoid false positives
    const inlineMathRegex = /\$[^$\n]+\$/;
    
    return displayMathRegex.test(content) || inlineMathRegex.test(content);
}

/**
 * Component to render LaTeX content using mathjax-electron
 */
export function LatexRenderer({ content, inline = false }: LatexRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !content) return;

        const container = containerRef.current;
        
        try {
            // Set the content
            container.innerHTML = content;
            
            // Apply MathJax typesetting
            typesetMath(container);
            
            log.debug('LaTeX content rendered successfully:', content);
        } catch (error) {
            log.error('Error rendering LaTeX content:', error);
            // Fallback to plain text display
            container.textContent = content;
        }
    }, [content]);

    return (
        <div 
            ref={containerRef}
            className={`latex-renderer ${inline ? 'inline' : 'block'}`}
            style={{
                display: inline ? 'inline' : 'block',
                margin: inline ? '0' : '10px 0',
                textAlign: inline ? 'inherit' : 'center',
                fontSize: '16px',
                lineHeight: '1.5'
            }}
        />
    );
}

/**
 * Process mixed content that may contain both LaTeX and regular text
 */
export function renderMixedContent(content: string): React.ReactNode {
    if (!isLatexContent(content)) {
        return content;
    }

    // Split content by LaTeX blocks while preserving the delimiters
    const parts: Array<{ type: 'text' | 'latex', content: string, inline: boolean }> = [];
    let remaining = content;
    let index = 0;

    // First, handle display math ($$...$$)
    const displayMathRegex = /(\$\$.*?\$\$)/gs;
    const displayMatches = [...remaining.matchAll(displayMathRegex)];
    
    let lastIndex = 0;
    displayMatches.forEach(match => {
        const matchStart = match.index!;
        
        // Add text before the match
        if (matchStart > lastIndex) {
            const textBefore = remaining.slice(lastIndex, matchStart);
            if (textBefore.trim()) {
                parts.push({ type: 'text', content: textBefore, inline: false });
            }
        }
        
        // Add the LaTeX match
        parts.push({ type: 'latex', content: match[1], inline: false });
        lastIndex = matchStart + match[1].length;
    });
    
    // Add remaining text
    if (lastIndex < remaining.length) {
        const remainingText = remaining.slice(lastIndex);
        if (remainingText.trim()) {
            // Now process inline math in the remaining text
            const inlineProcessed = processInlineMath(remainingText);
            parts.push(...inlineProcessed);
        }
    }

    // If no display math was found, process the entire content for inline math
    if (parts.length === 0) {
        const inlineProcessed = processInlineMath(content);
        parts.push(...inlineProcessed);
    }

    // Render the parts
    return (
        <span className="mixed-content">
            {parts.map((part, index) => (
                part.type === 'latex' ? (
                    <LatexRenderer 
                        key={index} 
                        content={part.content} 
                        inline={part.inline}
                    />
                ) : (
                    <span key={index}>{part.content}</span>
                )
            ))}
        </span>
    );
}

/**
 * Helper function to process inline math in text
 */
function processInlineMath(text: string): Array<{ type: 'text' | 'latex', content: string, inline: boolean }> {
    const parts: Array<{ type: 'text' | 'latex', content: string, inline: boolean }> = [];
    const inlineMathRegex = /(\$[^$\n]+\$)/g;
    
    let lastIndex = 0;
    const matches = [...text.matchAll(inlineMathRegex)];
    
    matches.forEach(match => {
        const matchStart = match.index!;
        
        // Add text before the match
        if (matchStart > lastIndex) {
            const textBefore = text.slice(lastIndex, matchStart);
            if (textBefore) {
                parts.push({ type: 'text', content: textBefore, inline: false });
            }
        }
        
        // Add the inline LaTeX match
        parts.push({ type: 'latex', content: match[1], inline: true });
        lastIndex = matchStart + match[1].length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        if (remainingText) {
            parts.push({ type: 'text', content: remainingText, inline: false });
        }
    }
    
    // If no inline math found, return original text
    if (parts.length === 0) {
        parts.push({ type: 'text', content: text, inline: false });
    }
    
    return parts;
}

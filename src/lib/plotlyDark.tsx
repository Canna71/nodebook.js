import * as Plotly from 'plotly.js-dist-min';

import { useEffect, useRef, useCallback, createContext, useState, useContext } from 'react';

/**
 * Custom hook to observe DOM mutations and apply styling to specific elements
 * @param {Object} options - Configuration options
 * @param {string} options.targetSelector - CSS selector for elements to watch for
 * @param {function} options.onElementsDetected - Callback function when elements are detected
 * @param {boolean} options.enabled - Whether the observer is enabled
 * @param {Object} options.observerOptions - MutationObserver options
 * @returns {Object} - Methods to control the observer
 */
const useMutationObserver = ({
    targetSelector = '.plotly',
    onElementsDetected = (elements: NodeListOf<Element>) => { },
    enabled = true,
    observerOptions = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    }
}) => {
    const observerRef = useRef(null);

    // Function to check if mutation contains or affects target elements
    const checkForTargetElements = useCallback((mutations: MutationRecord[]) => {
        let targetElementsFound = false;

        // Check if any mutation involves our target elements
        mutations.forEach(mutation => {
            // check if element is an element and matches our selector
            if (mutation.target && mutation.target.nodeType === Node.ELEMENT_NODE) {
                const element = mutation.target as Element;

                // Check if the mutation target itself matches our selector
                if (element.matches && element.matches(targetSelector)) {
                    targetElementsFound = true;
                }

                // Check if the target contains any matching elements
                if (!targetElementsFound && element.querySelectorAll &&
                    element.querySelectorAll(targetSelector).length > 0) {
                    targetElementsFound = true;
                }

                // Check added nodes
                if (!targetElementsFound && mutation.addedNodes.length) {
                    Array.from(mutation.addedNodes).forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) { // Element node
                            const element = node as Element;

                            if (element.matches && element.matches(targetSelector)) {
                                targetElementsFound = true;
                            } else if (element.querySelectorAll &&
                                element.querySelectorAll(targetSelector).length > 0) {
                                targetElementsFound = true;
                            }
                        }
                    });
                }
            }
        });

        return targetElementsFound;
    }, [targetSelector]);

    // Function to manually apply styling
    const applyStylesManually = useCallback(() => {
        const elements = document.querySelectorAll(targetSelector);
        if (elements.length > 0) {
            onElementsDetected(elements);
            return true;
        }
        return false;
    }, [targetSelector, onElementsDetected]);

    // Setup and teardown of the observer
    useEffect(() => {
        if (!enabled) return;

        // Create observer instance
        observerRef.current = new MutationObserver((mutations) => {
            if (checkForTargetElements(mutations)) {
                // Get all matching elements and pass to callback
                applyStylesManually();
            }
        });

        // Start observing
        observerRef.current.observe(document.body, observerOptions);

        // Initial check for elements that might already be in the DOM
        applyStylesManually();

        // Cleanup
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [enabled, observerOptions, checkForTargetElements, applyStylesManually]);

    // Return methods to control the observer
    return {
        applyStylesManually,
        disconnect: () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        },
        reconnect: () => {
            if (observerRef.current) {
                observerRef.current.observe(document.body, observerOptions);
            }
        }
    };
};

export default useMutationObserver;

function applyDarkModeToPlotly(el: HTMLElement) {
    // Check if dark mode is enabled by looking for 'dark' class on html element
    const isDarkMode = document.documentElement.classList.contains('dark');
    // return Promise.resolve();
    if (!isDarkMode) {
        // If not in dark mode, don't apply dark theme
        return Promise.resolve();
    }
    
    // Check if element is already being styled to prevent loops
    if (el.hasAttribute('data-plotly-dark-applied')) {
        return Promise.resolve();
    }
    
    // Mark element as being styled
    el.setAttribute('data-plotly-dark-applied', 'true');
    
    return Plotly.relayout(el, {
          "template.layout": {
            annotationdefaults: {
              arrowcolor: "#d8dfe4",
              arrowhead: 0,
              arrowwidth: 1,
            },
            autotypenumbers: "strict",
            coloraxis: {
              colorbar: {
                outlinewidth: 0,
                ticks: ""
              }
            },
            colorscale: {
              diverging: [
                  [0, "#8e0152"],
                  [0.1, "#c51b7d"],
                  [0.2, "#de77ae"],
                  [0.3, "#f1b6da"],
                  [0.4, "#fde0ef"],
                  [0.5, "#f7f7f7"],
                  [0.6, "#e6f5d0"],
                  [0.7, "#b8e186"],
                  [0.8, "#7fbc41"],
                  [0.9, "#4d9221"],
                  [1, "#276419"],
                ],
              sequential: [
                  [0.0, "#0d0887"],
                  [0.1111111111111111, "#46039f"],
                  [0.2222222222222222, "#7201a8"],
                  [0.3333333333333333, "#9c179e"],
                  [0.4444444444444444, "#bd3786"],
                  [0.5555555555555556, "#d8576b"],
                  [0.6666666666666666, "#ed7953"],
                  [0.7777777777777778, "#fb9f3a"],
                  [0.8888888888888888, "#fdca26"],
                  [1.0, "#f0f921"],
                ],
              sequentialminus: [
                  [0.0, "#0d0887"],
                  [0.1111111111111111, "#46039f"],
                  [0.2222222222222222, "#7201a8"],
                  [0.3333333333333333, "#9c179e"],
                  [0.4444444444444444, "#bd3786"],
                  [0.5555555555555556, "#d8576b"],
                  [0.6666666666666666, "#ed7953"],
                  [0.7777777777777778, "#fb9f3a"],
                  [0.8888888888888888, "#fdca26"],
                  [1.0, "#f0f921"],
                ],
            },
            font: {
              color: "#d8dfe4"
            },
            geo: {
              bgcolor: "#1e212b",
              lakecolor: "#161a1d",
              landcolor: "#161a1d",
              showlakes: true,
              showland: true,
              subunitcolor: "#506784",
            },
            hoverlabel: {
              align: "left"
            },
            hovermode: "closest",
            mapbox: {
              style: "dark"
            },
            paper_bgcolor: "#1e212b",
            plot_bgcolor: "#1e212b",
            polar: {
              angularaxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
              bgcolor: "#1e212b",
              radialaxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
            },
            scene: {
              xaxis: {
                backgroundcolor: "#1e212b",
                gridcolor: "#506784",
                gridwidth: 2,
                linecolor: "#506784",
                showbackground: true,
                ticks: "",
                zerolinecolor: "#C8D4E3",
              },
              yaxis: {
                backgroundcolor: "#1e212b",
                gridcolor: "#506784",
                gridwidth: 2,
                linecolor: "#506784",
                showbackground: true,
                ticks: "",
                zerolinecolor: "#C8D4E3",
              },
              zaxis: {
                backgroundcolor: "#1e212b",
                gridcolor: "#506784",
                gridwidth: 2,
                linecolor: "#506784",
                showbackground: true,
                ticks: "",
                zerolinecolor: "#C8D4E3",
              },
            },
            shapedefaults: {
              line: {
                color: "#d8dfe4"
              }
            },
            sliderdefaults: {
              bgcolor: "#C8D4E3",
              bordercolor: "#1e212b",
              borderwidth: 1,
              tickwidth: 0,
            },
            ternary: {
              aaxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
              baxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
              bgcolor: "#1e212b",
              caxis: {
                gridcolor: "#506784",
                linecolor: "#506784",
                ticks: "",
              },
            },
            title: {
              x: 0.05
            },
            updatemenudefaults: {
              bgcolor: "#506784",
              borderwidth: 0
            },
            xaxis: {
              automargin: true,
              gridcolor: "#283442",
              linecolor: "#506784",
              ticks: "",
              title: {
                standoff: 15
              },
              zerolinecolor: "#283442",
              zerolinewidth: 2,
            },
            yaxis: {
              automargin: true,
              gridcolor: "#283442",
              linecolor: "#506784",
              ticks: "",
              title: {
                standoff: 15
              },
              zerolinecolor: "#283442",
              zerolinewidth: 2,
            },
          },
        });

    return Plotly.restyle(el as HTMLElement, 
        {
            // Font styling for dark mode
            font: {
                color: "#ffffff"  // or use CSS custom property: getComputedStyle(document.documentElement).getPropertyValue('--color-foreground')
            },
            // Paper and plot background
            paper_bgcolor: "var(--color-secondary-foreground)",
            plot_bgcolor: "var(--color-secondary)",
            layout: {
                paper_bgcolor: "var(--color-secondary-foreground)",
                plot_bgcolor: "var(--color-secondary)",
            }
            // annotationdefaults: {
            //     arrowcolor: "#d8dfe4",
            //     arrowhead: 0,
            //     arrowwidth: 1,
            // },
            // autotypenumbers: "strict",
            // coloraxis: {
            //     colorbar: {
            //         outlinewidth: 0,
            //         ticks: ""
            //     }
            // },
            // colorscale: {
            //     diverging: [
            //         [0, "#8e0152"],
            //         [0.1, "#c51b7d"],
            //         [0.2, "#de77ae"],
            //         [0.3, "#f1b6da"],
            //         [0.4, "#fde0ef"],
            //         [0.5, "#f7f7f7"],
            //         [0.6, "#e6f5d0"],
            //         [0.7, "#b8e186"],
            //         [0.8, "#7fbc41"],
            //         [0.9, "#4d9221"],
            //         [1, "#276419"],
            //     ],
            //     sequential: [
            //         [0.0, "#0d0887"],
            //         [0.1111111111111111, "#46039f"],
            //         [0.2222222222222222, "#7201a8"],
            //         [0.3333333333333333, "#9c179e"],
            //         [0.4444444444444444, "#bd3786"],
            //         [0.5555555555555556, "#d8576b"],
            //         [0.6666666666666666, "#ed7953"],
            //         [0.7777777777777778, "#fb9f3a"],
            //         [0.8888888888888888, "#fdca26"],
            //         [1.0, "#f0f921"],
            //     ],
            //     sequentialminus: [
            //         [0.0, "#0d0887"],
            //         [0.1111111111111111, "#46039f"],
            //         [0.2222222222222222, "#7201a8"],
            //         [0.3333333333333333, "#9c179e"],
            //         [0.4444444444444444, "#bd3786"],
            //         [0.5555555555555556, "#d8576b"],
            //         [0.6666666666666666, "#ed7953"],
            //         [0.7777777777777778, "#fb9f3a"],
            //         [0.8888888888888888, "#fdca26"],
            //         [1.0, "#f0f921"],
            //     ],
            // },
            // font: {
            //     color: "#d8dfe4"
            // },
            // geo: {
            //     bgcolor: "#1e212b",
            //     lakecolor: "#1e212b",
            //     landcolor: "#1e212b",
            //     showlakes: true,
            //     showland: true,
            //     subunitcolor: "#506784",
            // },
            // hoverlabel: {
            //     align: "left"
            // },
            // hovermode: "closest",
            // mapbox: {
            //     style: "dark"
            // },
            // paper_bgcolor: "#1e212b",
            // plot_bgcolor: "#1e212b",
            // polar: {
            //     angularaxis: {
            //         gridcolor: "#506784",
            //         linecolor: "#506784",
            //         ticks: "",
            //     },
            //     bgcolor: "#1e212b",
            //     radialaxis: {
            //         gridcolor: "#506784",
            //         linecolor: "#506784",
            //         ticks: "",
            //     },
            // },
            // scene: {
            //     xaxis: {
            //         backgroundcolor: "#1e212b",
            //         gridcolor: "#506784",
            //         gridwidth: 2,
            //         linecolor: "#506784",
            //         showbackground: true,
            //         ticks: "",
            //         zerolinecolor: "#C8D4E3",
            //     },
            //     yaxis: {
            //         backgroundcolor: "#1e212b",
            //         gridcolor: "#506784",
            //         gridwidth: 2,
            //         linecolor: "#506784",
            //         showbackground: true,
            //         ticks: "",
            //         zerolinecolor: "#C8D4E3",
            //     },
            //     zaxis: {
            //         backgroundcolor: "#1e212b",
            //         gridcolor: "#506784",
            //         gridwidth: 2,
            //         linecolor: "#506784",
            //         showbackground: true,
            //         ticks: "",
            //         zerolinecolor: "#C8D4E3",
            //     },
            // },
            // shapedefaults: {
            //     line: {
            //         color: "#d8dfe4"
            //     }
            // },
            // sliderdefaults: {
            //     bgcolor: "#C8D4E3",
            //     bordercolor: "#1e212b",
            //     borderwidth: 1,
            //     tickwidth: 0,
            // },
            // ternary: {
            //     aaxis: {
            //         gridcolor: "#506784",
            //         linecolor: "#506784",
            //         ticks: "",
            //     },
            //     baxis: {
            //         gridcolor: "#506784",
            //         linecolor: "#506784",
            //         ticks: "",
            //     },
            //     bgcolor: "#1e212b",
            //     caxis: {
            //         gridcolor: "#506784",
            //         linecolor: "#506784",
            //         ticks: "",
            //     },
            // },
            // title: {
            //     x: 0.05
            // },
            // updatemenudefaults: {
            //     bgcolor: "#506784",
            //     borderwidth: 0
            // },
            // xaxis: {
            //     automargin: true,
            //     gridcolor: "#283442",
            //     linecolor: "#506784",
            //     ticks: "",
            //     title: {
            //         standoff: 15
            //     },
            //     zerolinecolor: "#283442",
            //     zerolinewidth: 2,
            // },
            // yaxis: {
            //     automargin: true,
            //     gridcolor: "#283442",
            //     linecolor: "#506784",
            //     ticks: "",
            //     title: {
            //         standoff: 15
            //     },
            //     zerolinecolor: "#283442",
            //     zerolinewidth: 2,
            // },
        
    })
    // .catch(error => {
    //     console.warn('Failed to apply Plotly dark mode:', error);
    //     // Remove marker on error so we can try again later
    //     el.removeAttribute('data-plotly-dark-applied');
    // });
}

export function switchPlotlyMode() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isDarkMode) {
        document.querySelectorAll(".js-plotly-plot").forEach(function (gd) {
            // Clear any existing markers to force re-application
            (gd as HTMLElement).removeAttribute('data-plotly-dark-applied');
            applyDarkModeToPlotly(gd as HTMLElement);
        });
    }
}

// Create context with proper typing
interface PlotlyStyleContextType {
    applyStylesManually: () => boolean;
    enableStyling: () => void;
    disableStyling: () => void;
    toggleStyling: () => void;
    isEnabled: boolean;
    disconnect: () => void;
    reconnect: () => void;
    applyPlotlyDarkMode: () => void;
}

const PlotlyStyleContext = createContext<PlotlyStyleContextType | null>(null);

// Provider component
export function PlotlyStyleProvider({ children, stylingOptions = {} }: {
    children: React.ReactNode;
    stylingOptions?: any;
}) {
    const [isEnabled, setIsEnabled] = useState(true);
    const stylingInProgressRef = useRef(false);

    // Plotly dark mode styling function with loop prevention
    const applyPlotlyDarkMode = useCallback((elements: NodeListOf<Element>) => {
        // Prevent concurrent styling operations
        if (stylingInProgressRef.current) {
            console.log('Styling already in progress, skipping');
            return;
        }

        stylingInProgressRef.current = true;

        try {
            elements.forEach(el => {
                if (el instanceof HTMLElement) {
                    try {
                        // Check if this is a Plotly plot element and not already styled
                        if ((el.classList.contains('js-plotly-plot')) &&
                            !el.hasAttribute('data-plotly-dark-applied')) {
                            console.log('Applying dark mode to Plotly plot:', el.id || el.className);
                            applyDarkModeToPlotly(el);
                        }
                    } catch (error) {
                        console.warn('Failed to apply dark mode to Plotly element:', error);
                    }
                }
            });
        } finally {
            // Clear the flag after a short delay to allow DOM to settle
            setTimeout(() => {
                stylingInProgressRef.current = false;
            }, 100);
        }
    }, []);

    // Enhanced observer to also watch for theme changes on html element
    const { applyStylesManually, disconnect, reconnect } = useMutationObserver({
        targetSelector: stylingOptions.selector || '.plotly, .js-plotly-plot, [data-plotly]',
        onElementsDetected: stylingOptions.onElementsDetected || applyPlotlyDarkMode,
        enabled: isEnabled,
        observerOptions: {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'data-plotly'], // Don't watch for our own data-plotly-dark-applied attribute
            ...stylingOptions.observerOptions
        }
    });

    // Watch for theme changes on html element
    useEffect(() => {
        if (!isEnabled) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' &&
                    mutation.target === document.documentElement) {
                    
                    console.log('Theme change detected, clearing markers and reapplying Plotly styling');
                    
                    // Clear all existing markers when theme changes
                    document.querySelectorAll('[data-plotly-dark-applied]').forEach(el => {
                        el.removeAttribute('data-plotly-dark-applied');
                    });
                    
                    // Reset styling flag
                    stylingInProgressRef.current = false;
                    
                    // Immediately reapply styling to all Plotly plots
                    const plotlyElements = document.querySelectorAll('.js-plotly-plot, .plotly, [data-plotly]');
                    applyPlotlyDarkMode(plotlyElements);
                }
            });
        });

        // Observe class changes on html element
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, [isEnabled, applyPlotlyDarkMode]);

    // Value to provide to consumers
    const value: PlotlyStyleContextType = {
        applyStylesManually,
        enableStyling: () => setIsEnabled(true),
        disableStyling: () => setIsEnabled(false),
        toggleStyling: () => setIsEnabled(prev => !prev),
        isEnabled,
        disconnect,
        reconnect,
        applyPlotlyDarkMode: () => {
            // Manual function to apply dark mode to all existing Plotly plots
            // Clear markers first to force re-application
            document.querySelectorAll('[data-plotly-dark-applied]').forEach(el => {
                el.removeAttribute('data-plotly-dark-applied');
            });
            
            const plotlyElements = document.querySelectorAll('.js-plotly-plot, .plotly, [data-plotly]');
            applyPlotlyDarkMode(plotlyElements);
        }
    };

    return (
        <PlotlyStyleContext.Provider value={value}>
            {children}
        </PlotlyStyleContext.Provider>
    );
}

// Hook to use the Plotly styling context
export function usePlotlyDarkMode(): PlotlyStyleContextType {
    const context = useContext(PlotlyStyleContext);
    if (!context) {
        throw new Error('usePlotlyDarkMode must be used within a PlotlyStyleProvider');
    }
    return context;
}

// Initialize global Plotly dark mode observer
export function initPlotlyDarkModeObserver() {
    let stylingInProgress = false;

    const observer = new MutationObserver((mutations) => {
        // Prevent styling during styling operations
        if (stylingInProgress) {
            return;
        }

        let plotlyElementsFound = false;
        let themeChanged = false;
        
        mutations.forEach(mutation => {
            // Ignore mutations to our own data attributes
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'data-plotly-dark-applied') {
                return;
            }

            // Check for theme changes on html element
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' &&
                mutation.target === document.documentElement) {
                themeChanged = true;
                return;
            }

            if (mutation.target && mutation.target.nodeType === Node.ELEMENT_NODE) {
                const element = mutation.target as Element;
                
                // Check if mutation affects Plotly elements
                if (element.matches?.('.js-plotly-plot, .plotly, [data-plotly]') ||
                    element.querySelectorAll?.('.js-plotly-plot, .plotly, [data-plotly]').length > 0) {
                    plotlyElementsFound = true;
                }
                
                // Check added nodes
                Array.from(mutation.addedNodes).forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as Element;
                        if (el.matches?.('.js-plotly-plot, .plotly, [data-plotly]') ||
                            el.querySelectorAll?.('.js-plotly-plot, .plotly, [data-plotly]').length > 0) {
                            plotlyElementsFound = true;
                        }
                    }
                });
            }
        });
        
        if (plotlyElementsFound || themeChanged) {
            stylingInProgress = true;

            try {
                // If theme changed, clear all markers
                if (themeChanged) {
                    document.querySelectorAll('[data-plotly-dark-applied]').forEach(el => {
                        el.removeAttribute('data-plotly-dark-applied');
                    });
                }

                // Apply dark mode to all Plotly plots (function will check dark mode internally)
                const plotlyElements = document.querySelectorAll('.js-plotly-plot, .plotly, [data-plotly]');
                plotlyElements.forEach(el => {
                    if (el instanceof HTMLElement && !el.hasAttribute('data-plotly-dark-applied')) {
                        try {
                            applyDarkModeToPlotly(el);
                        } catch (error) {
                            console.warn('Failed to apply dark mode to Plotly element:', error);
                        }
                    }
                });
            } finally {
                // Reset flag after a delay
                setTimeout(() => {
                    stylingInProgress = false;
                }, 100);
            }
        }
    });
    
    // Start observing both body (for plotly elements) and html (for theme changes)
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-plotly'] // Exclude our own marker attribute
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Apply to existing elements
    const existingPlots = document.querySelectorAll('.js-plotly-plot, .plotly, [data-plotly]');
    existingPlots.forEach(el => {
        if (el instanceof HTMLElement) {
            try {
                applyDarkModeToPlotly(el);
            } catch (error) {
                console.warn('Failed to apply dark mode to existing Plotly element:', error);
            }
        }
    });
    
    return observer;
}
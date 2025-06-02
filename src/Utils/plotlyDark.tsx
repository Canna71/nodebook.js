import * as Plotly from 'plotly.js-dist-min';

import { useEffect, useRef, useCallback, createContext, useState } from 'react';

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
    return Plotly.relayout(el as HTMLElement, {
        "template.layout": {
            annotationdefaults: {
                arrowcolor: "#f2f5fa",
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
                color: "#f2f5fa"
            },
            geo: {
                bgcolor: "#161a1d",
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
            paper_bgcolor: "#161a1d",
            plot_bgcolor: "#161a1d",
            polar: {
                angularaxis: {
                    gridcolor: "#506784",
                    linecolor: "#506784",
                    ticks: "",
                },
                bgcolor: "#161a1d",
                radialaxis: {
                    gridcolor: "#506784",
                    linecolor: "#506784",
                    ticks: "",
                },
            },
            scene: {
                xaxis: {
                    backgroundcolor: "#161a1d",
                    gridcolor: "#506784",
                    gridwidth: 2,
                    linecolor: "#506784",
                    showbackground: true,
                    ticks: "",
                    zerolinecolor: "#C8D4E3",
                },
                yaxis: {
                    backgroundcolor: "#161a1d",
                    gridcolor: "#506784",
                    gridwidth: 2,
                    linecolor: "#506784",
                    showbackground: true,
                    ticks: "",
                    zerolinecolor: "#C8D4E3",
                },
                zaxis: {
                    backgroundcolor: "#161a1d",
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
                    color: "#f2f5fa"
                }
            },
            sliderdefaults: {
                bgcolor: "#C8D4E3",
                bordercolor: "#161a1d",
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
                bgcolor: "#161a1d",
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
}

export function switchPlotlyMode() {
    const theme = localStorage.getItem('theme');
    if (theme === "dark-mode") {
        // $("body").addClass("dark-mode");
        javascript: document.querySelectorAll(".js-plotly-plot").forEach(function (gd) {
            applyDarkModeToPlotly(gd as HTMLElement);
        });
    }
}


// Create context
const PlotlyStyleContext = createContext();

// Provider component
export function PlotlyStyleProvider({ children, stylingOptions = {} }) {
    const [isEnabled, setIsEnabled] = useState(true);

    // Default styling function
    const defaultStylingFunction = (elements) => {
        elements.forEach(el => {
            // Apply default styling
            // ...
        });
    };

    // Use the custom hook
    const { applyStylesManually, disconnect, reconnect } = useMutationObserver({
        targetSelector: stylingOptions.selector || '.plotly, .js-plotly-plot',
        onElementsDetected: stylingOptions.onElementsDetected || defaultStylingFunction,
        enabled: isEnabled,
    });

    // Value to provide to consumers
    const value = {
        applyStylesManually,
        enableStyling: () => setIsEnabled(true),
        disableStyling: () => setIsEnabled(false),
        toggleStyling: () => setIsEnabled(prev => !prev),
        isEnabled,
        disconnect,
        reconnect
    };

    return (
        <PlotlyStyleContext.Provider value={value}>
            {children}
        </PlotlyStyleContext.Provider>
    );
}
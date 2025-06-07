declare module 'plotly.js-dist-min' {
    export function relayout(gd: HTMLElement, layout: any): Promise<void>;
    export function newPlot(gd: HTMLElement, data: any[], layout?: any, config?: any): Promise<void>;
    export function update(gd: HTMLElement, updates: any, layoutUpdate?: any): Promise<void>;
    export function addTraces(gd: HTMLElement, traces: any[], indices?: number | number[]): Promise<void>;
    export function deleteTraces(gd: HTMLElement, indices: number | number[]): Promise<void>;

    export function restyle(arg0: HTMLElement, arg1: any);
}
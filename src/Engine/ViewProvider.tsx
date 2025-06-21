import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AppView = 'notebook' | 'settings' | 'documentation' | 'shortcuts';

interface ViewContextType {
    currentView: AppView;
    setCurrentView: (view: AppView) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
    const [currentView, setCurrentView] = useState<AppView>('notebook');

    return (
        <ViewContext.Provider value={{ currentView, setCurrentView }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}

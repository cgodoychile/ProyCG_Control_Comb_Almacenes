import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AlertsContextType {
    dismissedIds: string[];
    setDismissedIds: (ids: string[]) => void;
    handleDismiss: (id: string) => void;
    handleDismissAll: (activeIds: string[]) => void;
    handleClearDismissed: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    // Load dismissed alerts from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('dismissed_alerts');
        if (saved) {
            try {
                setDismissedIds(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing dismissed alerts", e);
            }
        }
    }, []);

    const handleDismiss = (id: string) => {
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem('dismissed_alerts', JSON.stringify(newDismissed));
    };

    const handleDismissAll = (activeIds: string[]) => {
        const newDismissed = [...new Set([...dismissedIds, ...activeIds])];
        setDismissedIds(newDismissed);
        localStorage.setItem('dismissed_alerts', JSON.stringify(newDismissed));
    };

    const handleClearDismissed = () => {
        setDismissedIds([]);
        localStorage.removeItem('dismissed_alerts');
    };

    return (
        <AlertsContext.Provider value={{
            dismissedIds,
            setDismissedIds,
            handleDismiss,
            handleDismissAll,
            handleClearDismissed
        }}>
            {children}
        </AlertsContext.Provider>
    );
}

export function useAlertsContext() {
    const context = useContext(AlertsContext);
    if (context === undefined) {
        throw new Error('useAlertsContext must be used within an AlertsProvider');
    }
    return context;
}

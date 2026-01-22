
/**
 * Utility functions for date formatting and manipulation across the application.
 * Ensures consistent usage of Chile timezone (America/Santiago) and format.
 */

// Chilean timestamp offset is generally UTC-3 or UTC-4.
// If the backend returns UTC strings (ending in Z), the browser converts to local.
// If the backend returns "local" strings but they are actually UTC (without Z), we might need to shift them.
// Based on user report of "5 hours difference", we might need to force a specific timezone interpretation.

export const TIMEZONE = 'America/Santiago';

export const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return new Intl.DateTimeFormat('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: TIMEZONE
        }).format(date);
    } catch (e) {
        console.error('Error formatting date:', e);
        return '-';
    }
};

export const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        // The user mentioned a 5-hour difference. 
        // This typically happens when a UTC date is interpreted as local or vice-versa.
        // We'll trust standard timezone conversion first.
        return new Intl.DateTimeFormat('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24-hour format
            timeZone: TIMEZONE
        }).format(date);
    } catch (e) {
        console.error('Error formatting date time:', e);
        return '-';
    }
};

/**
 * Sorts an array of objects by a date field in descending order (newest first).
 */
export const sortByDateDesc = <T>(data: T[], dateField: keyof T): T[] => {
    return [...data].sort((a, b) => {
        const dateA = new Date(String(a[dateField]));
        const dateB = new Date(String(b[dateField]));
        return dateB.getTime() - dateA.getTime();
    });
};

/**
 * Sorts an array of objects by a date field in ascending order (oldest first).
 */
export const sortByDateAsc = <T>(data: T[], dateField: keyof T): T[] => {
    return [...data].sort((a, b) => {
        const dateA = new Date(String(a[dateField]));
        const dateB = new Date(String(b[dateField]));
        return dateA.getTime() - dateB.getTime();
    });
};

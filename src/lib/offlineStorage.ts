import { generateUUID } from './uuidPool';

export interface QueuedRequest {
    id: string;
    entity: string;
    action: string;
    method: string;
    body: any;
    params?: Record<string, string>;
    timestamp: number;
}

const STORAGE_KEY = 'proycg-sync-outbox';

export const offlineStorage = {
    getQueue: (): QueuedRequest[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading offline queue:', e);
            return [];
        }
    },

    enqueue: (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
        const queue = offlineStorage.getQueue();
        const newRequest: QueuedRequest = {
            ...request,
            id: generateUUID(),
            timestamp: Date.now(),
        };
        queue.push(newRequest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return newRequest;
    },

    removeFromQueue: (id: string) => {
        const queue = offlineStorage.getQueue();
        const newQueue = queue.filter((req) => req.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQueue));
    },

    clearQueue: () => {
        localStorage.removeItem(STORAGE_KEY);
    },
};

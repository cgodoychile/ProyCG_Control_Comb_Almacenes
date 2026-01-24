import React, { useEffect, useState, useCallback } from 'react';
import { offlineStorage, QueuedRequest } from '@/lib/offlineStorage';
import { buildApiUrl } from '@/lib/api';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const SyncManager: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const queryClient = useQueryClient();

    const syncQueue = useCallback(async () => {
        const queue = offlineStorage.getQueue();
        if (queue.length === 0) return;

        setIsSyncing(true);
        let successCount = 0;
        let failCount = 0;

        toast.info(`Sincronizando ${queue.length} registros pendientes...`, {
            icon: <RefreshCcw className="w-4 h-4 animate-spin" />,
            id: 'sync-process',
        });

        for (const req of queue) {
            try {
                const url = buildApiUrl(req.entity, req.action, undefined, req.params);

                const response = await fetch(url, {
                    method: req.method,
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(req.body),
                });

                const data = await response.json();
                if (data.success) {
                    offlineStorage.removeFromQueue(req.id);
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                console.error('Failed to sync request:', req.id, err);
                failCount++;
            }
        }

        setIsSyncing(false);
        setPendingCount(offlineStorage.getQueue().length);

        if (successCount > 0) {
            toast.success(`¡Sincronización completada! (${successCount} éxito, ${failCount} fallidos)`, {
                icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                id: 'sync-process',
            });
            // Invalidate all queries to refresh UI with synced data
            queryClient.invalidateQueries();
        } else if (failCount > 0) {
            toast.error('La sincronización falló. Se reintentará más tarde.', {
                id: 'sync-process',
            });
        }
    }, [queryClient]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Conexión restaurada', {
                description: 'El sistema intentará sincronizar los datos pendientes.',
                icon: <Wifi className="w-4 h-4 text-green-500" />,
            });
            syncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Sin conexión a internet. Los cambios se guardarán localmente.', {
                icon: <WifiOff className="w-4 h-4 text-yellow-500" />,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic check for pending items if online
        const interval = setInterval(() => {
            const queue = offlineStorage.getQueue();
            setPendingCount(queue.length);
            if (navigator.onLine && queue.length > 0 && !isSyncing) {
                syncQueue();
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [syncQueue, isSyncing]);

    if (pendingCount === 0 && isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
            {!isOnline && (
                <div className="bg-destructive text-white px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 text-sm font-bold animate-bounce ring-4 ring-destructive/20">
                    <WifiOff className="w-5 h-5" />
                    MODO OFFLINE - Cambios guardados localmente
                </div>
            )}
            {isOnline && pendingCount === 0 && (
                <div className="bg-success/90 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in">
                    <Wifi className="w-3.5 h-3.5" />
                    Sincronizado
                </div>
            )}
            {pendingCount > 0 && (
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-bold ring-4 ring-primary/20">
                    <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {pendingCount} registro{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

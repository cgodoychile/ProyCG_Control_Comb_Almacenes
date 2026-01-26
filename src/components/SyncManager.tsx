import { useState, useEffect } from 'react';
import { offlineStorage, QueuedRequest } from '@/lib/offlineStorage';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, Cloud, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SyncManager() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        updatePendingCount();

        // Set up auto-sync interval
        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncData();
            }
        }, 30000); // Try every 30 seconds

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const updatePendingCount = () => {
        const queue = offlineStorage.getQueue();
        setPendingCount(queue.length);
    };

    const syncData = async () => {
        const queue = offlineStorage.getQueue();
        if (queue.length === 0 || isSyncing) return;

        setIsSyncing(true);
        console.log(`🔄 [Sync] Starting sync of ${queue.length} items`);

        let successCount = 0;

        // Process queue items one by one
        for (const item of queue) {
            try {
                const response = await apiFetch(item.entity, item.action, {
                    method: item.method as any,
                    body: item.body,
                    params: item.params,
                    isSync: true
                });

                if (response.success) {
                    offlineStorage.removeFromQueue(item.id);
                    successCount++;
                } else if (response.statusCode >= 400 && response.statusCode < 500) {
                    // Validation or client error - won't be fixed by retrying
                    console.warn(`⚠️ [Sync] Discarding invalid request ${item.entity}/${item.action}:`, response.message);
                    offlineStorage.removeFromQueue(item.id);
                    toast({
                        variant: "destructive",
                        title: "Registro descartado",
                        description: `No se pudo procesar ${item.entity}: ${response.message}`
                    });
                }
            } catch (error) {
                console.error(`❌ [Sync] Failed to process ${item.entity}/${item.action}:`, error);
            }
        }

        setIsSyncing(false);
        updatePendingCount();

        if (successCount > 0) {
            toast({
                title: "Sincronización completa",
                description: `Se han procesado ${successCount} registros exitosamente.`
            });
        }
    };

    if (!isOnline) {
        return (
            <div className="fixed bottom-4 right-4 z-50 animate-bounce">
                <Badge variant="destructive" className="flex items-center gap-2 p-2 shadow-lg">
                    <WifiOff className="h-4 w-4" />
                    MODO OFFLINE
                </Badge>
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                {isOnline && (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="shadow-lg gap-2 text-[10px] font-bold h-8"
                        onClick={syncData}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                        FORZAR SINCRONIZACIÓN
                    </Button>
                )}
                <Badge
                    className={cn(
                        "flex items-center gap-2 p-2 shadow-lg transition-colors",
                        isOnline ? "bg-blue-600 hover:bg-blue-700" : "bg-muted text-muted-foreground"
                    )}
                >
                    {isSyncing ? (
                        <Cloud className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    {pendingCount} registros pendientes {!isOnline && '(Offline)'}
                </Badge>
            </div>
        );
    }

    return null;
}

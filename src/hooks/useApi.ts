import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/lib/api';

interface ApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    successMessage?: string;
}

export function useApi() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(
        async <T>(
            promise: Promise<ApiResponse<T>>,
            options?: ApiOptions<T>
        ): Promise<T | null> => {
            setLoading(true);
            setError(null);

            try {
                const response = await promise;

                if (response.success) {
                    if (options?.successMessage) {
                        toast({
                            title: "✅ Éxito",
                            description: options.successMessage,
                        });
                    }
                    options?.onSuccess?.(response.data as T);
                    return response.data as T;
                } else {
                    const errMsg = response.message || 'Error en la operación';
                    setError(errMsg);
                    toast({
                        variant: "destructive",
                        title: "❌ Error",
                        description: errMsg,
                    });
                    options?.onError?.(errMsg);
                    return null;
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Error de red o servidor';
                setError(errMsg);
                toast({
                    variant: "destructive",
                    title: "❌ Error Crítico",
                    description: errMsg,
                });
                options?.onError?.(errMsg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [toast]
    );

    return { execute, loading, error };
}

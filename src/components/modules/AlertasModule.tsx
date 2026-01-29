import { useAlerts } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { CheckCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Loader2, Trash2, Wand2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { alertasApi } from '@/lib/apiService';
import { useQueryClient } from '@tanstack/react-query';

export function AlertasModule() {
  const { alerts, activeAlerts, handleDismiss, handleDismissAll, handleClearDismissed, isLoading } = useAlerts();
  const { isAdmin } = useAuth();
  const { execute, loading: isProcessing } = useApi();
  const queryClient = useQueryClient();

  const handleApproveDelete = async (alerta: any) => {
    if (!alerta.data || !alerta.data.entity || !alerta.data.id) return;

    await execute(
      alertasApi.update(alerta.id, {
        action: 'approveAndDelete',
        targetEntity: alerta.data.entity,
        targetId: alerta.data.id,
        restoreStock: alerta.data.restoreStock,
        justification: alerta.data.justification
      } as any),
      {
        successMessage: "Registro eliminado y solicitud procesada correctamente.",
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['activity-alerts'] });
          queryClient.invalidateQueries({ queryKey: [alerta.data.entity] });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando alertas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Centro de Alertas</h2>
          <p className="text-muted-foreground">Monitoreo de niveles críticos y vencimientos.</p>
        </div>

        <div className="flex gap-2">
          {activeAlerts.length > 0 && (
            <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/5" onClick={handleDismissAll}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todo como visto
            </Button>
          )}
          {activeAlerts.length < alerts.length && (
            <Button variant="outline" size="sm" onClick={handleClearDismissed}>
              Restaurar Ocultas
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md"
              onClick={async () => {
                if (window.confirm("¿Deseas intentar reparar automáticamente los datos desplazados en la hoja de Alertas?")) {
                  await execute(alertasApi.post('repair'), {
                    successMessage: "Reparación Alertas v1.1 completada",
                    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity-alerts'] })
                  });
                }
              }}
              disabled={isProcessing}
            >
              <Wand2 className="w-4 h-4" />
              REPARAR ALINEACIÓN (v1.1)
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {activeAlerts.length === 0 ? (
          <Card className="p-8 flex flex-col items-center justify-center text-center text-muted-foreground space-y-4 border-dashed">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-medium text-lg text-foreground">Todo está en orden</h3>
              <p className="max-w-xs mx-auto">No hay alertas activas en este momento. Los niveles de combustible y mantenciones están bajo control.</p>
            </div>
          </Card>
        ) : (
          activeAlerts.map((alerta) => (
            <div
              key={alerta.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border shadow-sm transition-all bg-card",
                alerta.tipo === 'critical' && "border-l-4 border-l-destructive",
                alerta.tipo === 'warning' && "border-l-4 border-l-yellow-500",
                alerta.tipo === 'success' && "border-l-4 border-l-green-500",
                alerta.tipo === 'info' && "border-l-4 border-l-blue-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-full flex-shrink-0 mt-0.5",
                alerta.tipo === 'critical' ? "bg-destructive/10 text-destructive" :
                  alerta.tipo === 'warning' ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" :
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{alerta.titulo}</h4>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
                    {alerta.fecha}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{alerta.mensaje}</p>
                <div className="flex items-center pt-2 gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary/50">
                    {alerta.origen}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 self-center">
                {isAdmin && alerta.accion === 'solicitud_eliminacion' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled={isProcessing}
                    onClick={() => handleApproveDelete(alerta)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Aprobar y Eliminar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => handleDismiss(alerta.id)}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Listo
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

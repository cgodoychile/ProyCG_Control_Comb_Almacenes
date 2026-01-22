import { Alerta } from '@/types/crm';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertsListProps {
  alertas: Alerta[];
  limit?: number;
  onDismiss?: (id: string) => void;
}

export function AlertsList({ alertas, limit, onDismiss }: AlertsListProps) {
  const displayAlertas = limit ? alertas.slice(0, limit) : alertas;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'critical':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="space-y-3">
      {displayAlertas.map((alerta) => {
        const Icon = getIcon(alerta.tipo);
        return (
          <div
            key={alerta.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border transition-all duration-200",
              alerta.tipo === 'critical' && "bg-critical/5 border-critical/30",
              alerta.tipo === 'warning' && "bg-warning/5 border-warning/30",
              alerta.tipo === 'success' && "bg-success/5 border-success/30",
              !alerta.leida && "ring-1 ring-offset-1 ring-offset-background",
              alerta.tipo === 'critical' && !alerta.leida && "ring-critical/50",
              alerta.tipo === 'warning' && !alerta.leida && "ring-warning/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              alerta.tipo === 'critical' && "bg-critical/20 text-critical",
              alerta.tipo === 'warning' && "bg-warning/20 text-warning",
              alerta.tipo === 'success' && "bg-success/20 text-success"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                !alerta.leida && "text-foreground",
                alerta.leida && "text-muted-foreground"
              )}>
                {alerta.mensaje}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{alerta.modulo}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{alerta.fecha}</span>
              </div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="text-success hover:text-success hover:bg-success/10 self-center"
                onClick={() => onDismiss(alerta.id)}
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}
            {!alerta.leida && !onDismiss && (
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                alerta.tipo === 'critical' && "bg-critical",
                alerta.tipo === 'warning' && "bg-warning",
                alerta.tipo === 'success' && "bg-success"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

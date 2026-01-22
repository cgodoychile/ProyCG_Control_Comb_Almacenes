import { Estanque } from '@/types/crm';
import { cn } from '@/lib/utils';
import { Droplets } from 'lucide-react';

interface TankStatusProps {
  estanque: Estanque;
}

export function TankStatus({ estanque }: TankStatusProps) {
  // Safety checks for undefined values
  const stockActual = estanque?.stockActual ?? 0;
  const capacidadTotal = estanque?.capacidadTotal ?? 1;
  const porcentaje = Math.round((stockActual / capacidadTotal) * 100);

  const getStatusColor = () => {
    if (estanque?.estado === 'critico') return 'bg-critical';
    if (estanque?.estado === 'bajo') return 'bg-warning';
    return 'bg-success';
  };

  const getStatusGlow = () => {
    if (estanque?.estado === 'critico') return 'shadow-glow-critical';
    if (estanque?.estado === 'bajo') return 'shadow-glow-warning';
    return 'shadow-glow-success';
  };

  const getStatusLabel = () => {
    if (estanque?.estado === 'critico') return 'Crítico';
    if (estanque?.estado === 'bajo') return 'Bajo Stock';
    if (estanque?.estado === 'fuera_servicio') return 'Fuera de Servicio';
    return 'Operativo';
  };

  if (!estanque) {
    return null;
  }

  return (
    <div className={cn(
      "card-fuel p-5 rounded-xl border border-border transition-all duration-300 hover:scale-[1.02]",
      estanque.estado === 'critico' && "border-critical/30",
      estanque.estado === 'bajo' && "border-warning/30"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{estanque.nombre || 'Sin nombre'}</h3>
          <p className="text-sm text-muted-foreground">{estanque.ubicacion || 'Sin ubicación'}</p>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          estanque.estado === 'critico' && "bg-critical/20",
          estanque.estado === 'bajo' && "bg-warning/20",
          estanque.estado === 'operativo' && "bg-success/20"
        )}>
          <Droplets className={cn(
            "w-5 h-5",
            estanque.estado === 'critico' && "text-critical",
            estanque.estado === 'bajo' && "text-warning",
            estanque.estado === 'operativo' && "text-success"
          )} />
        </div>
      </div>

      {/* Tank Level Visualization */}
      <div className="relative h-24 bg-secondary rounded-lg overflow-hidden mb-4">
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-1000",
            getStatusColor()
          )}
          style={{ height: `${porcentaje}%` }}
        >
          <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-transparent to-white/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground drop-shadow-lg">
            {porcentaje}%
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Stock Actual</span>
          <span className="font-mono font-medium text-foreground">
            {stockActual.toLocaleString()} L
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Capacidad</span>
          <span className="font-mono text-muted-foreground">
            {capacidadTotal.toLocaleString()} L
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Estado</span>
          <span className={cn(
            "alert-badge",
            estanque.estado === 'critico' && "alert-badge-critical",
            estanque.estado === 'bajo' && "alert-badge-warning",
            estanque.estado === 'operativo' && "alert-badge-success"
          )}>
            <span className={cn("status-indicator", `status-${estanque.estado}`)} />
            {getStatusLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}

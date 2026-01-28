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
      "relative overflow-hidden group p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-slate-900",
      estanque.estado === 'critico' ? "border-critical/50 shadow-critical/10" :
        estanque.estado === 'bajo' ? "border-warning/50 shadow-warning/10" : "border-white/10 shadow-white/5"
    )}>
      {/* Decorative background glow */}
      <div className={cn(
        "absolute -bottom-12 -left-12 w-32 h-32 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-700",
        estanque.estado === 'critico' ? "bg-critical" : estanque.estado === 'bajo' ? "bg-warning" : "bg-success"
      )} />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight leading-tight group-hover:text-primary transition-colors">
            {estanque.nombre || 'Sin nombre'}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            {estanque.ubicacion || 'Sin ubicación'}
          </p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg",
          estanque.estado === 'critico' ? "bg-critical/30 border-critical/40 text-critical" :
            estanque.estado === 'bajo' ? "bg-warning/30 border-warning/40 text-warning" :
              "bg-success/30 border-success/40 text-success"
        )}>
          <Droplets className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 relative z-10">
        {/* Vertical Tank Visualization */}
        <div className="col-span-2 relative h-32 w-full bg-black/50 rounded-2xl overflow-hidden border border-white/10 shadow-inner group/tank text-center">
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 transition-all duration-[1.5s] ease-in-out",
              getStatusColor()
            )}
            style={{ height: `${porcentaje}%` }}
          >
            {/* Liquid effect overlays */}
            <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-black/40 to-white/30" />
            <div className="absolute -top-1 left-0 right-0 h-2 bg-white/20 blur-[2px] animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tighter">
              {porcentaje}%
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="col-span-3 flex flex-col justify-between py-1">
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Stock Actual</span>
              <span className="text-xl font-black text-white tracking-tighter tabular-nums">
                {stockActual.toLocaleString()} <span className="text-xs text-slate-500 font-bold ml-0.5">L</span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Capacidad</span>
              <span className="text-sm font-bold text-slate-300 tracking-tight tabular-nums">
                {capacidadTotal.toLocaleString()} <span className="text-[10px] text-slate-500 ml-0.5">L</span>
              </span>
            </div>
          </div>

          <div className={cn(
            "mt-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border",
            estanque.estado === 'critico' ? "bg-critical/30 text-white border-critical/50 shadow-sm shadow-critical/20" :
              estanque.estado === 'bajo' ? "bg-warning/30 text-white border-warning/50 shadow-sm shadow-warning/20" :
                "bg-success/30 text-white border-success/50 shadow-sm shadow-success/20"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              estanque.estado === 'critico' ? "bg-critical" : estanque.estado === 'bajo' ? "bg-warning" : "bg-success"
            )} />
            {getStatusLabel()}
          </div>
        </div>
      </div>
    </div>
  );
}

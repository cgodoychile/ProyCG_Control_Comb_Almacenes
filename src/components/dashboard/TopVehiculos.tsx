import { Truck, Crown, Thermometer } from 'lucide-react';
import { useMemo } from 'react';

interface TopVehiculosProps {
  consumos: any[];
}

export function TopVehiculos({ consumos }: TopVehiculosProps) {
  const topVehiculos = useMemo(() => {
    if (!consumos || consumos.length === 0) return [];

    const totals: Record<string, { total: number, conductor: string }> = {};

    consumos.forEach(c => {
      const vehId = c.vehiculo || c.patente;
      if (!vehId) return;

      if (!totals[vehId]) {
        totals[vehId] = { total: 0, conductor: c.responsable || 'Sin conductor' };
      }
      totals[vehId].total += (Number(c.litrosUsados) || 0);
    });

    return Object.entries(totals)
      .map(([patente, data]) => ({
        patente,
        consumo: Math.round(data.total * 10) / 10,
        conductor: data.conductor
      }))
      .sort((a, b) => b.consumo - a.consumo)
      .slice(0, 5);
  }, [consumos]);

  const maxConsumo = useMemo(() =>
    topVehiculos.length > 0 ? Math.max(...topVehiculos.map(v => v.consumo)) : 0
    , [topVehiculos]);

  if (topVehiculos.length === 0) {
    return (
      <div className="card-fuel p-6 rounded-xl border border-border h-full flex flex-col items-center justify-center text-muted-foreground italic">
        <Truck className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm">Sin datos de consumo</p>
      </div>
    );
  }

  return (
    <div className="card-fuel p-6 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-md shadow-2xl relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors duration-700" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-accent animate-pulse" />
            Top Consumidores
          </h3>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Ranking de Consumo Crítico</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
          <Truck className="w-5 h-5 text-accent" />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {topVehiculos.map((vehiculo, index) => {
          const percentage = maxConsumo > 0 ? (vehiculo.consumo / maxConsumo) * 100 : 0;
          return (
            <div key={vehiculo.patente} className="space-y-2.5 animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm transition-all duration-300 shadow-lg",
                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-600 text-white scale-110 shadow-orange-500/20" :
                      index === 1 ? "bg-slate-300 text-slate-800" :
                        index === 2 ? "bg-amber-700 text-white" :
                          "bg-slate-800 text-slate-400 border border-white/5"
                  )}>
                    {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white leading-tight group-hover/item:text-accent transition-colors">
                      {vehiculo.patente}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[120px]">
                      {vehiculo.conductor}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-lg font-black tracking-tighter block leading-none",
                    index === 0 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]" : "text-white"
                  )}>
                    {vehiculo.consumo.toLocaleString('es-ES')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-black uppercase">Litros</span>
                </div>
              </div>

              <div className="h-2.5 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div
                  className={cn(
                    "h-full transition-all duration-1000 ease-out rounded-full relative",
                    index === 0 ? "bg-gradient-to-r from-orange-600 via-orange-400 to-yellow-300 p-[1px]" :
                      index === 1 ? "bg-gradient-to-r from-blue-600 to-accent" :
                        "bg-gradient-to-r from-slate-600 to-slate-400"
                  )}
                  style={{ width: `${percentage}%` }}
                >
                  {index === 0 && <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

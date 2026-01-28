import { AlertTriangle, Fuel } from 'lucide-react';

interface TopCargasProps {
    consumos: any[];
}

export function TopCargas({ consumos }: TopCargasProps) {
    // Filtrar consumos >80L y ordenar por litros descendente
    const cargasAltas = consumos
        .filter(c => (c.litrosUsados || 0) > 80)
        .sort((a, b) => (b.litrosUsados || 0) - (a.litrosUsados || 0))
        .slice(0, 5); // Top 5

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${day}-${month}`;
        } catch {
            return dateString;
        }
    };

    return (
        <div className="card-fuel p-6 rounded-3xl border border-white/10 bg-slate-900 shadow-2xl relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-warning/20 transition-colors duration-700" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning animate-pulse" />
                        Cargas Mayores a 80L
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Alertas de Alto Consumo</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-warning/20 border border-warning/30 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                    <Fuel className="w-5 h-5 text-warning" />
                </div>
            </div>

            {cargasAltas.length === 0 ? (
                <div className="text-center py-12 relative z-10">
                    <Fuel className="w-12 h-12 mx-auto text-slate-700 mb-2 opacity-20" />
                    <p className="text-sm text-slate-500 font-bold">Bajo control: Sin cargas críticas</p>
                </div>
            ) : (
                <div className="space-y-6 relative z-10">
                    {cargasAltas.map((consumo, idx) => {
                        const maxLitros = Math.max(...cargasAltas.map(c => c.litrosUsados || 0));
                        const percentage = maxLitros > 0 ? (consumo.litrosUsados / maxLitros) * 100 : 0;

                        return (
                            <div key={idx} className="space-y-2.5 animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-end justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs transition-all duration-300 shadow-lg",
                                            idx === 0 ? "bg-gradient-to-br from-warning to-orange-600 text-white scale-110 shadow-warning/20" :
                                                "bg-slate-800 text-slate-300 border border-white/10"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-white leading-tight group-hover/item:text-warning transition-colors">
                                                {consumo.vehiculo || 'Desconocido'}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {consumo.estanque}
                                                </p>
                                                <span className="text-[8px] text-slate-600">•</span>
                                                <p className="text-[9px] text-slate-400 font-black tracking-tighter">
                                                    {formatDate(consumo.fecha)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-lg font-black tracking-tighter block leading-none",
                                            idx === 0 ? "text-warning drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-white"
                                        )}>
                                            {Number(consumo.litrosUsados).toFixed(1)}
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-black uppercase">Litros</span>
                                    </div>
                                </div>

                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-1000 ease-out rounded-full relative",
                                            idx === 0 ? "bg-gradient-to-r from-warning via-orange-500 to-red-500" :
                                                "bg-gradient-to-r from-slate-600 to-slate-400"
                                        )}
                                        style={{ width: `${percentage}%` }}
                                    >
                                        {idx === 0 && <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {cargasAltas.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Acumulado Crítico</span>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 bg-warning/20 rounded-full overflow-hidden">
                                <div className="h-full bg-warning animate-pulse" style={{ width: '60%' }} />
                            </div>
                            <span className="text-sm font-black text-warning">
                                {cargasAltas.reduce((sum, c) => sum + (c.litrosUsados || 0), 0).toLocaleString('es-ES')} L
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

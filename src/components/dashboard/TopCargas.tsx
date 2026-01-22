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
        <div className="card-fuel p-6 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <h3 className="font-semibold text-foreground">Top Cargas Mayor a 80L</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-warning/20 px-2 py-1 rounded">
                    {cargasAltas.length} registros
                </span>
            </div>

            {cargasAltas.length === 0 ? (
                <div className="text-center py-8">
                    <Fuel className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No hay consumos mayores a 80L</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {cargasAltas.map((consumo, idx) => (
                        <div
                            key={idx}
                            className="p-3 bg-warning/5 border border-warning/20 rounded-lg hover:bg-warning/10 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-bold flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                        <p className="font-medium text-foreground">
                                            {consumo.vehiculo || 'Vehículo'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground ml-8">
                                        <span>{consumo.estanque}</span>
                                        <span>•</span>
                                        <span>{formatDate(consumo.fecha)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-warning">
                                        {Number(consumo.litrosUsados).toFixed(1)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Litros</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {cargasAltas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total consumido:</span>
                        <span className="font-bold text-warning">
                            {cargasAltas.reduce((sum, c) => sum + (c.litrosUsados || 0), 0).toLocaleString('es-ES')} L
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

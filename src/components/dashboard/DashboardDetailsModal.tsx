import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Fuel, TrendingUp, Database, Truck, Gauge } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardDetailsModalProps {
    open: boolean;
    onClose: () => void;
    type: 'consumoDiario' | 'consumoSemanal' | 'consumoMensual' | 'consumoMesAnterior' | 'stock' | 'flota' | null;
    data: {
        consumosData?: any[];
        estanquesData?: any[];
        activosData?: any[];
        today?: string;
        thisMonth?: string;
        lastMonth?: Date;
    };
}

export function DashboardDetailsModal({ open, onClose, type, data }: DashboardDetailsModalProps) {
    if (!type) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch {
            return dateString;
        }
    };

    const renderContent = () => {
        switch (type) {
            case 'consumoDiario':
                const consumosHoy = data.consumosData?.filter(c => {
                    const fechaStr = typeof c.fecha === 'string' ? c.fecha :
                        (c.fecha ? format(new Date(c.fecha), 'yyyy-MM-dd') : '');
                    return fechaStr.startsWith(data.today || '');
                }) || [];

                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-accent">
                            <Fuel className="w-5 h-5" />
                            <h3 className="font-semibold">Consumos de Hoy</h3>
                        </div>
                        {consumosHoy.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No hay consumos registrados hoy</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {consumosHoy.map((c, idx) => (
                                    <div key={idx} className="p-3 bg-secondary/50 rounded-lg border border-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{c.vehiculo || 'Vehículo'}</p>
                                                <p className="text-sm text-muted-foreground">{c.estanque}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-accent">{c.litrosUsados} L</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(c.fecha)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Total: <span className="font-bold text-foreground">
                                    {consumosHoy.reduce((sum, c) => sum + (c.litrosUsados || 0), 0).toLocaleString('es-ES')} L
                                </span>
                            </p>
                        </div>
                    </div>
                );

            case 'consumoSemanal':
                const sieteDiasAtras = new Date();
                sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);

                const consumosSemana = data.consumosData?.filter(c => {
                    const fechaRec = new Date(c.fecha);
                    return fechaRec >= sieteDiasAtras;
                }) || [];

                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Gauge className="w-5 h-5" />
                            <h3 className="font-semibold">Consumo Últimos 7 Días</h3>
                        </div>
                        {consumosSemana.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No hay consumos en los últimos 7 días</p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {consumosSemana.map((c, idx) => (
                                    <div key={idx} className="p-3 bg-secondary/50 rounded-lg border border-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{c.vehiculo || 'Vehículo'}</p>
                                                <p className="text-sm text-muted-foreground">{c.estanque}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">{c.litrosUsados} L</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(c.fecha)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Total Semana: <span className="font-bold text-foreground">
                                    {consumosSemana.reduce((sum, c) => sum + (c.litrosUsados || 0), 0).toLocaleString('es-ES')} L
                                </span>
                            </p>
                        </div>
                    </div>
                );

            case 'consumoMensual':
            case 'consumoMesAnterior':
                const monthStr = type === 'consumoMensual' ? data.thisMonth :
                    (data.lastMonth ? format(data.lastMonth, 'yyyy-MM') : '');
                const consumosMes = data.consumosData?.filter(c => {
                    const fechaStr = typeof c.fecha === 'string' ? c.fecha :
                        (c.fecha ? format(new Date(c.fecha), 'yyyy-MM-dd') : '');
                    return fechaStr.startsWith(monthStr || '');
                }) || [];

                const totalMes = consumosMes.reduce((sum, c) => sum + (c.litrosUsados || 0), 0);
                const promedioDiario = consumosMes.length > 0 ? totalMes / new Date().getDate() : 0;

                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <TrendingUp className="w-5 h-5" />
                            <h3 className="font-semibold">
                                {type === 'consumoMensual' ? 'Consumo Mes Actual' : 'Consumo Mes Anterior'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold text-foreground">{totalMes.toLocaleString('es-ES')} L</p>
                            </div>
                            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                                <p className="text-sm text-muted-foreground">Promedio Diario</p>
                                <p className="text-2xl font-bold text-foreground">{promedioDiario.toFixed(0)} L</p>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            <p className="text-sm font-medium text-muted-foreground">Todos los consumos del mes ({consumosMes.length}):</p>
                            {consumosMes.map((c, idx) => (
                                <div key={idx} className="p-2 bg-secondary/30 rounded border border-border/50 text-sm">
                                    <div className="flex justify-between">
                                        <span>{c.vehiculo || 'Vehículo'}</span>
                                        <span className="font-medium">{c.litrosUsados} L</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{formatDate(c.fecha)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'stock':
                const totalStock = (data.estanquesData || []).reduce((sum, e) => sum + (e.stockActual || 0), 0);
                const totalCapacidad = (data.estanquesData || []).reduce((sum, e) => sum + (e.capacidadTotal || 0), 0);
                const porcentajeTotal = totalCapacidad > 0 ? Math.round((totalStock / totalCapacidad) * 100) : 0;

                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-success">
                            <Database className="w-5 h-5" />
                            <h3 className="font-semibold">Estado de Estanques</h3>
                        </div>

                        {/* Resumen Total */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-success/10 rounded-lg border border-success/20">
                            <div>
                                <p className="text-sm text-muted-foreground">Stock Total</p>
                                <p className="text-2xl font-bold text-success">{totalStock.toLocaleString('es-ES')} L</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Capacidad Total</p>
                                <p className="text-2xl font-bold text-foreground">{totalCapacidad.toLocaleString('es-ES')} L</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Ocupación</p>
                                <p className="text-2xl font-bold text-foreground">{porcentajeTotal}%</p>
                            </div>
                        </div>

                        {/* Lista de Estanques */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            <p className="text-sm font-medium text-muted-foreground">
                                Detalle por Estanque ({data.estanquesData?.length || 0} estanques):
                            </p>
                            {(data.estanquesData || []).map((e, idx) => (
                                <div key={idx} className="p-4 bg-secondary/50 rounded-lg border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <p className="font-medium">{e.nombre}</p>
                                            <p className="text-xs text-muted-foreground">{e.ubicacion}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${e.estado === 'critico' ? 'bg-destructive/20 text-destructive' :
                                            e.estado === 'bajo' ? 'bg-warning/20 text-warning' :
                                                'bg-success/20 text-success'
                                            }`}>
                                            {e.estado}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                                        <div>
                                            <span className="text-muted-foreground">Stock:</span>
                                            <p className="font-bold">{e.stockActual.toLocaleString('es-ES')} L</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Capacidad:</span>
                                            <p className="font-medium">{e.capacidadTotal.toLocaleString('es-ES')} L</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Nivel:</span>
                                            <p className="font-medium">{Math.round((e.stockActual / e.capacidadTotal) * 100)}%</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${e.estado === 'critico' ? 'bg-destructive' :
                                                e.estado === 'bajo' ? 'bg-warning' :
                                                    'bg-success'
                                                }`}
                                            style={{ width: `${Math.min((e.stockActual / e.capacidadTotal) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'flota':
                const operativos = data.activosData?.filter(a => a.estado?.toLowerCase() === 'operativo') || [];
                const mantencion = data.activosData?.filter(a => {
                    const s = a.estado?.toLowerCase() || '';
                    return s === 'mantencion' || s === 'mantención';
                }) || [];
                const fueraServicio = data.activosData?.filter(a => a.estado?.toLowerCase() === 'fuera_servicio') || [];

                const renderVehiculoItem = (a: any, idx: number) => (
                    <div key={idx} className="p-3 bg-secondary/30 rounded border border-border/50 text-sm">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="font-bold text-primary">{a.id}</span>
                                <span className="text-xs text-muted-foreground">{a.categoria}</span>
                            </div>
                            <span className="font-medium">{a.nombre}</span>
                        </div>
                    </div>
                );

                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-primary border-b pb-2">
                            <Truck className="w-5 h-5" />
                            <h3 className="font-semibold text-lg">Estado de la Flota</h3>
                        </div>

                        {/* Operativos */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-success flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success"></span>
                                    OPERATIVOS ({operativos.length})
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {operativos.length > 0 ? (
                                    operativos.map(renderVehiculoItem)
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No hay vehículos operativos</p>
                                )}
                            </div>
                        </div>

                        {/* Mantención */}
                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-warning flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-warning"></span>
                                    EN MANTENCIÓN ({mantencion.length})
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {mantencion.length > 0 ? (
                                    mantencion.map(renderVehiculoItem)
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No hay vehículos en mantención</p>
                                )}
                            </div>
                        </div>

                        {/* Fuera Servicio */}
                        <div className="space-y-3 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-destructive flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-destructive"></span>
                                    FUERA DE SERVICIO ({fueraServicio.length})
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {fueraServicio.length > 0 ? (
                                    fueraServicio.map(renderVehiculoItem)
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">No hay vehículos fuera de servicio</p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalles</DialogTitle>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}

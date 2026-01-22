import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Fuel, Warehouse, Truck, History, Calendar, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonaActivityModalProps {
    open: boolean;
    onClose: () => void;
    type: 'consumos' | 'movimientos' | 'vehiculos' | null;
    personaName: string;
    data: {
        consumos: any[];
        movimientos: any[];
        vehiculos: any[];
    };
}

export function PersonaActivityModal({ open, onClose, type, personaName, data }: PersonaActivityModalProps) {
    if (!type) return null;

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Intl.DateTimeFormat('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'America/Santiago'
            }).format(new Date(dateString));
        } catch (e) {
            return dateString;
        }
    };

    const renderContent = () => {
        switch (type) {
            case 'consumos':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-accent">
                            <Fuel className="w-5 h-5" />
                            <h3 className="font-semibold text-lg">Historial de Cargas de Combustible</h3>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {data.consumos.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8 italic">No hay registros de consumo para esta persona.</p>
                            ) : (
                                data.consumos.map((c, idx) => (
                                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-foreground">{c.vehiculo}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Calendar className="w-3 h-3" /> {formatDateTime(c.fecha)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Estanque: {c.estanque}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-accent">{c.litrosUsados} L</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{c.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'movimientos':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Warehouse className="w-5 h-5" />
                            <h3 className="font-semibold text-lg">Movimientos de Almacén</h3>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {data.movimientos.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8 italic">No hay movimientos de almacén registrados.</p>
                            ) : (
                                data.movimientos.map((m, idx) => (
                                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        m.tipo === 'Entrada' ? "bg-success/20 text-success" :
                                                            m.tipo === 'Salida' ? "bg-destructive/20 text-destructive" :
                                                                "bg-blue-500/20 text-blue-500"
                                                    )}>
                                                        {m.tipo}
                                                    </span>
                                                    <p className="font-bold text-foreground">{m.productoNombre || 'Producto Desconocido'}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" /> {formatDateTime(m.fecha)}
                                                </div>
                                                {m.motivo && <p className="text-xs text-muted-foreground mt-1 italic">"{m.motivo}"</p>}
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-lg font-bold text-primary">{m.cantidad}</p>
                                                <p className="text-[10px] text-muted-foreground">{m.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'vehiculos':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Truck className="w-5 h-5" />
                            <h3 className="font-semibold text-lg">Vehículos Asignados</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {data.vehiculos.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8 italic">No tiene vehículos asignados como responsable.</p>
                            ) : (
                                data.vehiculos.map((v, idx) => (
                                    <div key={idx} className="p-4 bg-secondary/30 rounded-xl border border-border/50 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold">{v.marca} {v.modelo}</h4>
                                            <p className="text-sm text-accent font-mono">{v.id}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{v.tipo} • {v.kilometraje} km</p>
                                        </div>
                                        <div className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                                            v.estado === 'operativo' ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                                        )}>
                                            {v.estado}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>Actividad de {personaName}</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useQuery } from '@tanstack/react-query';
import { consumosApi, vehiculosApi, movimientosAlmacenApi } from '@/lib/apiService';
import {
    ChevronLeft,
    Fuel,
    Truck,
    Warehouse,
    TrendingUp,
    History,
    Calendar,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/dashboard/KPICard';
import { cn } from '@/lib/utils';
import type { Persona } from '@/types/persona';

interface PersonaDetailViewProps {
    persona: Persona;
    onBack: () => void;
}

export function PersonaDetailView({ persona, onBack }: PersonaDetailViewProps) {
    // Fetch related data for summary
    const { data: consumosResponse } = useQuery({
        queryKey: ['consumos'],
        queryFn: consumosApi.getAll
    });

    const { data: vehiculosResponse } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: vehiculosApi.getAll
    });

    const { data: movimientosResponse } = useQuery({
        queryKey: ['movimientos'],
        queryFn: movimientosAlmacenApi.getAll
    });

    // Cross-reference data - Use exact matching to avoid false positives
    // For consumos: check both 'empresa' (Conductor/Empresa field) and 'responsable'
    const misConsumos = (consumosResponse?.data || []).filter(c => {
        const nombrePersona = persona.nombreCompleto.toLowerCase().trim();
        const empresa = String(c.empresa || '').toLowerCase().trim();
        const responsable = String(c.responsable || '').toLowerCase().trim();

        // Exact match only
        return empresa === nombrePersona || responsable === nombrePersona;
    });

    // For vehiculos: check 'responsable' field
    const misVehiculos = (vehiculosResponse?.data || []).filter(v => {
        const nombrePersona = persona.nombreCompleto.toLowerCase().trim();
        const responsable = String(v.responsable || '').toLowerCase().trim();
        return responsable === nombrePersona;
    });

    // For movimientos: check 'responsable' field
    const misMovimientos = (movimientosResponse?.data || []).filter(m => {
        const nombrePersona = persona.nombreCompleto.toLowerCase().trim();
        const responsable = String(m.responsable || '').toLowerCase().trim();
        return responsable === nombrePersona;
    });

    const totalLitros = misConsumos.reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{persona.nombreCompleto}</h2>
                    <p className="text-muted-foreground">{persona.rol} en {persona.empresa}</p>
                </div>
            </div>

            {/* Quick Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Cargas Realizadas"
                    value={misConsumos.length.toString()}
                    icon={Fuel}
                    variant="default"
                />
                <KPICard
                    title="Litros Despachados"
                    value={totalLitros.toFixed(1)}
                    icon={TrendingUp}
                    variant="success"
                />
                <KPICard
                    title="Vehículos a Cargo"
                    value={misVehiculos.length.toString()}
                    icon={Truck}
                    variant="default"
                />
                <KPICard
                    title="Movimientos Almacén"
                    value={misMovimientos.length.toString()}
                    icon={Warehouse}
                    variant="default"
                />
            </div>

            {/* Detail Tabs */}
            <Tabs defaultValue="actividad" className="w-full">
                <TabsList className="bg-secondary/50 p-1">
                    <TabsTrigger value="actividad" className="gap-2">
                        <History className="w-4 h-4" /> Historial Actividad
                    </TabsTrigger>
                    <TabsTrigger value="vehiculos" className="gap-2">
                        <Truck className="w-4 h-4" /> Vehículos
                    </TabsTrigger>
                    <TabsTrigger value="inventario" className="gap-2">
                        <Warehouse className="w-4 h-4" /> Almacén
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="actividad" className="mt-6">
                    <div className="card-fuel rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Fuel className="w-5 h-5 text-accent" /> Últimas Cargas de Combustible
                        </h3>
                        {misConsumos.length === 0 ? (
                            <p className="text-muted-foreground italic text-center py-8">Sin registros de consumo.</p>
                        ) : (
                            <div className="space-y-4">
                                {misConsumos
                                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                    .map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                                    <Fuel className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{c.vehiculo}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {new Date(c.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-accent">{c.litrosUsados} L</p>
                                                <p className="text-xs text-muted-foreground">{c.estanque}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="vehiculos" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {misVehiculos.length === 0 ? (
                            <div className="col-span-2 text-muted-foreground italic text-center py-8 bg-secondary/20 rounded-xl border">
                                No tiene vehículos asignados como responsable.
                            </div>
                        ) : (
                            misVehiculos.map((v) => (
                                <div key={v.id} className="card-fuel p-4 rounded-xl border border-border flex items-center gap-4">
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
                </TabsContent>

                <TabsContent value="inventario" className="mt-6">
                    <div className="card-fuel rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Warehouse className="w-5 h-5 text-accent" /> Movimientos de Almacén realizados
                        </h3>
                        {misMovimientos.length === 0 ? (
                            <p className="text-muted-foreground italic text-center py-8">Sin movimientos de inventario.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                                        <th className="py-2 text-left">Fecha</th>
                                        <th className="py-2 text-left">Producto</th>
                                        <th className="py-2 text-center">Tipo</th>
                                        <th className="py-2 text-right">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {misMovimientos
                                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                        .map((m) => (
                                            <tr key={m.id} className="hover:bg-primary/5">
                                                <td className="py-3 text-xs">{new Date(m.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                                <td className="py-3 font-medium">{m.productoNombre}</td>
                                                <td className="py-3 text-center">
                                                    <span className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                        m.tipo === 'entrada' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                                    )}>
                                                        {m.tipo}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right font-bold">{m.cantidad} {m.unidad}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

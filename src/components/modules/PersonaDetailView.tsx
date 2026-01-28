import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consumosApi, vehiculosApi, movimientosAlmacenApi, productosAlmacenApi } from '@/lib/apiService';
import {
    ChevronLeft,
    Fuel,
    Truck,
    Warehouse,
    TrendingUp,
    History,
    Calendar,
    Target,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { actasApi } from '@/lib/apiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/dashboard/KPICard';
import { cn } from '@/lib/utils';
import { PersonaActivityModal } from './PersonaActivityModal';
import type { Persona } from '@/types/crm';

interface PersonaDetailViewProps {
    persona: Persona;
    onBack: () => void;
}

export function PersonaDetailView({ persona, onBack }: PersonaDetailViewProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('actividad');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'consumos' | 'movimientos' | 'vehiculos' | null>(null);

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

    // Fetch products as fallback
    const { data: productosResponse } = useQuery({
        queryKey: ['productos'],
        queryFn: productosAlmacenApi.getAll
    });

    // Helper functions for matching
    const matchesPersona = (fieldValue: string | undefined) => {
        if (!fieldValue) return false;
        const value = String(fieldValue).toLowerCase().trim();
        const nombre = persona.nombreCompleto?.toLowerCase().trim();
        const id = persona.id?.toLowerCase().trim();
        return value === nombre || value === id;
    };

    // Filter data
    const misConsumos = (consumosResponse?.data || []).filter(c =>
        matchesPersona(c.empresa) || matchesPersona(c.responsable)
    );

    const misVehiculos = (vehiculosResponse?.data || []).filter(v =>
        matchesPersona(v.responsable)
    );

    const misMovimientos = (movimientosResponse?.data || []).filter(m =>
        matchesPersona(m.responsable)
    );

    const totalLitros = misConsumos.reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

    const handleKPIClick = (type: 'consumos' | 'movimientos' | 'vehiculos') => {
        setModalType(type);
        setModalOpen(true);
    };

    // Helper for product name lookup
    const getProductName = (m: any) => {
        if (m.productoNombre) return m.productoNombre;
        const producto = productosResponse?.data?.find((p: any) => String(p.id) === String(m.productoId));
        return producto ? producto.nombre : 'Producto desconocido';
    };


    // Date formatting helper
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Intl.DateTimeFormat('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Santiago'
            }).format(new Date(dateString));
        } catch (e) {
            return '-';
        }
    };

    // Date time formatting helper
    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        // Manual parsing to handle "dd-MM-yyyy HH:mm" correctly (as local time or specified time)
        // If it comes as standard ISO from backend, we might want to just parse it.
        // But if it comes as "22-01-2026 15:00", we should treat it as 15:00.
        try {
            if (typeof dateString === 'string' && dateString.includes('-') && dateString.includes(':')) {
                // Try parse custom format "dd-MM-yyyy HH:mm"
                const [datePart, timePart] = dateString.split(' ');
                if (datePart && timePart) {
                    const [day, month, year] = datePart.split('-').map(Number);
                    const [hour, minute] = timePart.split(':').map(Number);
                    // Return reconstructed string to ensure it displays exactly what was received (no timezone shift)
                    return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                }
            }

            // Fallback for standard ISO strings or other formats
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
            return dateString || '-';
        }
    };

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
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-accent text-accent hover:bg-accent/10"
                        onClick={async () => {
                            // Encontrar un activo a cargo para ejemplo o pedir selección
                            // Por ahora, generamos una general para la persona
                            const res = await actasApi.generateCargo({
                                responsable: persona.nombreCompleto,
                                cargo: persona.rol,
                                empresa: persona.empresa,
                                fecha: new Date().toISOString()
                            });
                            if (res.success) {
                                toast({ title: "✅ Hoja de Cargo Generada", description: res.data.message || "El documento ha sido registrado en el sistema." });
                            } else {
                                toast({ variant: "destructive", title: "❌ Error", description: res.message });
                            }
                        }}
                    >
                        <FileText className="w-4 h-4" />
                        GENERAR HOJA DE CARGO
                    </Button>
                </div>
            </div>

            {/* Quick Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Cargas Realizadas"
                    value={misConsumos.length.toString()}
                    icon={Fuel}
                    variant="default"
                    onClick={() => handleKPIClick('consumos')}
                />
                <KPICard
                    title="Litros Despachados"
                    value={totalLitros.toFixed(1)}
                    icon={TrendingUp}
                    variant="success"
                    onClick={() => handleKPIClick('consumos')}
                />
                <KPICard
                    title="Vehículos a Cargo"
                    value={misVehiculos.length.toString()}
                    icon={Truck}
                    variant="default"
                    onClick={() => handleKPIClick('vehiculos')}
                />
                <KPICard
                    title="Movimientos Almacén"
                    value={misMovimientos.length.toString()}
                    icon={Warehouse}
                    variant="default"
                    onClick={() => handleKPIClick('movimientos')}
                />
            </div>

            {/* Modal de Detalles de Actividad */}
            <PersonaActivityModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                type={modalType}
                personaName={persona.nombreCompleto}
                data={{
                    consumos: misConsumos,
                    movimientos: misMovimientos,
                    vehiculos: misVehiculos
                }}
            />


            {/* Detail Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                                        <Calendar className="w-3 h-3" /> {formatDateTime(c.fecha)}
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                                            <th className="py-2 text-left">Fecha</th>
                                            <th className="py-2 text-left">Producto</th>
                                            <th className="py-2 text-left">Motivo/Obs</th>
                                            <th className="py-2 text-center">Tipo</th>
                                            <th className="py-2 text-right">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {misMovimientos
                                            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                            .map((m) => (
                                                <tr key={m.id} className="hover:bg-primary/5">
                                                    <td className="py-3 text-xs whitespace-nowrap">{formatDateTime(m.fecha)}</td>
                                                    <td className="py-3 font-medium">{getProductName(m)}</td>
                                                    <td className="py-3 text-muted-foreground text-xs">{m.motivo || m.observaciones || '-'}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                            m.tipo === 'Entrada' ? "bg-success/10 text-success" :
                                                                m.tipo === 'Salida' ? "bg-destructive/10 text-destructive" :
                                                                    "bg-blue-500/10 text-blue-500"
                                                        )}>
                                                            {m.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right font-bold">{m.cantidad}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

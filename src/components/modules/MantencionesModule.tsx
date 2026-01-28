import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mantencionesApi, vehiculosApi, auditoriaApi } from '@/lib/apiService';
import { useApi } from '@/hooks/useApi';
import { MantencionForm, MantencionFormData } from '@/components/forms/MantencionForm';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { speakSuccess } from '@/utils/voiceNotification';

export function MantencionesModule() {
    const { canEdit, isAdmin, user } = useAuth();
    const { execute, loading: isActionLoading } = useApi();

    // Helper function to safely format dates
    const formatSafeDate = (dateString: string | null | undefined) => {
        if (!dateString || dateString === '' || dateString === '-') return '-';
        try {
            // If it's already a formatted string like DD-MM-YYYY, try to return it or reformat
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Try to handle DD-MM-YYYY format manually if new Date fails
                const parts = dateString.split(/[-/]/);
                if (parts.length === 3) {
                    // Assume DD-MM-YYYY or YYYY-MM-DD
                    if (parts[0].length === 4) return dateString; // YYYY-MM-DD
                    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
                }
                return dateString;
            }

            return new Intl.DateTimeFormat('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Santiago'
            }).format(date);
        } catch {
            return dateString || '-';
        }
    };
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [editingMantencion, setEditingMantencion] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Data Fetching
    const { data: mantencionesResponse, isLoading: loadingMantenciones } = useQuery({
        queryKey: ['mantenciones'],
        queryFn: mantencionesApi.getAll,
    });

    const { data: vehiculosResponse } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: vehiculosApi.getAll,
    });

    const parseDateForSort = (d: any) => {
        if (!d) return 0;
        if (d instanceof Date) return d.getTime();
        const str = String(d);
        // Handle DD/MM/YYYY HH:mm
        const parts = str.split(/[\s/:-]/);
        if (parts.length >= 3) {
            if (parts[0].length === 4) return new Date(str).getTime(); // YYYY-MM-DD
            // DD MM YYYY [HH mm]
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            const hour = parts[3] ? parseInt(parts[3]) : 0;
            const min = parts[4] ? parseInt(parts[4]) : 0;
            return new Date(year, month, day, hour, min).getTime();
        }
        return new Date(str).getTime() || 0;
    };

    const mantenciones = (mantencionesResponse?.data || []).sort((a: any, b: any) => {
        return parseDateForSort(b.fechaIngreso) - parseDateForSort(a.fechaIngreso);
    });
    const vehiculos = vehiculosResponse?.data || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: mantencionesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mantenciones'] });
            // Invalidate vehicles to update mileage if changed
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
            toast({ title: "✅ Mantención registrada", description: "El registro ha sido guardado exitosamente." });
            speakSuccess();
            setIsFormOpen(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message || "Error al registrar mantención." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MantencionFormData> }) => mantencionesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mantenciones'] });
            queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
            toast({ title: "✅ Mantención actualizada", description: "Los cambios se han guardado." });
            speakSuccess();
            setIsFormOpen(false);
            setEditingMantencion(null);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message || "Error al actualizar mantención." });
        }
    });


    const deleteMutation = useMutation({
        mutationFn: ({ id, justification }: { id: string, justification: string }) =>
            mantencionesApi.delete(id, { justificacion: justification }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mantenciones'] });
            toast({ title: "✅ Mantención eliminada", description: "El registro ha sido eliminado." });
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message || "Error al eliminar mantención." });
        }
    });

    // Handlers
    const handleNuevo = () => {
        setEditingMantencion(null);
        setIsFormOpen(true);
    };

    const handleEdit = (mantencion: any) => {
        setEditingMantencion(mantencion);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async (justification: string) => {
        if (!idToDelete) return;

        if (!isAdmin) {
            // Flow for non-admins: Send a deletion request
            const mantencion = mantenciones.find(m => m.id === idToDelete);
            const mName = mantencion ? `${mantencion.vehiculo} - ${mantencion.tipoMantencion}` : idToDelete;

            await execute(
                auditoriaApi.create({
                    modulo: 'Mantenciones',
                    accion: 'solicitud_eliminacion',
                    mensaje: `Solicitud de eliminación de Mantención: ${mName} (ID: ${idToDelete})`,
                    tipo: 'warning',
                    usuario: user?.email || 'Usuario',
                    justificacion: justification
                }),
                {
                    successMessage: "Solicitud de eliminación enviada para aprobación del administrador.",
                    onSuccess: () => {
                        setIsDeleteDialogOpen(false);
                        setIdToDelete(null);
                    }
                }
            );
        } else {
            // Flow for admins: Direct deletion
            await deleteMutation.mutateAsync({ id: idToDelete, justification });
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const handleSubmit = async (data: MantencionFormData) => {
        if (editingMantencion) {
            await updateMutation.mutateAsync({ id: editingMantencion.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    // Logic for Alerts: Vehicles where (ProximaMantencion - kmActual) < 1000
    const vehiclesWithAlerts = vehiculos.filter((v: any) => {
        // Find latest maintenance for this vehicle to get 'proximaMantencionKm'
        // Actually, vehicles sheet might not have 'proximaMantencionKm' unless updated.
        // Let's rely on finding it in the mantenciones list (latest one by date?)
        // OR, better, we simply check 'mantenciones' list for "Pending" items or items where 'proximaMantencionKm' is close.
        // But 'vehiculos' (v) has 'kmActual' usually from fuel loads.

        // Simplification: Check 'mantenciones' where 'proximaMantencionKm' exists and compare with v.kilometraje
        return false; // Placeholder until logic is refined below
    });

    // Better Logic: Iterate Mantenciones to find the Next Target for each vehicle
    // Filter only the LATEST record per vehicle? 
    // For simplicity MVP: Identify pending or agendada maintenances.

    // ALERTS based on user requirements: "mantenimiento por el km alcanzado"
    // We need to compare specific vehicle mileage vs target.
    const maintenanceAlerts = vehiculos.map((v: any) => {
        // Find the last completed maintenance for this vehicle that has a target
        const vehicleMaintenances = mantenciones
            .filter((m: any) => m.vehiculo === v.id && (m.proximaMantencionKm || m.proximaMantencionFecha))
            .sort((a: any, b: any) => {
                // Prioritize by date if available, then by KM
                const dateA = a.fechaIngreso ? new Date(a.fechaIngreso).getTime() : 0;
                const dateB = b.fechaIngreso ? new Date(b.fechaIngreso).getTime() : 0;
                return dateB - dateA;
            });

        const lastMantencion = vehicleMaintenances[0];

        if (lastMantencion) {
            // Mileage alert
            if (lastMantencion.proximaMantencionKm && v.kilometraje) {
                const dist = lastMantencion.proximaMantencionKm - v.kilometraje;
                if (dist <= 0) return { vehicle: v, type: 'critical', reason: 'KM Excedido', dist: Math.abs(dist), target: lastMantencion.proximaMantencionKm };
                if (dist <= 1000) return { vehicle: v, type: 'warning', reason: 'KM Próximo', dist, target: lastMantencion.proximaMantencionKm };
            }

            // Date alert
            if (lastMantencion.proximaMantencionFecha) {
                const targetDate = new Date(lastMantencion.proximaMantencionFecha);
                const today = new Date();
                const diffTime = targetDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) return { vehicle: v, type: 'critical', reason: 'Fecha Vencida', days: Math.abs(diffDays), targetDate: lastMantencion.proximaMantencionFecha };
                if (diffDays <= 7) return { vehicle: v, type: 'warning', reason: 'Fecha Próxima', days: diffDays, targetDate: lastMantencion.proximaMantencionFecha };
            }
        }
        return null;
    }).filter(Boolean);


    if (loadingMantenciones) return <div>Cargando mantenciones...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Control de Mantenciones</h2>
                    <p className="text-muted-foreground">Registro de servicios, reparaciones y alertas de kilometraje.</p>
                </div>
                {canEdit && (
                    <Button onClick={handleNuevo} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Nueva Mantención
                    </Button>
                )}
            </div>

            {/* ALERTS SECTION */}
            {maintenanceAlerts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {maintenanceAlerts.map((alert: any, idx: number) => (
                        <Card key={idx} className={cn("border-l-4", alert.type === 'critical' ? "border-l-critical" : "border-l-warning")}>
                            <CardHeader className="py-2 pb-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle className={cn("w-4 h-4", alert.type === 'critical' ? "text-critical" : "text-warning")} />
                                    {alert.vehicle.id}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 text-xs text-muted-foreground">
                                <p>Km Actual: {alert.vehicle.kilometraje?.toLocaleString() || '0'}</p>
                                {alert.target && (
                                    <p>Próxima Mantención (KM): {alert.target.toLocaleString()}</p>
                                )}
                                {alert.targetDate && (
                                    <p>Próxima Mantención (Fecha): {formatSafeDate(alert.targetDate)}</p>
                                )}
                                <p className={cn("font-bold mt-1", alert.type === 'critical' ? "text-critical" : "text-warning")}>
                                    {alert.reason}: {
                                        alert.dist !== undefined
                                            ? (alert.type === 'critical' ? `Excedido por ${alert.dist.toLocaleString()} km` : `Faltan ${alert.dist.toLocaleString()} km`)
                                            : (alert.type === 'critical' ? `Vencido hace ${alert.days} días` : `Faltan ${alert.days} días`)
                                    }
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="card-fuel p-6 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-4">
                    <Wrench className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Historial de Servicios</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-2">Fecha</th>
                                <th className="px-4 py-2">Vehículo</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Estado</th>
                                <th className="px-4 py-2">KM Mant.</th>
                                <th className="px-4 py-2">Próx. KM</th>
                                <th className="px-4 py-2">Taller</th>
                                <th className="px-4 py-2">Costo</th>
                                <th className="px-4 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {mantenciones.map((m: any) => (
                                <tr key={m.id} className="hover:bg-secondary/10">
                                    <td className="px-4 py-3 font-medium">
                                        {formatSafeDate(m.fechaIngreso)}
                                    </td>
                                    <td className="px-4 py-3 font-bold">{m.vehiculo}</td>
                                    <td className="px-4 py-3">{m.tipoMantencion}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                                            m.estado === 'Completada' ? "bg-success/10 text-success" :
                                                m.estado === 'En Proceso' ? "bg-critical/10 text-critical" :
                                                    "bg-warning/10 text-warning"
                                        )}>
                                            {m.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{m.kmActual?.toLocaleString()} km</td>
                                    <td className="px-4 py-3 font-medium text-primary">
                                        {m.proximaMantencionKm ? `${Number(m.proximaMantencionKm).toLocaleString()} km` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs">{m.taller}</td>
                                    <td className="px-4 py-3">${m.costo?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2 px-2">
                                            {canEdit && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-9 w-9 text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400 hover:text-blue-300 transition-all duration-300 shadow-sm"
                                                        onClick={() => handleEdit(m)}
                                                        title="Editar Mantención"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-9 w-9 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-600 transition-all duration-300 shadow-sm"
                                                        onClick={() => handleDelete(m.id)}
                                                        title="Eliminar Mantención"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {mantenciones.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                                        No hay registros de mantenciones.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <MantencionForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingMantencion(null);
                }}
                onSubmit={handleSubmit}
                initialData={editingMantencion}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
            {/* Confirmation Dialog */}
            <ConfirmDeleteWithJustificationDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                isLoading={deleteMutation.isPending || isActionLoading}
                title="¿Eliminar Mantención?"
                description="Esta acción eliminará el registro de mantención. Se requiere una justificación."
                itemName={idToDelete || undefined}
                isAdmin={isAdmin}
                isCritical={true}
            />
        </div>
    );
}

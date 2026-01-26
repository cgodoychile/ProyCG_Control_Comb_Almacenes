import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiculosApi, auditoriaApi } from '@/lib/apiService';
import { VehiculoForm } from '@/components/forms/VehiculoForm';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Edit, Trash2, Car, Calendar, Gauge } from 'lucide-react';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { speakSuccess } from '@/utils/voiceNotification';
import { useApi } from '@/hooks/useApi';
import type { Vehiculo } from '@/types/crm';

export function VehiculosModule() {
    const { canEdit, isAdmin, user } = useAuth(); // Auth

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const [editingVehiculo, setEditingVehiculo] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Data Fetching
    const { data: vehiculosResponse, isLoading: loadingVehiculos } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: vehiculosApi.getAll
    });

    const vehiculosData = vehiculosResponse?.data || [];

    // Calculate Maintenance Alerts
    const today = new Date();
    const nextWeek = addDays(today, 7);

    const mantencionesProximasFecha = vehiculosData.filter(v => {
        if (!v.proximaMantencion) return false;
        const prox = new Date(v.proximaMantencion);
        return isBefore(prox, nextWeek) && v.estado !== 'mantencion';
    }).length;

    const mantencionesProximasKm = vehiculosData.filter(v => {
        if (!v.proximaMantencionKm || !v.kilometraje) return false;
        const diff = v.proximaMantencionKm - v.kilometraje;
        return diff > 0 && diff <= 1000 && v.estado !== 'mantencion';
    }).length;

    const { execute, loading: isActionLoading } = useApi();

    const handleCreate = async (data: Partial<Vehiculo>) => {
        await execute(vehiculosApi.create(data), {
            successMessage: "Vehículo registrado correctamente.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
                speakSuccess();
                setIsFormOpen(false);
            }
        });
    };

    const handleUpdate = async (id: string, data: Partial<Vehiculo>) => {
        await execute(vehiculosApi.update(id, data), {
            successMessage: "Vehículo actualizado correctamente.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
                speakSuccess();
                setIsFormOpen(false);
                setEditingVehiculo(null);
            }
        });
    };

    const handleDeleteAction = async (id: string, justification: string) => {
        await execute(vehiculosApi.delete(id, { justificacion: justification }), {
            successMessage: "Vehículo eliminado correctamente.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['vehiculos'] });
                setIsDeleteDialogOpen(false);
                setVehicleToDelete(null);
            }
        });
    };

    // Handlers
    const handleNuevoVehiculo = () => {
        setEditingVehiculo(null);
        setIsFormOpen(true);
    };

    const handleEdit = (vehiculo: any) => {
        setEditingVehiculo(vehiculo);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setVehicleToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async (justification: string) => {
        if (!vehicleToDelete) return;

        // Flow for EVERYONE: Send a deletion request
        const vehiculo = vehiculosData.find(v => v.id === vehicleToDelete);
        const vehName = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.id})` : vehicleToDelete;

        await execute(
            auditoriaApi.create({
                modulo: 'Vehículos',
                accion: 'solicitud_eliminacion',
                mensaje: JSON.stringify({
                    entity: 'vehiculos',
                    id: vehicleToDelete,
                    name: vehName,
                    justification: justification
                }),
                tipo: 'warning',
                usuario: user?.email || 'Usuario',
                justificacion: justification
            }),
            {
                successMessage: "Solicitud de eliminación enviada para aprobación del administrador.",
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setVehicleToDelete(null);
                    queryClient.invalidateQueries({ queryKey: ['activity-alerts'] });
                }
            }
        );
    };

    const handleSubmit = (data: Partial<Vehiculo>) => {
        if (editingVehiculo) {
            handleUpdate(editingVehiculo.id, data);
        } else {
            handleCreate(data);
        }
    };

    if (loadingVehiculos) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando vehículos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con Botón Permanente */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Vehículos</h2>
                    <p className="text-muted-foreground">Gestión de flota y mantenimientos</p>
                </div>
                {canEdit && (
                    <Button
                        size="sm"
                        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={handleNuevoVehiculo}
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Vehículo
                    </Button>
                )}
            </div>

            {/* Dashboard de Mantenimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Vehículos"
                    value={vehiculosData.length.toString()}
                    icon={Car}
                    variant="default"
                />
                <KPICard
                    title="Próx. Mantención (7d)"
                    value={mantencionesProximasFecha.toString()}
                    icon={Calendar}
                    variant={mantencionesProximasFecha > 0 ? "warning" : "default"}
                    subtitle="Alertas por fecha"
                />
                <KPICard
                    title="Próx. Mantención (1k km)"
                    value={mantencionesProximasKm.toString()}
                    icon={Gauge}
                    variant={mantencionesProximasKm > 0 ? "warning" : "default"}
                    subtitle="Alertas por kilometraje"
                />
            </div>

            {/* Vehicles Table */}
            {
                vehiculosData.length === 0 ? (
                    <div className="card-fuel p-12 rounded-xl border border-border text-center">
                        <Car className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground mb-4">No hay vehículos registrados</p>
                        {canEdit && (
                            <Button
                                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                                onClick={handleNuevoVehiculo}
                            >
                                <Plus className="w-4 h-4" />
                                Crear Primer Vehículo
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="card-fuel rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patente</th>
                                        <th>Marca/Modelo</th>
                                        <th>Año</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Kilometraje</th>
                                        <th>Últ. Mantención</th>
                                        <th>Próx. Mantención</th>
                                        <th>Responsable</th>
                                        <th>Ubicación</th>
                                        {canEdit && <th>Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...vehiculosData].reverse().map((vehiculo) => (
                                        <tr key={vehiculo.id}>
                                            {/* ... columns ... */}
                                            <td>
                                                <span className="font-mono bg-secondary px-2 py-1 rounded text-sm font-bold">
                                                    {vehiculo.id}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <p className="font-medium">{vehiculo.marca}</p>
                                                    <p className="text-sm text-muted-foreground">{vehiculo.modelo}</p>
                                                </div>
                                            </td>
                                            <td>{vehiculo.anio}</td>
                                            <td>
                                                <span className="text-sm bg-secondary px-2 py-1 rounded">
                                                    {vehiculo.tipo}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-medium",
                                                    vehiculo.estado?.toLowerCase() === 'operativo' && "bg-success/20 text-success",
                                                    (vehiculo.estado?.toLowerCase() === 'mantencion' || vehiculo.estado?.toLowerCase() === 'mantención') && "bg-warning/20 text-warning",
                                                    vehiculo.estado?.toLowerCase() === 'fuera_servicio' && "bg-destructive/20 text-destructive"
                                                )}>
                                                    {vehiculo.estado?.toLowerCase() === 'operativo' && 'Operativo'}
                                                    {(vehiculo.estado?.toLowerCase() === 'mantencion' || vehiculo.estado?.toLowerCase() === 'mantención') && 'Mantención'}
                                                    {vehiculo.estado?.toLowerCase() === 'fuera_servicio' && 'Fuera Servicio'}
                                                </span>
                                            </td>
                                            <td className="font-mono">{vehiculo.kilometraje?.toLocaleString()} km</td>
                                            <td>
                                                {vehiculo.ultimaMantencion ?
                                                    format(new Date(vehiculo.ultimaMantencion), 'dd/MM/yyyy', { locale: es }) :
                                                    '-'
                                                }
                                            </td>
                                            <td>
                                                {vehiculo.proximaMantencion ?
                                                    format(new Date(vehiculo.proximaMantencion), 'dd/MM/yyyy', { locale: es }) :
                                                    '-'
                                                }
                                            </td>
                                            <td>{vehiculo.responsable}</td>
                                            <td>{vehiculo.ubicacion}</td>
                                            {canEdit && (
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEdit(vehiculo)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDelete(vehiculo.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Form Dialog */}
            <VehiculoForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingVehiculo(null);
                }}
                onSubmit={handleSubmit}
                initialData={editingVehiculo}
                isLoading={isActionLoading}
            />
            {/* Confirmation Dialog */}
            <ConfirmDeleteWithJustificationDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                isLoading={isActionLoading}
                title="¿Eliminar vehículo?"
                description={`Esta acción no se puede deshacer. Se requiere una justificación.`}
                itemName={vehiculosData.find(v => v.id === vehicleToDelete)?.id || vehicleToDelete || undefined}
                isAdmin={isAdmin}
                isCritical={true}
            />
        </div >
    );
}

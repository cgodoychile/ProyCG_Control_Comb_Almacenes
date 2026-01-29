import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { estanquesApi, cargasApi, agendamientosApi, auditoriaApi } from '@/lib/apiService';
import { EstanqueForm } from '@/components/forms/EstanqueForm';
import { CargaForm } from '@/components/forms/CargaForm';
import { TankStatus } from '@/components/dashboard/TankStatus';
import { cn, getLocalDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Loader2, Edit, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { es } from 'date-fns/locale';
import { format, isAfter, parseISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { speakSuccess } from '@/utils/voiceNotification';
import { useApi } from '@/hooks/useApi';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';
import type { Estanque, CargaEstanque } from '@/types/crm';

export function EstanquesModule() {
  const { canEdit, isAdmin, user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstanque, setEditingEstanque] = useState<any>(null);
  const [isCargaFormOpen, setIsCargaFormOpen] = useState(false);
  const [selectedEstanqueForCarga, setSelectedEstanqueForCarga] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [agendamientoToConfirm, setAgendamientoToConfirm] = useState<any>(null);
  const [numeroGuia, setNumeroGuia] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [confirmPrice, setConfirmPrice] = useState<number>(0);
  const [confirmTotal, setConfirmTotal] = useState<number>(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data Fetching
  const { data: estanquesResponse, isLoading: loadingEstanques } = useQuery({
    queryKey: ['estanques'],
    queryFn: estanquesApi.getAll,
    refetchInterval: 30000,
  });

  const { data: cargasResponse, isLoading: loadingCargas } = useQuery({
    queryKey: ['cargas'],
    queryFn: cargasApi.getAll,
    refetchInterval: 30000,
  });

  const { data: agendamientosResponse, isLoading: loadingAgendamientos } = useQuery({
    queryKey: ['agendamientos'],
    queryFn: agendamientosApi.getAll,
    refetchInterval: 30000,
  });

  const estanquesData = estanquesResponse?.data || [];
  const cargasData = cargasResponse?.data || [];
  const agendamientosData = agendamientosResponse?.data || [];

  const { execute, loading: isActionLoading } = useApi();

  const handleCreate = async (data: Partial<Estanque>) => {
    await execute(estanquesApi.create(data), {
      successMessage: "Estanque registrado correctamente.",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['estanques'] });
        speakSuccess();
        setIsFormOpen(false);
      }
    });
  };

  const handleUpdate = async (id: string, data: Partial<Estanque>) => {
    await execute(estanquesApi.update(id, data), {
      successMessage: "Estanque actualizado correctamente.",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['estanques'] });
        speakSuccess();
        setIsFormOpen(false);
        setEditingEstanque(null);
      }
    });
  };

  const handleDeleteAction = async (id: string, justification: string) => {
    await execute(estanquesApi.delete(id, { justificacion: justification }), {
      successMessage: "Estanque eliminado correctamente.",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['estanques'] });
        setIsDeleteDialogOpen(false);
        setDeleteTargetId(null);
      }
    });
  };

  const handleCargaAction = async (data: any) => {
    if (data.tipo === 'programada') {
      const isEditing = !!selectedEstanqueForCarga?.id;
      const apiCall = isEditing
        ? agendamientosApi.update(selectedEstanqueForCarga.id, data)
        : agendamientosApi.create(data);

      await execute(apiCall, {
        successMessage: isEditing ? "Agendamiento actualizado." : "Carga agendada correctamente.",
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['agendamientos'] });
          speakSuccess();
          setIsCargaFormOpen(false);
          setSelectedEstanqueForCarga(null);
        }
      });
    } else {
      // Real load logic
      await execute(cargasApi.create(data), {
        successMessage: "Carga registrada y stock actualizado.",
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['estanques'] });
          queryClient.invalidateQueries({ queryKey: ['cargas'] });
          speakSuccess();
          setIsCargaFormOpen(false);
          setSelectedEstanqueForCarga(null);
        }
      });
    }
  };

  const handleDeleteAgendamiento = async (id: string) => {
    await execute(agendamientosApi.delete(id), {
      successMessage: "Agendamiento eliminado correctamente.",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['agendamientos'] });
      }
    });
  };

  // Handlers
  const handleNuevoEstanque = () => {
    setEditingEstanque(null);
    setIsFormOpen(true);
  };

  const handleEdit = (estanque: any) => {
    setEditingEstanque(estanque);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async (justification: string) => {
    if (!deleteTargetId) return;

    // If Admin, delete directly. If not, send request.
    if (isAdmin) {
      await handleDeleteAction(deleteTargetId, justification);
    } else {
      const estanque = estanquesData.find((e: any) => e.id === deleteTargetId);
      const estanqueName = estanque ? estanque.nombre : deleteTargetId;

      await execute(
        auditoriaApi.create({
          modulo: 'Estanques',
          accion: 'solicitud_eliminacion',
          mensaje: JSON.stringify({
            entity: 'estanques',
            id: deleteTargetId,
            name: estanqueName,
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
            setDeleteTargetId(null);
            queryClient.invalidateQueries({ queryKey: ['activity-alerts'] });
          }
        }
      );
    }
  };

  const handleSubmit = (data: Partial<Estanque>) => {
    if (editingEstanque) {
      handleUpdate(editingEstanque.id, data);
    } else {
      handleCreate(data);
    }
  };

  const handleAgendarCarga = (estanque: any) => {
    setSelectedEstanqueForCarga({
      estanque: estanque.nombre,
      tipo: 'programada',
      fecha: new Date().toISOString().split('T')[0],
      fechaProgramada: new Date().toISOString().split('T')[0],
      proveedor: 'COPEC',
      responsable: 'Admin',
    });
    setIsCargaFormOpen(true);
  };

  const handleEditAgendamiento = (carga: any) => {
    setSelectedEstanqueForCarga({
      ...carga,
      fecha: carga.fecha ? carga.fecha.split('T')[0] : '',
    });
    setIsCargaFormOpen(true);
  };

  const handleCargaSubmit = async (data: any) => {
    if (selectedEstanqueForCarga?.id && selectedEstanqueForCarga?.tipo === 'programada') {
      // We are editing an existing scheduled load
      handleCargaAction(data); // In a real scenario, this might need an updateAgendamiento call, but for now we unify
    } else {
      handleCargaAction(data);
    }
  };

  const handleConfirmarCargaComprometida = (carga: any) => {
    console.log('🔔 Confirmar Arribo clicked for:', carga);
    setAgendamientoToConfirm(carga);
    setNumeroGuia('');
    setConfirmPrice(0);
    setConfirmTotal(0);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!numeroGuia.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un número de guía o factura.",
        variant: "destructive"
      });
      return;
    }

    const cargaOriginal = agendamientoToConfirm;

    // Clean payload for real carga: only send business data, no IDs or program metadata
    const payload = {
      fecha: getLocalDate(),
      tipo: 'real',
      fechaProgramada: cargaOriginal.fechaProgramada || '',
      numeroGuia: numeroGuia,
      estanque: cargaOriginal.estanque,
      proveedor: cargaOriginal.proveedor,
      litros: Number(cargaOriginal.litros) || 0,
      responsable: (user as any)?.name || (user as any)?.nombre || 'Admin', // Support both name formats with type cast
      patenteCamion: cargaOriginal.patenteCamion || '',
      tipoCombustible: cargaOriginal.tipoCombustible || '',
      conductor: cargaOriginal.conductor || '',
      precioUnitario: confirmPrice,
      precioTotal: confirmTotal,
      observaciones: `Carga arribada desde agendamiento. ${cargaOriginal.observaciones || ''}`
    };

    try {
      await execute(cargasApi.create(payload as any), {
        successMessage: "Carga confirmada y stock actualizado.",
        onSuccess: async () => {
          try {
            // Delete agendamiento
            await agendamientosApi.delete(cargaOriginal.id);

            // Critical: reload everything to sync
            queryClient.invalidateQueries({ queryKey: ['estanques'] });
            queryClient.invalidateQueries({ queryKey: ['cargas'] });
            queryClient.invalidateQueries({ queryKey: ['agendamientos'] });

            setIsConfirmDialogOpen(false);
            setAgendamientoToConfirm(null);
            setNumeroGuia('');
          } catch (error: any) {
            queryClient.invalidateQueries({ queryKey: ['cargas'] });
            setIsConfirmDialogOpen(false);
          }
        }
      });
    } catch (error) {
      console.error('❌ Error confirmando carga:', error);
    }
  };




  // Sort agendamientos by date descending (newest first)
  const scheduledCargas = [...agendamientosData].sort((a: any, b: any) => {
    const dateA = a.fechaProgramada ? new Date(a.fechaProgramada).getTime() : 0;
    const dateB = b.fechaProgramada ? new Date(b.fechaProgramada).getTime() : 0;
    return dateB - dateA;
  });

  const formatDateLabel = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  if (loadingEstanques || loadingCargas || loadingAgendamientos) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando datos...</span>
      </div>
    );
  }

  // Calculate Summary Stats
  const totalCapacity = estanquesData.reduce((sum: number, e: any) => sum + (e.capacidadTotal || 0), 0);
  const totalStock = estanquesData.reduce((sum: number, e: any) => sum + (e.stockActual || 0), 0);
  const availabilityPercentage = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gestión de Estanques</h2>
          <p className="text-muted-foreground">Supervisión de niveles de combustible, mantenimiento y registros de carga.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              size="sm"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleNuevoEstanque}
            >
              <Plus className="w-4 h-4" />
              Nuevo Estanque
            </Button>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capacidad Total</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{totalCapacity.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">Litros</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Actual</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{totalStock.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">Litros</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Disponibilidad Global</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">{availabilityPercentage.toFixed(1)}%</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  availabilityPercentage < 20 ? "bg-critical" :
                    availabilityPercentage < 40 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tanks Grid */}
      {
        estanquesData.length === 0 ? (
          <div className="card-fuel p-12 rounded-xl border border-border text-center">
            <p className="text-muted-foreground">No hay estanques registrados</p>
            {canEdit && (
              <Button
                className="mt-4 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleNuevoEstanque}
              >
                <Plus className="w-4 h-4" />
                Crear Primer Estanque
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estanquesData.map((estanque: any) => (
              <div key={estanque.id} className="relative">
                <TankStatus estanque={estanque} />
                {canEdit && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
                      onClick={() => handleEdit(estanque)}
                      title="Editar estanque"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
                      onClick={() => handleDelete(estanque.id)}
                      title="Eliminar estanque"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {/* Botón Agendar Carga */}
                {canEdit && (
                  <div className="absolute bottom-2 right-2">
                    <Button
                      size="sm"
                      className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => handleAgendarCarga(estanque)}
                    >
                      <Calendar className="w-4 h-4" />
                      Agendar Carga
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      {/* Historial de Cargas Agendadas */}
      <div className="card-fuel p-6 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Cargas Agendadas (Próximas y Pendientes)</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
            {scheduledCargas.length} registros
          </span>
        </div>

        {scheduledCargas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay cargas agendadas pendientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Fecha Prog.</th>
                  <th className="px-4 py-2">Estanque</th>
                  <th className="px-4 py-2">Litros</th>
                  <th className="px-4 py-2">Proveedor</th>
                  <th className="px-4 py-2">Patente</th>
                  <th className="px-4 py-2">Conductor</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scheduledCargas.map((carga: any) => {
                  const isLate = carga.fechaProgramada ? isAfter(new Date(), parseISO(carga.fechaProgramada)) : false;
                  return (
                    <tr key={carga.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-3 font-medium">{carga.fechaProgramada ? formatDateLabel(carga.fechaProgramada) : '-'}</td>
                      <td className="px-4 py-3">{carga.estanque}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{carga.litros?.toLocaleString()} L</td>
                      <td className="px-4 py-3">{carga.proveedor}</td>
                      <td className="px-4 py-3 text-xs">{carga.patenteCamion || '-'}</td>
                      <td className="px-4 py-3 text-xs">{carga.conductor || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                          isLate ? "bg-critical/10 text-critical" : "bg-warning/10 text-warning"
                        )}>
                          {isLate ? 'Retrasado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditAgendamiento(carga)}
                          title="Re-agendar / Modificar"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAgendamiento(carga.id)}
                          title="Eliminar agendamiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 border-success/30 text-success hover:bg-success/10 hover:text-success"
                          onClick={() => handleConfirmarCargaComprometida(carga)}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Confirmar Arribo
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-fuel p-4 rounded-lg border border-border text-center">
          <p className="text-2xl font-bold text-success">
            {estanquesData.filter((e: any) => e.estado === 'operativo').length}
          </p>
          <p className="text-sm text-muted-foreground">Operativos</p>
        </div>
        <div className="card-fuel p-4 rounded-lg border border-border text-center">
          <p className="text-2xl font-bold text-warning">
            {estanquesData.filter((e: any) => e.estado === 'bajo').length}
          </p>
          <p className="text-sm text-muted-foreground">Bajo Stock</p>
        </div>
        <div className="card-fuel p-4 rounded-lg border border-border text-center">
          <p className="text-2xl font-bold text-critical">
            {estanquesData.filter((e: any) => e.estado === 'critico').length}
          </p>
          <p className="text-sm text-muted-foreground">Críticos</p>
        </div>
        <div className="card-fuel p-4 rounded-lg border border-border text-center">
          <p className="text-2xl font-bold text-muted-foreground">
            {estanquesData.filter((e: any) => e.estado === 'fuera_servicio').length}
          </p>
          <p className="text-sm text-muted-foreground">Fuera de Servicio</p>
        </div>
      </div>

      {/* Form Dialog */}
      <EstanqueForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEstanque(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingEstanque}
        isLoading={isActionLoading}
      />

      {/* Carga Form Dialog */}
      <CargaForm
        open={isCargaFormOpen}
        onClose={() => {
          setIsCargaFormOpen(false);
          setSelectedEstanqueForCarga(null);
        }}
        onSubmit={handleCargaAction}
        estanques={estanquesData}
        initialData={selectedEstanqueForCarga}
        isLoading={isActionLoading}
      />

      {/* Confirm Arrival Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Arribo de Carga</DialogTitle>
            <DialogDescription>
              Ingrese el número de guía o factura para completar la carga programada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="numeroGuia">Número de Guía / Factura *</Label>
              <Input
                id="numeroGuia"
                value={numeroGuia}
                onChange={(e) => setNumeroGuia(e.target.value)}
                placeholder="Ej: 123456"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="confirmPrice">Precio Unitario ($)</Label>
                <Input
                  id="confirmPrice"
                  type="number"
                  value={confirmPrice || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    setConfirmPrice(price);
                    setConfirmTotal(price * (agendamientoToConfirm?.litros || 0));
                  }}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmTotal">Total ($)</Label>
                <Input
                  id="confirmTotal"
                  type="number"
                  value={confirmTotal || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setAgendamientoToConfirm(null);
                setNumeroGuia('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Carga'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteWithJustificationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        isLoading={isActionLoading}
        title="¿Eliminar estanque?"
        description="Esta acción no se puede deshacer. El estanque será eliminado permanentemente del sistema. Se requiere una justificación."
        itemName={estanquesData.find((e: any) => e.id === deleteTargetId)?.nombre || deleteTargetId || undefined}
        isAdmin={isAdmin}
        isCritical={true}
      />
    </div>
  );
}

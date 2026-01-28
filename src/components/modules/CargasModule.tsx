import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cargasApi, estanquesApi, agendamientosApi } from '@/lib/apiService';
import { CargaForm } from '@/components/forms/CargaForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, FileText, TrendingUp, Loader2, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CargaFormData } from '@/lib/validations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';

export function CargasModule() {
  const { canEdit } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCarga, setEditingCarga] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cargaToDelete, setCargaToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: cargasResponse, isLoading: loadingCargas } = useQuery({
    queryKey: ['cargas'],
    queryFn: cargasApi.getAll,
    refetchInterval: 30000,
  });

  const { data: estanquesResponse } = useQuery({
    queryKey: ['estanques'],
    queryFn: estanquesApi.getAll,
  });

  const cargasData = cargasResponse?.data || [];
  const estanques = estanquesResponse?.data || [];

  // Create mutation with stock update
  const createMutation = useMutation({
    mutationFn: async (data: CargaFormData) => {
      // If programmed, use agendamientosApi
      if (data.tipo === 'programada') {
        return await agendamientosApi.create(data);
      }

      // Create the real carga (Backend handles stock update automatically via processImpact)
      return await cargasApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargas'] });
      queryClient.invalidateQueries({ queryKey: ['estanques'] });
      queryClient.invalidateQueries({ queryKey: ['agendamientos'] });
      toast({
        title: "✅ Carga registrada",
        description: "La carga se ha registrado y el stock del estanque se ha actualizado.",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo registrar la carga.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CargaFormData> }) =>
      cargasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargas'] });
      toast({
        title: "✅ Carga actualizada",
        description: "La carga se ha actualizado exitosamente.",
      });
      setIsFormOpen(false);
      setEditingCarga(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo actualizar la carga.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, justification }: { id: string, justification: string }) => {
      // Delete the carga (Backend handles inverse stock update automatically)
      return await cargasApi.delete(id, { justificacion: justification });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cargas'] });
      queryClient.invalidateQueries({ queryKey: ['estanques'] });
      toast({
        title: "✅ Éxito",
        description: result.message || "La carga se ha eliminado correctamente.",
      });
      setIsDeleteDialogOpen(false);
      setCargaToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: CargaFormData) => {
    if (editingCarga) {
      await updateMutation.mutateAsync({ id: editingCarga.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (e: React.MouseEvent, carga: any) => {
    e.stopPropagation();
    console.log('Editando carga:', carga);
    setEditingCarga(carga);
    setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, carga: any) => {
    e.stopPropagation();
    console.log('Solicitando eliminación de carga:', carga);
    setCargaToDelete(carga);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async (justification: string) => {
    if (cargaToDelete) {
      console.log('Confirmando eliminación de carga ID:', cargaToDelete.id);
      await deleteMutation.mutateAsync({ id: cargaToDelete.id, justification });
      setIsDeleteDialogOpen(false);
      setCargaToDelete(null);
    }
  };

  const handleNuevaCarga = () => {
    setEditingCarga(null);
    setIsFormOpen(true);
  };

  // Filter to show only real loads in the table and sort by date desc
  const filteredCargas = (cargasData || [])
    .filter((c: any) => c && c.tipo !== 'programada')
    .sort((a: any, b: any) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });

  // Robust date parsing
  const parseDate = (dateStr: any) => {
    if (!dateStr || dateStr === '-') return new Date(NaN);

    // If it's already a Date or a number (timestamp)
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'number') return new Date(dateStr);

    const s = String(dateStr).trim();

    // If it's an ISO string (contains T)
    if (s.includes('T')) return new Date(s);

    // If it's YYYY-MM-DD
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(s + 'T12:00:00');

    // If DD/MM/YYYY or DD-MM-YYYY
    const parts = s.split(/[-/ ]/);
    if (parts.length >= 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      if (p0 > 1000) return new Date(p0, p1 - 1, p2, 12, 0, 0); // YYYY/MM/DD
      if (p2 > 1000) return new Date(p2, p1 - 1, p0, 12, 0, 0); // DD/MM/YYYY
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(NaN) : d;
  };

  // Calculate stats using only real loads
  const totalLitrosMes = filteredCargas
    .filter(c => {
      if (!c.fecha || c.fecha === '-') return false;
      const fecha = parseDate(c.fecha);
      if (isNaN(fecha.getTime())) return false;
      const hoy = new Date();
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    })
    .reduce((sum, c) => sum + (Number(c.litros) || 0), 0);

  const proveedoresActivos = [...new Set(filteredCargas.map(c => c.proveedor))].length;

  // Format date safely
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = parseDate(dateString);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  if (loadingCargas) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando cargas desde Google Sheets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-muted-foreground">Gestión de recargas de combustible</p>
        </div>
        {canEdit && (
          <Button
            size="sm"
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleNuevaCarga}
          >
            <Plus className="w-4 h-4" />
            Nueva Carga
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-fuel p-6 rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalLitrosMes.toLocaleString()} L
              </p>
              <p className="text-sm text-muted-foreground">Compras este mes</p>
            </div>
          </div>
        </div>
        <div className="card-fuel p-6 rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{cargasData.length}</p>
              <p className="text-sm text-muted-foreground">Cargas registradas</p>
            </div>
          </div>
        </div>
        <div className="card-fuel p-6 rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{proveedoresActivos}</p>
              <p className="text-sm text-muted-foreground">Proveedores activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {cargasData.length === 0 ? (
        <div className="card-fuel p-12 rounded-xl border border-border text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Sin cargas registradas</h3>
          <p className="text-muted-foreground mb-4">
            Registra la primera carga de combustible
          </p>
          {canEdit && (
            <Button
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleNuevaCarga}
            >
              <Plus className="w-4 h-4" />
              Nueva Carga
            </Button>
          )}
        </div>
      ) : (
        <div className="card-fuel rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-secondary/50">
                <tr>
                  <th>Fecha</th>
                  <th>N° Guía/Factura</th>
                  <th>Tipo</th>
                  <th>Estanque</th>
                  <th>Proveedor</th>
                  <th>Patente</th>
                  <th>Conductor</th>
                  <th>Litros</th>
                  <th>Responsable</th>
                  <th>Observaciones</th>
                  {canEdit && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCargas.map((carga) => (
                  <tr key={carga.id} className="animate-fade-in">
                    <td className="font-mono text-sm">{formatDate(carga.fecha)}</td>
                    <td>
                      <span className="font-mono bg-secondary px-2 py-1 rounded text-sm">
                        {carga.numeroGuia || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                        "bg-primary/10 text-primary"
                      )}>
                        {carga.tipoCombustible || '-'}
                      </span>
                    </td>
                    <td>{carga.estanque || '-'}</td>
                    <td className="text-muted-foreground">{carga.proveedor || '-'}</td>
                    <td className="text-xs">{carga.patenteCamion || '-'}</td>
                    <td className="text-xs">{carga.conductor || '-'}</td>
                    <td>
                      <span className="font-mono font-medium text-success">
                        +{(carga.litros || 0).toLocaleString()} L
                      </span>
                    </td>
                    <td className="text-sm">{carga.responsable || '-'}</td>
                    <td className="text-sm text-muted-foreground">
                      {carga.observaciones || '-'}
                    </td>
                    {canEdit && (
                      <td>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleEdit(e, carga)}
                            title="Editar carga"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDelete(e, carga)}
                            className="hover:bg-destructive/10"
                            title="Eliminar carga"
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
      )}

      {/* Form Dialog */}
      <CargaForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCarga(null);
        }}
        onSubmit={handleSubmit}
        estanques={estanques}
        initialData={editingCarga}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteWithJustificationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCargaToDelete(null);
        }}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="¿Eliminar Carga?"
        description="Esta acción eliminará la carga y ajustará el stock del estanque restando los litros cargados. Se requiere una justificación."
        itemName={cargaToDelete ? `${cargaToDelete.fecha} - ${cargaToDelete.litros}L` : undefined}
      />
    </div>

  );
}

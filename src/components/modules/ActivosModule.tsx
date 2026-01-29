import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activosApi, almacenesApi, productosAlmacenApi, auditoriaApi, actasApi } from '@/lib/apiService';
import { useApi } from '@/hooks/useApi';
import { ActivoForm } from '@/components/forms/ActivoForm';
import { ActivoFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Plus, Package, Wrench, AlertCircle, Loader2, Printer, Camera, Search, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Edit } from 'lucide-react';
import { speakSuccess } from '@/utils/voiceNotification';
import { useReactToPrint } from 'react-to-print';
import { AssetLabel } from '@/components/assets/AssetLabel';
import { PrintableCargoForm } from '@/components/shared/PrintableCargoForm';
import { BarcodeScanner } from '@/components/shared/BarcodeScanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';

export function ActivosModule() {
  const { canEdit, isAdmin, user } = useAuth();
  const { execute, loading: isActionLoading } = useApi();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivo, setEditingActivo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [printingActivo, setPrintingActivo] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activoToDelete, setActivoToDelete] = useState<any>(null);
  const [deleteFromWarehouse, setDeleteFromWarehouse] = useState(false);
  const [printingData, setPrintingData] = useState<any>(null);
  const [activoForCargo, setActivoForCargo] = useState<any>(null);
  const [cargoData, setCargoData] = useState({
    responsable: '',
    cargo: '',
    observaciones: ''
  });

  const labelRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePrintActa = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Acta_Cargo_${printingData?.responsable || 'Activo'}`,
    onAfterPrint: () => setPrintingData(null)
  });

  const triggerPrint = (data: any) => {
    setPrintingData(data);
    setTimeout(() => {
      if (handlePrintActa) handlePrintActa();
    }, 300);
  };

  const handleOpenCargoDialog = (activo: any) => {
    setActivoForCargo(activo);
    setCargoData({
      responsable: activo.responsable || '',
      cargo: 'Operario / Responsable de Equipo',
      observaciones: ''
    });
  };

  const handleConfirmCargo = async () => {
    if (!activoForCargo) return;

    const payload = {
      activoId: activoForCargo.id,
      responsable: cargoData.responsable,
      fecha: new Date().toLocaleDateString('es-CL'),
      cargo: cargoData.cargo,
      equipo: activoForCargo.nombre,
      serie: activoForCargo.numeroSerie || activoForCargo.id,
      marca: activoForCargo.marca,
      modelo: activoForCargo.modelo,
      observaciones: cargoData.observaciones
    };

    await execute(actasApi.generateCargo(payload), {
      successMessage: "✅ Acta de Cargo generada en sistema.",
      onSuccess: () => {
        triggerPrint(payload);
        setActivoForCargo(null);
      }
    });
  };

  // Data Fetching
  const { data: activosResponse, isLoading: loadingActivos } = useQuery({
    queryKey: ['activos'],
    queryFn: activosApi.getAll
  });

  const { data: almacenesResponse } = useQuery({
    queryKey: ['almacenes'],
    queryFn: almacenesApi.getAll
  });

  const activosData = activosResponse?.data || [];
  const almacenes = almacenesResponse?.data || [];

  // Filter activos based on search term
  const filteredActivos = activosData.filter((activo: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      activo.id?.toLowerCase().includes(term) ||
      activo.nombre?.toLowerCase().includes(term) ||
      activo.categoria?.toLowerCase().includes(term) ||
      activo.responsable?.toLowerCase().includes(term) ||
      activo.ubicacion?.toLowerCase().includes(term)
    );
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: activosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast({ title: "✅ Activo creado", description: "El activo se ha registrado correctamente." });
      speakSuccess();
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "❌ Error", description: error.message || "No se pudo crear el activo." });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ActivoFormData> }) => activosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast({ title: "✅ Activo actualizado", description: "Los cambios se han guardado." });
      speakSuccess();
      setIsFormOpen(false);
      setEditingActivo(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "❌ Error", description: error.message || "No se pudo actualizar el activo." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, justification }: { id: string; justification: string }) => {
      return await activosApi.delete(id, { justificacion: justification });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['almacenes'] });
      toast({ title: "✅ Activo eliminado", description: "El activo ha sido eliminado correctamente del sistema y de bodega." });
      setIsDeleteDialogOpen(false);
      setActivoToDelete(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "❌ Error", description: error.message || "No se pudo eliminar el activo." });
    }
  });

  // Handlers
  const handleNewActivo = () => {
    setEditingActivo(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: ActivoFormData) => {
    if (editingActivo) {
      await updateMutation.mutateAsync({ id: editingActivo.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  // Print handler for labels
  const handlePrintLabelAction = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Rotulo-${printingActivo?.id || 'Activo'}`,
  });

  const handlePrintLabel = (activo: any) => {
    setPrintingActivo(activo);
    // Wait for state to update, then print
    setTimeout(() => {
      if (handlePrintLabelAction) {
        handlePrintLabelAction();
      }
    }, 100);
  };

  // Scanner handler
  const handleScanCode = (code: string) => {
    const found = filteredActivos.find(a => a.id === code || a.id.toLowerCase() === code.toLowerCase());
    if (found) {
      setSearchTerm(code);
      toast({
        title: "✅ Activo encontrado",
        description: `${found.nombre} (${found.id})`
      });
    } else {
      toast({
        variant: "destructive",
        title: "❌ No encontrado",
        description: `No se encontró ningún activo con el código ${code}`
      });
    }
    setIsScannerOpen(false);
  };

  // Helpers
  const formatDate = (dateString: any) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('es-CL');
    } catch { return '-'; }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <span className="px-2 py-1 rounded text-xs font-medium bg-secondary/50">S/E</span>;
    const s = status.toLowerCase();
    const isMantencion = s === 'mantencion' || s === 'mantención';

    const styles = {
      'operativo': 'bg-success/20 text-success',
      'mantencion': 'bg-warning/20 text-warning',
      'baja': 'bg-destructive/20 text-destructive'
    };

    const style = isMantencion ? styles.mantencion : (styles[s as keyof typeof styles] || 'bg-secondary');

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>
        {isMantencion ? 'MANTENCIÓN' : status.toUpperCase()}
      </span>
    );
  };

  if (loadingActivos) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando activos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Activos</h2>
          <p className="text-muted-foreground">Inventario de vehículos y equipos</p>
        </div>
        <div className="flex gap-2">
          {/* Botón Escanear */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
            className="gap-2"
          >
            <Camera className="w-4 h-4" />
            Escanear
          </Button>
          {/* Botón Nuevo Activo - Oculto/Deshabilitado para centralizar en Almacenes */}
          {/* 
          {canEdit && (
            <Button
              size="sm"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleNewActivo}
            >
              <Plus className="w-4 h-4" />
              Nuevo Activo
            </Button>
          )} 
          */}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nombre, categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando {filteredActivos.length} de {activosData.length} activos
          </p>
        )}
      </div>

      <div className="card-fuel rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-secondary/50">
              <tr>
                <th>ID</th>
                <th>Equipo / Detalle</th>
                <th>Categoría</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th className="text-right pr-4">Valor Inicial</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activosData.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    No hay activos registrados
                  </td>
                </tr>
              ) : (
                activosData.map((activo: any) => (
                  <tr key={activo.id} className="animate-fade-in">
                    <td>
                      <span className="font-mono bg-secondary px-2 py-1 rounded text-sm">
                        {activo.id}
                      </span>
                    </td>
                    <td className="max-w-[300px] py-3">
                      <div className="font-bold uppercase truncate text-sm leading-tight text-slate-900 dark:text-slate-100">{activo.nombre}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight flex items-center gap-2">
                        <span className="font-semibold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{activo.marca || '-'}</span>
                        <span className="opacity-50">•</span>
                        <span>{activo.modelo || '-'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 pt-1 border-t border-border/30">
                        N/S: {activo.numeroSerie || '-'}
                      </div>
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-sm uppercase font-semibold">{activo.categoria}</td>
                    <td className="text-sm font-bold text-slate-700 dark:text-slate-300">{activo.ubicacion}</td>
                    <td>{getStatusBadge(activo.estado)}</td>
                    <td className="font-mono text-sm text-right pr-6">
                      <span className="text-primary font-black text-lg">
                        {formatCurrency(Number(activo.valorInicial) || 0)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end px-2">
                        {/* Botón Imprimir Etiqueta - Neutro */}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all duration-300"
                          onClick={() => handlePrintLabel(activo)}
                          title="Imprimir rótulo de Inventario"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                        {/* Botón Cargo de Equipo - Vibrante Naranja */}
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 shadow-sm"
                          onClick={() => handleOpenCargoDialog(activo)}
                          title="Generar e Imprimir Acta de Cargo"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {/* Botones Editar/Eliminar - solo para canEdit */}
                        {canEdit && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400 hover:text-blue-300 transition-all duration-300 shadow-sm"
                              onClick={() => {
                                setEditingActivo(activo);
                                setIsFormOpen(true);
                              }}
                              title="Editar Activo"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-600 transition-all duration-300 shadow-sm"
                              onClick={() => {
                                setActivoToDelete(activo);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Eliminar Activo (Baja)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      <ActivoForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingActivo(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingActivo}
        almacenes={almacenes}
      />

      {/* Escáner de Códigos */}
      <BarcodeScanner
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanCode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteWithJustificationDialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setActivoToDelete(null);
        }}
        onConfirm={async (justification) => {
          if (!activoToDelete) return;

          await deleteMutation.mutateAsync({
            id: activoToDelete.id,
            justification
          });
        }}
        isLoading={deleteMutation.isPending || isActionLoading}
        title="¿Eliminar Activo?"
        description="Esta acción eliminará el activo del sistema y su registro en bodega. Se requiere una justificación legal para la baja."
        itemName={activoToDelete ? `${activoToDelete.nombre} (${activoToDelete.id})` : undefined}
        isAdmin={isAdmin}
        isCritical={true}
      />

      {/* Rótulo para Imprimir (oculto) */}
      <div className="hidden">
        {printingActivo && (
          <AssetLabel ref={labelRef} activo={printingActivo} showBoth={true} />
        )}
      </div>
      {/* Componente de Impresión (Fuera del visor normal pero no hidden para react-to-print) */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        {printingData && (
          <PrintableCargoForm ref={printRef} data={printingData} />
        )}
      </div>

      {/* Dialog for Generating Cargo Document */}
      <Dialog open={!!activoForCargo} onOpenChange={(open) => !open && setActivoForCargo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Acta de Cargo</DialogTitle>
            <DialogDescription>
              Confirme los datos del responsable para generar el documento oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cargoResponsable">Nombre Responsable</Label>
              <Input
                id="cargoResponsable"
                value={cargoData.responsable}
                onChange={(e) => setCargoData({ ...cargoData, responsable: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cargoRole">Cargo / Rol</Label>
              <Input
                id="cargoRole"
                value={cargoData.cargo}
                onChange={(e) => setCargoData({ ...cargoData, cargo: e.target.value })}
                placeholder="Ej: Operario, Jefe de Terreno..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cargoObs">Observaciones (Opcional)</Label>
              <Input
                id="cargoObs"
                value={cargoData.observaciones}
                onChange={(e) => setCargoData({ ...cargoData, observaciones: e.target.value })}
                placeholder="Estado del equipo, accesorios..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivoForCargo(null)}>Cancelar</Button>
            <Button onClick={handleConfirmCargo} disabled={!cargoData.responsable || isActionLoading}>
              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
              Generar e Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


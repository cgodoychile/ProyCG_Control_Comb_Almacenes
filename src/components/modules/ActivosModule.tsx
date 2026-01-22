import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activosApi, almacenesApi, productosAlmacenApi } from '@/lib/apiService';
import { ActivoForm } from '@/components/forms/ActivoForm';
import { ActivoFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Plus, Package, Wrench, AlertCircle, Loader2, Printer, Camera, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Edit } from 'lucide-react';
import { speakSuccess } from '@/utils/voiceNotification';
import { useReactToPrint } from 'react-to-print';
import { AssetLabel } from '@/components/assets/AssetLabel';
import { BarcodeScanner } from '@/components/shared/BarcodeScanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

export function ActivosModule() {
  const { canEdit } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivo, setEditingActivo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [printingActivo, setPrintingActivo] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activoToDelete, setActivoToDelete] = useState<any>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    mutationFn: async (id: string) => {
      const response = await activosApi.delete(id);
      if (!response.success) {
        throw new Error(response.message || "Error al eliminar el activo");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos'] });
      toast({ title: "✅ Activo eliminado", description: "El activo ha sido eliminado correctamente." });
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

      // AUTO-CREATE PRODUCT IN WAREHOUSE LOGIC
      // Check if selected location is a known warehouse
      const warehouse = almacenes.find((a: any) => a.nombre === data.ubicacion);
      if (warehouse) {
        try {
          toast({ title: "📦 Creando inventario...", description: `Agregando ${data.nombre} a ${warehouse.nombre}` });
          // Create product payload
          const productData = {
            nombre: data.nombre,
            descripcion: `Activo: ${data.id} - ${data.categoria}`,
            categoria: data.categoria,
            unidad: 'UNIDAD',
            cantidad: 1, // Default quantity as per plan
            stockMinimo: 1,
            valorUnitario: data.valorInicial,
            ubicacion: warehouse.ubicacion || 'Bodega',
            almacenId: warehouse.id,
            cantidadEnUso: 0,
            esRetornable: true, // Assets usually are returnable
            esActivo: true
          };

          const prodResponse = await productosAlmacenApi.create(productData);
          if (prodResponse.success) {
            toast({ title: "✅ Inventario creado", description: "Se creó el producto asociado en la bodega." });
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
          } else {
            console.error('Error auto-creating product:', prodResponse);
            toast({ title: "⚠️ Atención", description: "Activo creado, pero falló la creación automática del producto en bodega." });
          }
        } catch (e) {
          console.error('Exception auto-creating product:', e);
          toast({ title: "⚠️ Atención", description: "Ocurrió un error al intentar crear el producto en bodega." });
        }
      }
    }
  };

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: labelRef,
    documentTitle: `Rotulo-${printingActivo?.id || 'Activo'}`,
  });

  const handlePrintLabel = (activo: any) => {
    setPrintingActivo(activo);
    // Wait for state to update, then print
    setTimeout(() => {
      if (handlePrint) {
        handlePrint();
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
          {/* Botón Nuevo Activo */}
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
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Fecha Adquisición</th>
                <th>Valor Inicial</th>
                <th>Responsable</th>
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
                    <td className="font-medium">{activo.nombre}</td>
                    <td className="text-muted-foreground text-sm">{activo.categoria}</td>
                    <td className="text-sm">{activo.ubicacion}</td>
                    <td>{getStatusBadge(activo.estado)}</td>
                    <td className="font-mono text-sm">{formatDate(activo.fechaAdquisicion)}</td>
                    <td className="font-mono text-sm text-accent">
                      {formatCurrency(activo.valorInicial || 0)}
                    </td>
                    <td className="text-sm">{activo.responsable}</td>
                    <td>
                      <div className="flex gap-2">
                        {/* Botón Imprimir - disponible para todos */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrintLabel(activo)}
                          title="Imprimir rótulo"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        {/* Botones Editar/Eliminar - solo para canEdit */}
                        {canEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingActivo(activo);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setActivoToDelete(activo);
                                setIsDeleteDialogOpen(true);
                              }}
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Eliminación de Activo
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el activo del sistema.
            </DialogDescription>
          </DialogHeader>
          {activoToDelete && (
            <div className="grid gap-3 py-4 bg-secondary/30 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-medium font-mono">{activoToDelete.id}</span>

                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{activoToDelete.nombre}</span>

                <span className="text-muted-foreground">Categoría:</span>
                <span className="font-medium">{activoToDelete.categoria}</span>

                <span className="text-muted-foreground">Ubicación:</span>
                <span className="font-medium">{activoToDelete.ubicacion}</span>

                <span className="text-muted-foreground">Responsable:</span>
                <span className="font-medium">{activoToDelete.responsable}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setActivoToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (activoToDelete) {
                  deleteMutation.mutate(activoToDelete.id);
                  setIsDeleteDialogOpen(false);
                  setActivoToDelete(null);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar Activo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rótulo para Imprimir (oculto) */}
      <div className="hidden">
        {printingActivo && (
          <AssetLabel ref={labelRef} activo={printingActivo} showBoth={true} />
        )}
      </div>
    </div>
  );
}


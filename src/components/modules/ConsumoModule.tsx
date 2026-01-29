import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consumosApi, estanquesApi, vehiculosApi, auditoriaApi } from '@/lib/apiService';
import { useApi } from '@/hooks/useApi';
import { ConsumoForm } from '@/components/forms/ConsumoForm';
import { ExportButton } from '@/components/shared/ExportButton';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { generateManualConsumptionExcel } from '@/utils/excelForms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/dashboard/KPICard';
import { Plus, Search, Loader2, Edit, Trash2, MoreHorizontal, AlertTriangle, FileText, TrendingUp, TrendingDown, Fuel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ConsumoFormData } from '@/lib/validations';
import { generateConsumoReport } from '@/lib/export';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConsumoModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsumo, setEditingConsumo] = useState<any>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTankSelectionOpen, setIsTankSelectionOpen] = useState(false);
  const [showOnlyExcessive, setShowOnlyExcessive] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState<any>(null);
  const [showOnlyCriticalKPI, setShowOnlyCriticalKPI] = useState(false);
  const itemsPerPage = 50;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, canEdit, user } = useAuth();
  const { execute, loading: isActionLoading } = useApi();

  // Fetch data
  const { data: consumosResponse, isLoading: loadingConsumos } = useQuery({
    queryKey: ['consumos'],
    queryFn: consumosApi.getAll,
    refetchInterval: 30000,
  });

  const { data: estanquesResponse } = useQuery({
    queryKey: ['estanques'],
    queryFn: estanquesApi.getAll,
  });

  const { data: vehiculosResponse } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: vehiculosApi.getAll,
  });

  const consumosData = consumosResponse?.data || [];
  const estanques = estanquesResponse?.data || [];
  const vehiculos = vehiculosResponse?.data || [];

  // Combine vehicles from Vehiculos module with unique patentes from Consumos
  const allVehicles = useMemo(() => {
    const vehicleMap = new Map();

    // Add vehicles from Vehiculos module
    vehiculos.forEach(v => {
      if (v.id) {
        vehicleMap.set(v.id, {
          id: v.id,
          patente: v.id,
          marca: v.marca,
          modelo: v.modelo,
          estado: v.estado || 'operativo',
          nombre: v.id
        });
      }
    });

    // Add unique patentes from Consumos that aren't in Vehiculos
    consumosData.forEach(c => {
      if (c.vehiculo && !vehicleMap.has(c.vehiculo)) {
        vehicleMap.set(c.vehiculo, {
          id: c.vehiculo,
          patente: c.vehiculo,
          marca: '',
          modelo: '(Registro previo)',
          estado: 'operativo',
          nombre: c.vehiculo
        });
      }
    });

    return Array.from(vehicleMap.values());
  }, [vehiculos, consumosData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: ConsumoFormData) => {
      return await consumosApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumos'] });
      queryClient.invalidateQueries({ queryKey: ['estanques'] });
      toast({
        title: "✅ Registro exitoso",
        description: "El consumo se ha guardado y el stock actualizado.",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo guardar el registro.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConsumoFormData> }) =>
      consumosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumos'] });
      toast({
        title: "✅ Actualización exitosa",
        description: "El registro se ha actualizado correctamente.",
      });
      setIsFormOpen(false);
      setEditingConsumo(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo actualizar el registro.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, devolverStock, justification }: { id: string; devolverStock: boolean; justification: string }) => {
      return consumosApi.delete(id, { restoreStock: devolverStock, justificacion: justification });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumos'] });
      queryClient.invalidateQueries({ queryKey: ['estanques'] });
      toast({
        title: "✅ Registro eliminado",
        description: "El registro ha sido eliminado correctamente.",
      });
      setDeleteTargetId(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar el registro.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleNewRegistro = () => {
    setEditingConsumo(null);
    setIsFormOpen(true);
  };

  const handleEdit = (registro: any) => {
    setEditingConsumo(registro);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async (justification: string, checkboxesState?: Record<string, boolean>) => {
    if (!deleteTargetId) return;
    const devolverStock = checkboxesState?.devolverStock ?? true;

    // DIRECT DELETION (Bypass approval request)
    await deleteMutation.mutateAsync({
      id: deleteTargetId,
      devolverStock,
      justification
    });
  };

  const handleSubmit = async (data: ConsumoFormData) => {
    if (editingConsumo) {
      await updateMutation.mutateAsync({ id: editingConsumo.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  // Helpers
  // Helpers
  const parseSafeDate = (dateStr: any) => {
    if (!dateStr) return new Date(0);
    if (dateStr instanceof Date) return dateStr;

    const s = String(dateStr);
    // Manejar formato DD-MM-YYYY o DD/MM/YYYY
    if (s.includes('-') || s.includes('/')) {
      const parts = s.split(/[-/]/);
      if (parts.length === 3) {
        // Asumir DD/MM/YYYY si el primero es <= 31 y el último es un año
        const p0 = parseInt(parts[0]);
        const p1 = parseInt(parts[1]);
        const p2 = parseInt(parts[2]);

        if (p2 > 1000) { // DD/MM/YYYY
          return new Date(p2, p1 - 1, p0);
        } else if (p0 > 1000) { // YYYY/MM/DD
          return new Date(p0, p1 - 1, p2);
        }
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return '-';
    try {
      const date = parseSafeDate(dateString);
      if (date.getTime() === 0) return String(dateString);

      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Santiago'
      }).format(date);
    } catch {
      return String(dateString);
    }
  };

  const getPerformanceColor = (rendimiento: any) => {
    const val = typeof rendimiento === 'string' ? parseFloat(rendimiento) : rendimiento;
    if (!val || isNaN(val)) return 'text-muted-foreground';
    if (val < 5) return 'text-destructive';
    if (val < 10) return 'text-warning';
    return 'text-success';
  };

  // Filtering & Pagination
  const filteredData = useMemo(() => {
    let data = [...consumosData];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.vehiculo?.toLowerCase().includes(searchLower) ||
          item.responsable?.toLowerCase().includes(searchLower) ||
          item.empresa?.toLowerCase().includes(searchLower)
      );
    }

    if (showOnlyExcessive || showOnlyCriticalKPI) {
      data = data.filter(item => item.litrosUsados >= 80);
    }

    if (fechaDesde && fechaHasta) {
      const start = new Date(fechaDesde);
      const end = new Date(fechaHasta);
      end.setHours(23, 59, 59);
      data = data.filter((item) => {
        const date = new Date(item.fecha);
        return date >= start && date <= end;
      });
    }

    // Sort by date desc using safe parser
    return data.sort((a, b) => parseSafeDate(b.fecha).getTime() - parseSafeDate(a.fecha).getTime());
  }, [consumosData, searchTerm, fechaDesde, fechaHasta, showOnlyExcessive, showOnlyCriticalKPI]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loadingConsumos) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando registros...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Consumo Crítico (Modernized 3D Style) - AL TOPE */}
      {(() => {
        const allCritical = consumosData.filter(c => c.litrosUsados >= 80);
        const criticalPending = allCritical.filter(c =>
          String(c.justificacion || '').trim().length < 10 && String(c.observaciones || '').trim().length < 10
        );

        if (allCritical.length === 0) return null;

        return (
          <div className="card-fuel p-4 border-l-4 border-l-critical bg-critical/5 rounded-xl shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Imagen Compacta y Título */}
              <div className="flex items-center gap-4 border-r border-border/50 pr-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-critical/20 rounded-full blur-xl animate-pulse"></div>
                  <img
                    src="/camioneta.png"
                    alt="Alerta"
                    className="w-20 h-auto drop-shadow-lg transform hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div
                  className="cursor-pointer group"
                  onClick={() => setShowOnlyCriticalKPI(!showOnlyCriticalKPI)}
                >
                  <h3 className="text-lg font-black text-foreground tracking-tight underline decoration-critical/30 group-hover:text-critical transition-colors">
                    CONSUMO <span className="text-critical uppercase text-xl">CRÍTICO</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <AlertTriangle className="h-3 w-3 text-critical animate-bounce" />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">TOTAL REGISTROS: {allCritical.length}</span>
                  </div>
                </div>
              </div>

              {/* Status y Acción */}
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-foreground/80 font-medium max-w-md">
                  Se han detectado {allCritical.length} cargas superiores a 80L que requieren revisión.
                  {criticalPending.length > 0 && <span className="text-critical font-bold"> ({criticalPending.length} pendientes).</span>}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 border-critical/30 hover:bg-critical/10 text-critical font-bold shadow-sm min-w-[200px]",
                    showOnlyCriticalKPI ? "bg-critical text-white hover:bg-critical/90" : (criticalPending.length > 0 && "animate-pulse")
                  )}
                  onClick={() => setShowOnlyCriticalKPI(!showOnlyCriticalKPI)}
                >
                  <Search className="w-4 h-4" />
                  {showOnlyCriticalKPI ? "MOSTRAR TODOS" : "VER ALERTAS CRÍTICAS"}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Registro de Consumo</h2>
          <p className="text-muted-foreground">
            Historial detallado de cargas de combustible
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="gap-2 bg-[#1e40af] text-white hover:bg-[#1e3a8a] font-bold shadow-md uppercase tracking-tight"
            onClick={() => setIsTankSelectionOpen(true)}
          >
            <FileText className="w-4 h-4" />
            Generar Formulario Excel
          </Button>
          <ExportButton data={filteredData} filename="reporte-consumo" />
          {canEdit && (
            <Button
              size="sm"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleNewRegistro}
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro
            </Button>
          )}
        </div>
      </div>


      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1 w-full">
          {/* Label for visual alignment if needed, or just the input */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vehículo, responsable, empresa..."
            className="pl-9 h-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <DateRangeFilter
            onFilterChange={(desde, hasta) => {
              setFechaDesde(desde);
              setFechaHasta(hasta);
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card-fuel rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-secondary/50">
              <tr>
                <th>Fecha</th>
                <th>Conductor</th>
                <th>Vehículo</th>
                <th>Estanque</th>
                <th>Litros</th>
                <th>Kilometraje</th>
                <th>Contador</th>
                <th>Justificación (&gt;80L)</th>
                {canEdit && <th className="text-center w-[50px]">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay registros de consumo'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((registro, index) => (
                  <tr
                    key={`${index}-${registro.fecha}-${registro.vehiculo}`}
                    className={cn(
                      "animate-fade-in text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                      registro.litrosUsados > 80 && "bg-critical/5"
                    )}
                    onClick={() => {
                      if (registro.litrosUsados > 80) {
                        setSelectedJustification(registro);
                      }
                    }}
                  >
                    <td className="font-mono">
                      {formatDate(registro.fecha)}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{registro.empresa || '-'}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase">{registro.responsable || 'Sin asignar'}</span>
                          {registro.litrosUsados >= 80 && (
                            <span className={cn(
                              "text-[8px] px-1.5 py-0 rounded-sm font-bold",
                              (String(registro.observaciones || '').trim().length >= 10 || String(registro.justificacion || '').trim().length >= 10)
                                ? "bg-success/10 text-success border border-success/20"
                                : "bg-critical/10 text-critical border border-critical/20 animate-pulse"
                            )}>
                              {(String(registro.observaciones || '').trim().length >= 10 || String(registro.justificacion || '').trim().length >= 10) ? "JUSTIFICADO" : "PENDIENTE"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono bg-secondary px-2 py-1 rounded">
                        {String(registro.vehiculo || '').trim() || '-'}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{registro.estanque || '-'}</td>
                    <td>
                      <span className={cn(
                        "font-mono font-medium",
                        registro.litrosUsados > 70 && "text-warning",
                        registro.litrosUsados >= 80 && "text-critical"
                      )}>
                        {registro.litrosUsados || 0} L
                      </span>
                    </td>
                    <td className="font-mono">
                      {registro.kilometraje?.toLocaleString() || 0} km
                    </td>
                    <td className="font-mono text-muted-foreground">
                      {registro.contadorInicial || 0} → {registro.contadorFinal || 0}
                    </td>
                    <td>
                      <div className={cn(
                        "max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300 text-xs text-muted-foreground",
                        registro.litrosUsados >= 80 && !String(registro.justificacion || '').trim() && !String(registro.observaciones || '').trim() ? "text-critical font-bold animate-pulse text-[10px]" : ""
                      )}>
                        {registro.litrosUsados >= 80
                          ? (String(registro.justificacion || registro.observaciones || '').trim() || "⚠️ REQUIERE JUSTIFICACIÓN")
                          : "-"}
                      </div>
                    </td>
                    {canEdit && (
                      <td className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(registro)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(registro.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
        </span>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div >

      {/* Form Dialog */}
      < ConsumoForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingConsumo(null);
        }
        }
        onSubmit={handleSubmit}
        estanques={estanques}
        vehiculos={allVehicles}
        initialData={editingConsumo}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
      <ConfirmDeleteWithJustificationDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending || isActionLoading}
        title="¿Eliminar Registro de Consumo?"
        description="Esta acción eliminará el registro de consumo. Se requiere una justificación."
        isAdmin={isAdmin}
        isCritical={true}
        checkboxes={[
          { id: 'devolverStock', label: 'Devolver los litros al estanque', defaultValue: true }
        ]}
      />

      {/* Modal de Selección de Estanque para Formulario Excel */}
      <Dialog open={isTankSelectionOpen} onOpenChange={setIsTankSelectionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Seleccionar Estanque
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Seleccione el estanque para el cual desea generar el formulario de registro manual en Excel.
            </p>
            <div className="grid gap-2">
              {estanques.map((estanque: any) => (
                <Button
                  key={estanque.id}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 hover:border-accent hover:text-accent group"
                  onClick={() => {
                    generateManualConsumptionExcel(estanque.nombre);
                    setIsTankSelectionOpen(false);
                    toast({
                      title: "✅ Archivo generado",
                      description: `El formulario para ${estanque.nombre} se ha descargado correctamente.`,
                    });
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-bold">{estanque.nombre}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-accent/70">Ubicación: {estanque.ubicacion || 'No especificada'}</span>
                  </div>
                </Button>
              ))}
              {estanques.length === 0 && (
                <p className="text-center py-4 text-muted-foreground italic">No hay estanques disponibles.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de Justificación de Consumo Excesivo */}
      <Dialog open={!!selectedJustification} onOpenChange={(open) => !open && setSelectedJustification(null)}>
        <DialogContent className="sm:max-w-[500px] border-critical/30 shadow-glow-critical">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-critical">
              <AlertTriangle className="w-5 h-5" />
              DETALLE DE CONSUMO CRÍTICO
            </DialogTitle>
          </DialogHeader>
          {selectedJustification && (
            <div className="space-y-4 py-2">
              {/* Estatus Badge superior e Imagen */}
              {selectedJustification.litrosUsados >= 80 && (
                <div className="flex flex-col items-center gap-4 mb-2">
                  <div className="relative group">
                    <img
                      src="/camioneta.png"
                      alt="Alerta"
                      className="w-32 h-auto drop-shadow-[0_0_15px_rgba(var(--critical),0.3)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className={cn(
                    "w-full p-3 rounded-lg flex items-center gap-3 border",
                    (String(selectedJustification.observaciones || '').trim().length >= 10 || String(selectedJustification.justificacion || '').trim().length >= 10)
                      ? "bg-success/5 border-success/20 text-success"
                      : "bg-critical/5 border-critical/20 text-critical"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      (String(selectedJustification.observaciones || '').trim().length >= 10 || String(selectedJustification.justificacion || '').trim().length >= 10) ? "bg-success" : "bg-critical animate-pulse"
                    )} />
                    <span className="text-xs font-black uppercase tracking-widest">
                      {(String(selectedJustification.observaciones || '').trim().length >= 10 || String(selectedJustification.justificacion || '').trim().length >= 10)
                        ? "JUSTIFICACIÓN COMPLETADA"
                        : "REQUIERE JUSTIFICACIÓN URGENTE"}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-secondary/30 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Vehículo</p>
                  <p className="text-lg font-mono font-bold text-foreground">{selectedJustification.vehiculo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Consumo</p>
                  <p className="text-2xl font-mono font-black text-critical">{selectedJustification.litrosUsados} L</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(selectedJustification.fecha)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estanque</p>
                  <p className="font-medium">{selectedJustification.estanque}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conductor/Empresa</p>
                  <p className="font-medium">{selectedJustification.empresa}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Responsable Registro</p>
                  <p className="font-medium">{selectedJustification.responsable}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  JUSTIFICACIÓN / OBSERVACIONES
                </p>
                <div className={cn(
                  "p-4 rounded-lg border italic text-sm text-foreground min-h-[100px]",
                  (selectedJustification.observaciones?.length >= 10 || selectedJustification.justificacion?.length >= 10)
                    ? "bg-secondary/20 border-border"
                    : "bg-critical/5 border-critical/20 text-critical/80"
                )}>
                  {selectedJustification.observaciones || selectedJustification.justificacion || "Sin justificación registrada."}
                </div>
                {(!selectedJustification.observaciones || selectedJustification.observaciones.length < 10) && selectedJustification.litrosUsados > 80 && (
                  <p className="text-[10px] text-critical mt-2 italic">
                    * El consumo excede los 80L y no tiene una justificación válida (mínimo 10 caracteres).
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedJustification(null)}>
                  Cerrar
                </Button>
                {canEdit && (
                  <Button
                    variant="ghost"
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                      handleEdit(selectedJustification);
                      setSelectedJustification(null);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Corregir Registro
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}

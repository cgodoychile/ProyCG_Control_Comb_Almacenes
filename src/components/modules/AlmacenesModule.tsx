import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { almacenesApi, productosAlmacenApi, movimientosAlmacenApi, activosApi, auditoriaApi, actasApi } from '@/lib/apiService';
import { AlmacenForm } from '@/components/forms/AlmacenForm';
import { ProductoForm } from '@/components/forms/ProductoForm';
import { MovimientoForm } from '@/components/forms/MovimientoForm';
import { generateInventoryExcel, generateManualExitExcel } from '@/utils/excelForms';
import {
    Warehouse,
    Package,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Edit,
    Trash2,
    TrendingUp,
    Search,
    FileText,
    Camera,
    Printer
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { KPICard } from '@/components/dashboard/KPICard';
import { cn, getLocalDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { speakSuccess } from '@/utils/voiceNotification';
import { Activo } from '@/types/crm';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { ProductLabel } from '@/components/assets/ProductLabel';
import { PrintableCargoForm } from '@/components/shared/PrintableCargoForm';
import { BarcodeScanner } from '@/components/shared/BarcodeScanner';
import { useApi } from '@/hooks/useApi';

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'];

interface AlmacenesModuleProps {
    globalSearch?: string;
}

import { ProductTrackingDialog } from './ProductTrackingDialog';
import { GlobalProductSearchDialog } from './GlobalProductSearchDialog';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';

export function AlmacenesModule({ globalSearch = "" }: AlmacenesModuleProps) {
    const { toast } = useToast();
    const { canEdit, isAdmin, user } = useAuth();
    const queryClient = useQueryClient();
    const { execute, loading: isActionLoading } = useApi();

    const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
    const [isAlmacenFormOpen, setIsAlmacenFormOpen] = useState(false);
    const [editingAlmacen, setEditingAlmacen] = useState<any>(null);
    const [isProductoFormOpen, setIsProductoFormOpen] = useState(false);
    const [editingProducto, setEditingProducto] = useState<any>(null);
    const [isMovimientoFormOpen, setIsMovimientoFormOpen] = useState(false);
    const [movimientoTipo, setMovimientoTipo] = useState<'entrada' | 'salida' | 'traslado' | 'retorno' | 'baja'>('entrada');
    const [selectedProducto, setSelectedProducto] = useState<string | null>(null);
    const [trackingProducto, setTrackingProducto] = useState<any>(null); // New state for tracking
    const [searchTerm, setSearchTerm] = useState(globalSearch);
    const [isWarehouseSelectionOpen, setIsWarehouseSelectionOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'existencias' | 'historial'>('existencias');
    const [movimientoFilter, setMovimientoFilter] = useState<'todos' | 'entrada' | 'salida'>('todos');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [printingProducto, setPrintingProducto] = useState<any>(null);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [movimientoInitialData, setMovimientoInitialData] = useState<any>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'almacen' | 'producto' | 'movimiento', name?: string } | null>(null);
    const labelRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const [printingData, setPrintingData] = useState<any>(null);

    const handlePrintActa = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Acta_Cargo_${printingData?.responsable || 'Insumo'}`,
        onAfterPrint: () => setPrintingData(null)
    });

    const triggerPrint = (data: any) => {
        setPrintingData(data);
        setTimeout(() => {
            if (handlePrintActa) handlePrintActa();
        }, 300);
    };

    useEffect(() => {
        setSearchTerm(globalSearch);
    }, [globalSearch]);

    // Fetch almacenes
    const { data: almacenesResponse, isLoading: loadingAlmacenes } = useQuery({
        queryKey: ['almacenes'],
        queryFn: almacenesApi.getAll
    });

    const almacenes = almacenesResponse?.data || [];

    // Fetch productos for selected warehouse
    const { data: productosResponse } = useQuery({
        queryKey: ['productos', selectedWarehouse],
        queryFn: () => productosAlmacenApi.getAllByAlmacen(selectedWarehouse!),
        enabled: !!selectedWarehouse
    });

    const productos = productosResponse?.data || [];
    const filteredProductos = productos.filter((p: any) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fetch movimientos for selected warehouse
    const { data: movimientosResponse, isLoading: loadingMovimientos } = useQuery({
        queryKey: ['movimientos', selectedWarehouse],
        queryFn: () => movimientosAlmacenApi.getByAlmacen(selectedWarehouse!),
        enabled: !!selectedWarehouse && (viewMode === 'historial' || !!trackingProducto)
    });

    const movimientos = (movimientosResponse?.data || []).filter((m: any) => m.productoId && m.tipo);
    const filteredMovimientos = movimientos.filter((m: any) => {
        const p = productos.find((prod: any) => String(prod.id) === String(m.productoId));
        const productName = p?.nombre || m.productoId || 'Producto Desconocido';

        const matchesSearch =
            productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(m.responsable || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(m.guiaReferencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(m.proveedorTransporte || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(m.productoId || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = movimientoFilter === 'todos' ||
            (m.tipo && m.tipo.toLowerCase() === movimientoFilter);
        return matchesSearch && matchesFilter;
    }).sort((a: any, b: any) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return String(b.id || '').localeCompare(String(a.id || '')); // Fallback to ID sorting
    });

    // Mutations
    const createAlmacenMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await almacenesApi.create(data);
            if (!response.success) throw new Error(response.message || "Error al crear almacén");
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            toast({ title: "✅ Almacén creado" });
            speakSuccess();
            setIsAlmacenFormOpen(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
        }
    });

    const updateAlmacenMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await almacenesApi.update(id, data);
            if (!response.success) throw new Error(response.message || "Error al actualizar almacén");
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            toast({ title: "✅ Almacén actualizado" });
            setIsAlmacenFormOpen(false);
            setEditingAlmacen(null);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
        }
    });

    const deleteAlmacenMutation = useMutation({
        mutationFn: async ({ id, justification }: { id: string, justification: string }) => {
            const response = await almacenesApi.delete(id, { justificacion: justification });
            if (!response.success) throw new Error(response.message || "Error al eliminar almacén");
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            toast({ title: "✅ Almacén eliminado" });
            setSelectedWarehouse(null);
            setIsDeleteConfirmOpen(false);
            setItemToDelete(null);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
        }
    });

    const createProductoMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await productosAlmacenApi.create(data);
            if (!response.success) throw new Error(response.message || "Error al crear producto");

            if (data.esActivo) {
                const warehouseName = almacenes.find((a: any) => a.id === data.almacenId)?.nombre || 'Almacén';
                const assetData: any = {
                    nombre: data.nombre,
                    categoria: data.categoria,
                    ubicacion: warehouseName,
                    estado: 'operativo',
                    fechaAdquisicion: getLocalDate(),
                    valorInicial: data.valorUnitario,
                    responsable: user?.name || 'Sistema',
                    descripcion: data.descripcion || `Producto vinculado en ${warehouseName}`
                };

                await activosApi.create(assetData);
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            toast({ title: "✅ Entrada registrada", description: "El producto y su stock inicial se han guardado." });
            speakSuccess();
            setIsProductoFormOpen(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
        }
    });

    const updateProductoMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await productosAlmacenApi.update(id, data);
            if (!response.success) throw new Error(response.message || "Error al actualizar");
            return response;
        },
        onSuccess: (data) => {
            console.error('🚀 PROYCG MUTATION SUCCESS:', data);
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            toast({ title: "✅ Producto actualizado" });
            setIsProductoFormOpen(false);
            setEditingProducto(null);
        },
        onError: (error: any) => {
            console.error('🚀 PROYCG MUTATION ERROR:', error);
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
        }
    });

    const deleteProductoMutation = useMutation({
        mutationFn: async ({ id, justification }: { id: string, justification: string }) => {
            const producto = productos.find((p: any) => p.id === id);

            const response = await productosAlmacenApi.delete(id, { justificacion: justification });
            if (!response.success) throw new Error(response.message || "Error al eliminar");

            if (producto?.esActivo) {
                try {
                    const activosResponse = await activosApi.getAll();
                    if (activosResponse.success) {
                        const activo = activosResponse.data.find((a: Activo) =>
                            a.nombre === producto.nombre &&
                            a.categoria === producto.categoria
                        );
                        if (activo) {
                            await activosApi.delete(activo.id, { justificacion: `Eliminación automática por producto archivado: ${justification}` });
                            console.log('✅ Activo eliminado:', activo.id);
                        }
                    }
                } catch (error) {
                    console.error('Error eliminando activo:', error);
                }
            }

            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            queryClient.invalidateQueries({ queryKey: ['activos'] });
            toast({ title: "✅ Producto eliminado", description: "El producto y su activo asociado han sido eliminados." });
            setIsDeleteConfirmOpen(false);
            setItemToDelete(null);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
            setIsDeleteConfirmOpen(false);
        }
    });

    const createMovimientoMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await movimientosAlmacenApi.create(data);
            if (!response.success) throw new Error(response.message || "Error al registrar movimiento");
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            toast({ title: "✅ Movimiento registrado" });
            speakSuccess();
            setIsMovimientoFormOpen(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message });
        }
    });

    const handlePrint = useReactToPrint({
        contentRef: labelRef,
        documentTitle: `Rotulo-${printingProducto?.id || 'Producto'}`,
    });

    const handlePrintLabel = (producto: any) => {
        setPrintingProducto(producto);
        setTimeout(() => {
            if (handlePrint) handlePrint();
        }, 100);
    };

    const handleOpenMovimiento = (tipo: 'entrada' | 'salida' | 'traslado' | 'retorno' | 'baja', productoId: string | null = null) => {
        setMovimientoTipo(tipo);
        setSelectedProducto(productoId);
        if (!movimientoInitialData) setMovimientoInitialData(null);
        setIsMovimientoFormOpen(true);
    };

    const handleScanCode = (code: string) => {
        const found = productos.find((p: any) => p.id === code || p.id.toLowerCase() === code.toLowerCase());
        if (found) {
            setSearchTerm(code);
            toast({ title: "✅ Producto encontrado", description: `${found.nombre} (${found.id})` });
        } else {
            toast({ variant: "destructive", title: "❌ No encontrado", description: `Código ${code} no existe en este almacén.` });
        }
        setIsScannerOpen(false);
    };

    const totalAlmacenes = almacenes.length;
    const totalProductos = almacenes.reduce((sum: number, a: any) => sum + (a.totalProductos || 0), 0);
    const totalAlertas = almacenes.reduce((sum: number, a: any) => sum + (a.alertasStock || 0), 0);
    const totalInventoryValue = almacenes.reduce((sum: number, a: any) => sum + (a.valorInventario || 0), 0);

    const handleConfirmDelete = async (justification: string) => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'producto') {
            deleteProductoMutation.mutate({ id: itemToDelete.id, justification });
        } else if (itemToDelete.type === 'almacen') {
            deleteAlmacenMutation.mutate({ id: itemToDelete.id, justification });
        } else {
            await execute(
                auditoriaApi.create({
                    modulo: 'Almacenes',
                    accion: 'solicitud_eliminacion',
                    mensaje: JSON.stringify({
                        entity: itemToDelete.type,
                        id: itemToDelete.id,
                        name: itemToDelete.name || itemToDelete.id,
                        justification: justification
                    }),
                    tipo: 'warning',
                    usuario: user?.email || 'Usuario',
                    justificacion: justification
                }),
                {
                    successMessage: "Solicitud de eliminación enviada para aprobación.",
                    onSuccess: () => {
                        setIsDeleteConfirmOpen(false);
                        setItemToDelete(null);
                        queryClient.invalidateQueries({ queryKey: ['activity-alerts'] });
                    }
                }
            );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const getStockStatus = (cantidad: number, minimo: number) => {
        if (cantidad === 0) return { label: 'Sin Stock', color: 'text-destructive' };
        if (cantidad < minimo) return { label: 'Stock Bajo', color: 'text-warning' };
        return { label: 'Normal', color: 'text-success' };
    };

    const chartDataAlmacen = almacenes.map((a: any) => {
        if (a.valorInventario && a.valorInventario > 0) {
            return {
                name: a.nombre,
                value: a.valorInventario
            };
        }
        return {
            name: a.nombre,
            value: a.valorInventario || 0
        };
    }).filter(v => v.name);

    const categoryGroups: { [key: string]: number } = {};
    almacenes.forEach((a: any) => { });

    const chartDataCategory = Object.keys(categoryGroups).map(name => ({ name, value: categoryGroups[name] }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Almacenes e Inventario</h2>
                    <p className="text-xs text-muted-foreground">Gestión de bodegas e insumos</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-accent text-accent hover:bg-accent/10"
                        onClick={() => setIsGlobalSearchOpen(true)}
                    >
                        <Search className="w-4 h-4" />
                        BÚSQUEDA GLOBAL
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-accent text-accent hover:bg-accent/10"
                        onClick={() => setIsWarehouseSelectionOpen(true)}
                    >
                        <FileText className="w-4 h-4" />
                        GENERAR FORMULARIO EXCEL
                    </Button>
                    {canEdit && (
                        <Button
                            size="sm"
                            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={() => setIsAlmacenFormOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Almacén
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Almacenes" value={totalAlmacenes.toString()} icon={Warehouse} variant="default" />
                <KPICard title="Total Productos" value={totalProductos.toString()} icon={Package} variant="default" />
                <KPICard title="Alertas de Stock" value={totalAlertas.toString()} icon={AlertTriangle} variant="warning" subtitle="Requieren atención" />
                <KPICard title="Valor Inventario" value={formatCurrency(totalInventoryValue)} icon={TrendingUp} variant="success" subtitle="Valorización total" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 card-fuel rounded-xl border border-border p-4 h-[300px]">
                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        Valorización por Almacén
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartDataAlmacen}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="name" fontSize={9} tick={{ fill: '#888' }} axisLine={false} tickLine={false} interval={0} />
                            <YAxis fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '12px', color: '#f3f4f6' }}
                                itemStyle={{ color: '#f3f4f6' }}
                            />
                            <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} barSize={40} minPointSize={5} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card-fuel rounded-xl border border-border p-4 h-[300px]">
                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Package className="w-4 h-4 text-accent" />
                        Distribución de Valor
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={chartDataAlmacen}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={5}
                                dataKey="value"
                                minAngle={15}
                            >
                                {chartDataAlmacen.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', fontSize: '11px', color: '#f3f4f6' }}
                                itemStyle={{ color: '#f3f4f6' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {almacenes.map((almacen: any) => (
                    <div
                        key={almacen.id}
                        onClick={() => setSelectedWarehouse(selectedWarehouse === almacen.id ? null : almacen.id)}
                        className={cn(
                            "card-fuel rounded-xl border p-4 cursor-pointer transition-all hover:shadow-lg",
                            selectedWarehouse === almacen.id ? "border-primary bg-primary/5 shadow-md" : "border-border"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                    <Warehouse className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm line-clamp-1">{almacen.nombre}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{almacen.ubicacion}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {canEdit && (
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingAlmacen(almacen);
                                                setIsAlmacenFormOpen(true);
                                            }}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setItemToDelete({ id: almacen.id, type: 'almacen', name: almacen.nombre });
                                                setIsDeleteConfirmOpen(true);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                )}
                                {selectedWarehouse === almacen.id ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Productos:</span>
                                <span className="font-semibold">{almacen.totalProductos || 0}</span>
                            </div>
                            {almacen.alertasStock > 0 && (
                                <div className="flex items-center gap-1 text-xs text-warning">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Stock bajo detectado</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-success/30 text-success hover:bg-success/10 gap-1 h-8 text-[10px] font-bold px-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWarehouse(almacen.id);
                                    handleOpenMovimiento('entrada');
                                }}
                            >
                                <ArrowDownLeft className="w-3 h-3" />
                                ENTRADA
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-critical/30 text-critical hover:bg-critical/10 gap-1 h-8 text-[10px] font-bold px-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWarehouse(almacen.id);
                                    handleOpenMovimiento('salida');
                                }}
                            >
                                <ArrowUpRight className="w-3 h-3" />
                                SALIDA
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-1 h-8 text-[10px] font-bold px-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWarehouse(almacen.id);
                                    handleOpenMovimiento('traslado');
                                }}
                            >
                                <Package className="w-3 h-3" />
                                TRASLADO
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedWarehouse && (
                <div className="card-fuel rounded-xl border border-border p-6 animate-fade-in space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Package className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    {almacenes.find((a: any) => a.id === selectedWarehouse)?.nombre}
                                </h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <button
                                        onClick={() => setViewMode('existencias')}
                                        className={cn("text-sm transition-colors relative pb-1", viewMode === 'existencias' ? "text-primary font-bold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        📦 Existencias
                                    </button>
                                    <button
                                        onClick={() => setViewMode('historial')}
                                        className={cn("text-sm transition-colors relative pb-1", viewMode === 'historial' ? "text-primary font-bold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        🕒 Historial de Movimientos
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-accent text-accent hover:bg-accent/10 h-9"
                                onClick={() => {
                                    const whName = almacenes.find((a: any) => a.id === selectedWarehouse)?.nombre || 'Bodega';
                                    generateManualExitExcel(whName);
                                    toast({ title: "✅ Formulario Generado", description: "Se ha descargado el formulario de control de salida." });
                                }}
                            >
                                <FileText className="w-4 h-4" />
                                FORMULARIO SALIDA
                            </Button>
                            <div className="relative flex-1 sm:min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar en este almacén..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 bg-secondary/50"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsScannerOpen(true)}
                                className="gap-2 h-9"
                            >
                                <Camera className="w-4 h-4" />
                                Escanear
                            </Button>
                            {viewMode === 'historial' && (
                                <div className="flex border rounded-lg overflow-hidden h-9">
                                    {(['todos', 'entrada', 'salida'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setMovimientoFilter(f)}
                                            className={cn(
                                                "px-3 text-xs font-bold transition-colors",
                                                movimientoFilter === f ? "bg-accent text-accent-foreground" : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                                            )}
                                        >
                                            {f === 'todos' ? 'TODO' : f === 'entrada' ? 'ENTRADAS' : 'SALIDAS'}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {canEdit && (
                                <Button
                                    size="sm"
                                    className="gap-2 bg-accent text-accent-foreground"
                                    onClick={() => setIsProductoFormOpen(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Nuevo Producto
                                </Button>
                            )}
                        </div>
                    </div>

                    {viewMode === 'existencias' ? (
                        <div className="relative overflow-x-auto rounded-lg border border-border/50">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Producto</th>
                                        <th className="px-6 py-4 font-semibold">Categoría</th>
                                        <th className="px-6 py-4 font-semibold text-center">Stock</th>
                                        <th className="px-6 py-4 font-semibold text-center">En Uso</th>
                                        <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                        <th className="px-6 py-4 font-semibold text-right">Valor Unit.</th>
                                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredProductos.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">No hay productos que coincidan con la búsqueda.</td>
                                        </tr>
                                    ) : filteredProductos.map((producto: any) => {
                                        const status = getStockStatus(producto.cantidad, producto.stockMinimo);
                                        return (
                                            <tr key={producto.id} className="hover:bg-primary/5 transition-colors">
                                                <td className="px-6 py-4 font-medium">{producto.nombre}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold uppercase">{producto.categoria}</span></td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{Number(producto.cantidad) || 0}</span>
                                                        <span className="text-[10px] text-muted-foreground">{producto.unidad}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div
                                                        className={cn("flex flex-col transition-all", Number(producto.cantidadEnUso) > 0 && "cursor-pointer hover:scale-110")}
                                                        onClick={() => Number(producto.cantidadEnUso) > 0 && setTrackingProducto(producto)}
                                                    >
                                                        <span className={cn("font-bold", Number(producto.cantidadEnUso) > 0 ? "text-indigo-600 underline decoration-dotted underline-offset-4" : "text-muted-foreground")}>
                                                            {Number(producto.cantidadEnUso) || 0}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">{producto.unidad}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center"><span className={cn("text-xs font-semibold", status.color)}>{status.label}</span></td>
                                                <td className="px-6 py-4 text-right font-mono">{formatCurrency(producto.valorUnitario)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-success hover:bg-success/10"
                                                            onClick={() => handleOpenMovimiento('entrada', producto.id)}
                                                            title="Registrar Entrada"
                                                        >
                                                            <ArrowDownLeft className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-warning hover:bg-warning/10"
                                                            onClick={() => handleOpenMovimiento('salida', producto.id)}
                                                            title="Registrar Salida"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenMovimiento('traslado', producto.id); }}
                                                            title="Trasladar Producto"
                                                        >
                                                            <Package className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-600 transition-all duration-300 shadow-sm"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const payload = {
                                                                    activoId: producto.id,
                                                                    responsable: producto.responsable || user?.name || 'Responsable',
                                                                    fecha: new Date().toLocaleDateString('es-CL'),
                                                                    cargo: 'Responsable de Inventario',
                                                                    equipo: producto.nombre,
                                                                    serie: producto.id,
                                                                    marca: producto.marca,
                                                                    modelo: producto.modelo
                                                                };

                                                                await execute(actasApi.generateCargo(payload), {
                                                                    successMessage: "✅ Hoja de Cargo generada correctamente.",
                                                                    onSuccess: () => triggerPrint(payload)
                                                                });
                                                            }}
                                                            title="Generar e Imprimir Hoja de Cargo"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </Button>
                                                        {producto.esRetornable && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/10"
                                                                onClick={(e) => { e.stopPropagation(); handleOpenMovimiento('retorno', producto.id); }}
                                                                title="Retorno a Bodega"
                                                            >
                                                                <ArrowDownLeft className="w-4 h-4 rotate-45" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenMovimiento('baja', producto.id); }}
                                                            title="Dar de Baja"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-400 border-slate-200"
                                                            onClick={() => handlePrintLabel(producto)}
                                                            title="Imprimir rótulo de Inventario"
                                                        >
                                                            <Search className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-400 border-blue-400/30" onClick={() => { setEditingProducto(producto); setIsProductoFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => {
                                                                setItemToDelete({ id: producto.id, type: 'producto', name: producto.nombre });
                                                                setIsDeleteConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto rounded-lg border border-border/50">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Fecha</th>
                                        <th className="px-6 py-4 font-semibold">Tipo</th>
                                        <th className="px-6 py-4 font-semibold">Producto</th>
                                        <th className="px-6 py-4 font-semibold text-center">Cant.</th>
                                        <th className="px-6 py-4 font-semibold">Responsable</th>
                                        <th className="px-6 py-4 font-semibold">Ref.</th>
                                        <th className="px-6 py-4 font-semibold">Prov./Destino</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredMovimientos.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground italic">No se encontraron movimientos registrados.</td>
                                        </tr>
                                    ) : filteredMovimientos.map((m: any) => {
                                        const p = productos.find((prod: any) => prod.id === m.productoId);
                                        const almacenOrigen = almacenes.find((a: any) => a.id === m.almacenOrigen);
                                        const almacenDestino = almacenes.find((a: any) => a.id === m.almacenDestino);

                                        return (
                                            <tr key={m.id} className="hover:bg-primary/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(m.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago' })}</td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                        m.tipo.toLowerCase() === 'entrada' ? "bg-success/10 text-success" :
                                                            m.tipo.toLowerCase() === 'salida' ? "bg-critical/10 text-critical" :
                                                                m.tipo.toLowerCase() === 'retorno' ? "bg-blue-100 text-blue-800" :
                                                                    m.tipo.toLowerCase() === 'baja' ? "bg-destructive/10 text-destructive" :
                                                                        "bg-gray-100 text-gray-800"
                                                    )}>
                                                        {m.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{p?.nombre || m.productoId}</td>
                                                <td className="px-6 py-4 text-center font-bold">{m.cantidad}</td>
                                                <td className="px-6 py-4">{m.responsable}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{m.guiaReferencia || '-'}</span>
                                                        {m.proveedorTransporte && (
                                                            <span className="text-[10px] text-muted-foreground italic">{m.proveedorTransporte}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {m.tipo.toLowerCase() === 'entrada'
                                                        ? 'Entrada Local'
                                                        : m.tipo.toLowerCase() === 'salida'
                                                            ? almacenOrigen?.nombre || m.almacenOrigen || '-'
                                                            : m.tipo.toLowerCase() === 'traslado'
                                                                ? `${almacenOrigen?.nombre || m.almacenOrigen || '?'} → ${almacenDestino?.nombre || m.almacenDestino || '?'}`
                                                                : '-'
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <ProductTrackingDialog
                isOpen={!!trackingProducto}
                onClose={() => setTrackingProducto(null)}
                producto={trackingProducto}
                movimientos={movimientos}
                isLoading={loadingMovimientos}
                onReturn={(responsable, cantidad) => {
                    if (trackingProducto) {
                        const productId = trackingProducto.id;
                        setTrackingProducto(null);
                        setTimeout(() => {
                            setMovimientoInitialData({ responsable, cantidad });
                            setMovimientoTipo('retorno');
                            setSelectedProducto(productId);
                            setIsMovimientoFormOpen(true);
                        }, 100);
                    }
                }}
            />

            <AlmacenForm
                open={isAlmacenFormOpen}
                onClose={() => { setIsAlmacenFormOpen(false); setEditingAlmacen(null); }}
                initialData={editingAlmacen}
                onSubmit={(data) => editingAlmacen ? updateAlmacenMutation.mutate({ id: editingAlmacen.id, data }) : createAlmacenMutation.mutate(data)}
            />

            {selectedWarehouse && (
                <ProductoForm
                    open={isProductoFormOpen}
                    onClose={() => { setIsProductoFormOpen(false); setEditingProducto(null); }}
                    initialData={editingProducto}
                    onSubmit={(data) => editingProducto ? updateProductoMutation.mutate({ id: editingProducto.id, data }) : createProductoMutation.mutate(data)}
                    almacenId={selectedWarehouse}
                />
            )}

            {isMovimientoFormOpen && selectedWarehouse && !selectedProducto && (
                <Dialog open={isMovimientoFormOpen} onOpenChange={setIsMovimientoFormOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {movimientoTipo === 'entrada' && <ArrowDownLeft className="text-success" />}
                                {movimientoTipo === 'salida' && <ArrowUpRight className="text-critical" />}
                                {movimientoTipo === 'retorno' && <ArrowDownLeft className="text-blue-600 rotate-45" />}
                                {movimientoTipo === 'baja' && <AlertTriangle className="text-destructive" />}
                                {movimientoTipo === 'traslado' && <Package className="text-primary" />}
                                {movimientoTipo === 'entrada' ? 'Registrar Entrada' :
                                    movimientoTipo === 'salida' ? 'Registrar Salida' :
                                        movimientoTipo === 'retorno' ? 'Registrar Retorno' :
                                            movimientoTipo === 'baja' ? 'Registrar Baja' : 'Registrar Traslado'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            {movimientoTipo === 'entrada' && (
                                <Button
                                    className="w-full bg-accent text-accent-foreground gap-2 h-12 text-base font-bold"
                                    onClick={() => {
                                        setIsMovimientoFormOpen(false);
                                        setIsProductoFormOpen(true);
                                    }}
                                >
                                    <Plus className="w-5 h-5" />
                                    NUEVO PRODUCTO (CREAR)
                                </Button>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">O seleccionar existente</span>
                                </div>
                            </div>

                            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                                {productos.map((producto: any) => (
                                    <Button
                                        key={producto.id}
                                        variant="outline"
                                        className="justify-start h-auto py-3 px-4 hover:border-accent hover:text-accent group"
                                        onClick={() => handleOpenMovimiento(movimientoTipo, producto.id)}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-bold text-sm">{producto.nombre}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{producto.categoria}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold block">{Number(producto.cantidad) || 0} {producto.unidad}</span>
                                                <span className="text-[10px] text-muted-foreground">En Stock</span>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                                {productos.length === 0 && (
                                    <p className="text-center py-8 text-muted-foreground italic text-sm">No hay productos en este almacén.</p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {selectedWarehouse && selectedProducto && (
                <MovimientoForm
                    open={isMovimientoFormOpen}
                    onClose={() => {
                        setIsMovimientoFormOpen(false);
                        setSelectedProducto(null);
                        setMovimientoInitialData(null);
                    }}
                    onSubmit={(data) => createMovimientoMutation.mutate(data)}
                    almacenId={selectedWarehouse}
                    productoId={selectedProducto}
                    tipo={movimientoTipo}
                    almacenes={almacenes}
                    isRetornable={productos.find((p: any) => p.id === selectedProducto)?.esRetornable}
                    initialData={movimientoInitialData}
                />
            )}
            <Dialog open={isWarehouseSelectionOpen} onOpenChange={setIsWarehouseSelectionOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-accent" />
                            Seleccionar Almacén
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="grid gap-2">
                            {almacenes.map((almacen: any) => (
                                <Button
                                    key={almacen.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3 px-4"
                                    onClick={() => {
                                        generateInventoryExcel(almacen.nombre);
                                        setIsWarehouseSelectionOpen(false);
                                        toast({ title: "✅ Archivo generado" });
                                    }}
                                >
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="font-bold">{almacen.nombre}</span>
                                        <span className="text-xs text-muted-foreground">Ubicación: {almacen.ubicacion}</span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <GlobalProductSearchDialog
                open={isGlobalSearchOpen}
                onClose={() => setIsGlobalSearchOpen(false)}
            />

            <BarcodeScanner
                open={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScanCode}
            />

            <ConfirmDeleteWithJustificationDialog
                open={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                isLoading={deleteAlmacenMutation.isPending || deleteProductoMutation.isPending || isActionLoading}
                title={itemToDelete?.type === 'almacen' ? "¿Eliminar Almacén?" : "¿Eliminar Producto?"}
                description={itemToDelete?.type === 'almacen'
                    ? "Esta acción eliminará el almacén y podría afectar los registros de productos asociados. Se requiere una justificación."
                    : "Esta acción eliminará el producto y su activo asociado (si existe). Se requiere una justificación."}
                itemName={itemToDelete?.name}
                isAdmin={isAdmin}
                isCritical={true}
            />

            {/* Componente de Impresión (Fuera del visor normal pero no hidden para react-to-print) */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                {printingData && (
                    <PrintableCargoForm ref={printRef} data={printingData} />
                )}
            </div>

            {/* Rótulo para Imprimir (oculto) */}
            <div className="hidden">
                {printingProducto && (
                    <ProductLabel ref={labelRef} producto={printingProducto} showBoth={true} />
                )}
            </div>
        </div>
    );
}

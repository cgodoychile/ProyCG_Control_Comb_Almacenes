import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    consumosApi, vehiculosApi, mantencionesApi, almacenesApi, estanquesApi,
    cargasApi, productosAlmacenApi as productsApi, movimientosAlmacenApi
} from '@/lib/apiService';
import { generatePDF } from '@/utils/pdfExport';
import { generateExcel } from '@/utils/excelExport';
import { Button } from '@/components/ui/button';
import {
    FileText, Download, FileSpreadsheet, Calendar, TrendingUp,
    Gauge, AlertTriangle, Fuel, BarChart3, Table as TableIcon,
    ChevronDown, Filter, Search, Wrench, FileCheck
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { format, startOfMonth, startOfYear, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import enelLogo from '@/assets/enel-logo.png';

const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

export function ReportesModule() {
    const [selectedReport, setSelectedReport] = useState<string>('consumo');
    const [viewMode, setViewMode] = useState<'stats' | 'table'>('stats');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [selectedEstanque, setSelectedEstanque] = useState<string>('all');

    // Fetch data
    const { data: consumosData } = useQuery({ queryKey: ['consumos'], queryFn: () => consumosApi.getAll() });
    const { data: vehiculosData } = useQuery({ queryKey: ['vehiculos'], queryFn: () => vehiculosApi.getAll() });
    const { data: mantencionesData } = useQuery({ queryKey: ['mantenciones'], queryFn: () => mantencionesApi.getAll() });
    const { data: almacenesData } = useQuery({ queryKey: ['almacenes'], queryFn: () => almacenesApi.getAll() });
    const { data: estanquesData } = useQuery({ queryKey: ['estanques'], queryFn: () => estanquesApi.getAll() });
    const { data: cargasData } = useQuery({ queryKey: ['cargas'], queryFn: () => cargasApi.getAll() });
    const { data: productosData } = useQuery({ queryKey: ['productos'], queryFn: () => productsApi.getAll() });
    const { data: movimientosAlmacenData } = useQuery({ queryKey: ['movimientosAlmacen'], queryFn: () => movimientosAlmacenApi.getAll() });

    const consumos = (consumosData as any)?.data || [];
    const vehiculos = (vehiculosData as any)?.data || [];
    const mantenciones = (mantencionesData as any)?.data || [];
    const almacenes = (almacenesData as any)?.data || [];
    const estanques = (estanquesData as any)?.data || [];
    const cargas = (cargasData as any)?.data || [];
    const productos = (productosData as any)?.data || [];
    const movimientos = (movimientosAlmacenData as any)?.data || [];

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return format(date, 'dd-MM-yyyy');
        } catch {
            return dateStr;
        }
    };

    const previewData = useMemo(() => {
        let items = [];
        let dateField = 'fecha';

        switch (selectedReport) {
            case 'consumo': items = [...consumos]; dateField = 'fecha'; break;
            case 'cargas': items = [...cargas]; dateField = 'fecha'; break;
            case 'mantenciones': items = [...mantenciones]; dateField = 'fechaIngreso'; break;
            case 'vehiculos': items = [...vehiculos]; dateField = ''; break;
            case 'almacenes': items = [...almacenes]; dateField = ''; break;
            case 'estanques': items = [...estanques]; dateField = ''; break;
            default: items = [];
        }

        // Apply Estanque Filter if applicable
        if (selectedEstanque !== 'all') {
            if (selectedReport === 'consumo' || selectedReport === 'cargas') {
                items = items.filter(item => item.estanque === selectedEstanque);
            }
        }

        if (!dateFrom && !dateTo) return items;

        return items.filter(item => {
            if (!dateField || !item[dateField]) return true;
            const date = parseISO(item[dateField]);
            if (isNaN(date.getTime())) return true;
            if (dateFrom && date < parseISO(dateFrom)) return false;
            if (dateTo) {
                const limit = parseISO(dateTo);
                limit.setHours(23, 59, 59, 999);
                if (date > limit) return false;
            }
            return true;
        }).sort((a, b) => {
            if (!dateField) return 0;
            const dA = a[dateField] ? new Date(a[dateField]).getTime() : 0;
            const dB = b[dateField] ? new Date(b[dateField]).getTime() : 0;
            return dB - dA;
        });
    }, [selectedReport, consumos, vehiculos, mantenciones, almacenes, estanques, cargas, dateFrom, dateTo, selectedEstanque]);

    // Consumo Stats
    const stats = useMemo(() => {
        if (selectedReport === 'consumo') {
            const totalLitros = previewData.reduce((acc, curr) => acc + (curr.litrosUsados || 0), 0);
            const rendimientosValidos = previewData.filter(c => c.rendimiento > 0);
            const avgRendimiento = rendimientosValidos.length > 0
                ? rendimientosValidos.reduce((acc, curr) => acc + curr.rendimiento, 0) / rendimientosValidos.length
                : 0;

            const cargasExcesivas = previewData.filter(c => c.litrosUsados > 80 && c.litrosUsados <= 100).length;
            const cargasCriticas = previewData.filter(c => c.litrosUsados > 100).length;

            // Daily chart data
            const dateGroups: { [key: string]: number } = {};
            previewData.forEach(c => {
                const d = formatDate(c.fecha);
                dateGroups[d] = (dateGroups[d] || 0) + (c.litrosUsados || 0);
            });
            const chartDataByDate = Object.keys(dateGroups).map(date => ({ date, litros: dateGroups[date] }))
                .sort((a, b) => {
                    const [d1, m1, y1] = a.date.split('-').map(Number);
                    const [d2, m2, y2] = b.date.split('-').map(Number);
                    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
                })
                .slice(-15);

            // Vehicle chart data
            const vehicleGroups: { [key: string]: number } = {};
            previewData.forEach(c => {
                const v = c.vehiculo || 'Otros';
                vehicleGroups[v] = (vehicleGroups[v] || 0) + (c.litrosUsados || 0);
            });
            const chartDataByVehicle = Object.keys(vehicleGroups)
                .map(patent => ({ patent, litros: vehicleGroups[patent] }))
                .sort((a, b) => b.litros - a.litros)
                .slice(0, 10);

            // Estanque Distribution Chart
            const estanqueGroups: { [key: string]: number } = {};
            previewData.forEach(c => {
                const e = c.estanque || 'No asignado';
                estanqueGroups[e] = (estanqueGroups[e] || 0) + (c.litrosUsados || 0);
            });
            const chartDataByEstanque = Object.keys(estanqueGroups).map(name => ({ name, value: estanqueGroups[name] }));

            // Status Distribution
            const normal = previewData.filter(c => c.litrosUsados <= 80).length;
            const chartDataByStatus = [
                { name: 'Normal (<=80L)', value: normal },
                { name: 'Excesivo (>80L)', value: cargasExcesivas },
                { name: 'Crítico (>100L)', value: cargasCriticas }
            ].filter(v => v.value > 0);

            return {
                totalLitros,
                avgRendimiento,
                cargasCriticas,
                cargasExcesivas,
                chartDataByDate,
                chartDataByVehicle,
                chartDataByStatus,
                chartDataByEstanque
            };
        }

        if (selectedReport === 'almacenes') {
            const totalItems = productos.reduce((acc, curr) => acc + (curr.stockActual || 0), 0);
            const lowStockCount = productos.filter(p => p.stockActual <= p.stockMinimo).length;

            // Stock by Warehouse
            const stockByAlmacen: { [key: string]: number } = {};
            productos.forEach(p => {
                const a = almacenes.find(alm => alm.id === p.almacenId)?.nombre || 'Desconocido';
                stockByAlmacen[a] = (stockByAlmacen[a] || 0) + (p.stockActual || 0);
            });
            const chartDataAlmacen = Object.keys(stockByAlmacen).map(name => ({ name, value: stockByAlmacen[name] }));

            // Movements Trends (Last 30 days)
            const movementGroups: { [key: string]: { entrado: number, salido: number } } = {};
            movimientos.forEach(m => {
                const d = formatDate(m.fecha);
                if (!movementGroups[d]) movementGroups[d] = { entrado: 0, salido: 0 };
                if (m.tipo === 'Entrada') movementGroups[d].entrado += (m.cantidad || 0);
                else movementGroups[d].salido += (m.cantidad || 0);
            });
            const chartDataMovements = Object.keys(movementGroups).map(date => ({
                date,
                entrado: movementGroups[date].entrado,
                salido: movementGroups[date].salido
            })).sort((a: any, b: any) => {
                const [d1, m1, y1] = a.date.split('-').map(Number);
                const [d2, m2, y2] = b.date.split('-').map(Number);
                return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
            }).slice(-15);

            // Categories
            const catGroups: { [key: string]: number } = {};
            productos.forEach(p => {
                const c = p.categoria || 'Sin Categoría';
                catGroups[c] = (catGroups[c] || 0) + 1;
            });
            const chartDataCategories = Object.keys(catGroups).map(name => ({ name, value: catGroups[name] }));

            return {
                totalItems,
                lowStockCount,
                chartDataAlmacen,
                chartDataMovements,
                chartDataCategories
            };
        }

        if (selectedReport === 'cargas') {
            const totalLitros = previewData.reduce((acc, curr) => acc + (curr.litros || 0), 0);
            const totalCosto = previewData.reduce((acc, curr) => acc + (curr.costoTotal || 0), 0);
            const count = previewData.length;
            const avgLitrosCarga = count > 0 ? totalLitros / count : 0;

            const dateGroups: { [key: string]: number } = {};
            previewData.forEach(c => {
                const d = formatDate(c.fecha);
                dateGroups[d] = (dateGroups[d] || 0) + (c.litros || 0);
            });
            const chartDataByDate = Object.keys(dateGroups).map(date => ({ date, litros: dateGroups[date] }))
                .sort((a, b) => {
                    const [d1, m1, y1] = a.date.split('-').map(Number);
                    const [d2, m2, y2] = b.date.split('-').map(Number);
                    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
                })
                .slice(-15);

            const estanqueGroups: { [key: string]: number } = {};
            previewData.forEach(c => {
                const e = c.estanque || 'Otros';
                estanqueGroups[e] = (estanqueGroups[e] || 0) + (c.litros || 0);
            });
            const chartDataByEstanque = Object.keys(estanqueGroups).map(name => ({ name, value: estanqueGroups[name] }));

            return {
                totalLitros,
                totalCosto,
                count,
                avgLitrosCarga,
                chartDataByDate,
                chartDataByEstanque
            };
        }

        if (selectedReport === 'mantenciones') {
            const totalCosto = previewData.reduce((acc, curr) => acc + (curr.costo || 0), 0);
            const count = previewData.length;
            const avgCosto = count > 0 ? totalCosto / count : 0;

            const typeGroups: { [key: string]: number } = {};
            previewData.forEach(m => {
                const t = m.tipoMantencion || 'General';
                typeGroups[t] = (typeGroups[t] || 0) + (m.costo || 0);
            });
            const chartDataByType = Object.keys(typeGroups).map(name => ({ name, value: typeGroups[name] }));

            const vehicleGroups: { [key: string]: number } = {};
            previewData.forEach(m => {
                const v = m.vehiculo || 'Otros';
                vehicleGroups[v] = (vehicleGroups[v] || 0) + (m.costo || 0);
            });
            const chartDataByVehicle = Object.keys(vehicleGroups)
                .map(patent => ({ patent, costo: vehicleGroups[patent] }))
                .sort((a, b) => b.costo - a.costo)
                .slice(0, 10);

            return {
                totalCosto,
                count,
                avgCosto,
                chartDataByType,
                chartDataByVehicle
            };
        }

        return null;
    }, [selectedReport, previewData, productos, almacenes, movimientos]);

    const handleExportPDF = async () => {
        let data: any[] = [];
        let columns: string[] = [];
        let title = '';

        switch (selectedReport) {
            case 'consumo':
                title = 'Reporte de Consumo';
                columns = ['Fecha', 'Vehículo', 'Estanque', 'Litros', 'Persona', 'Responsable', 'Justificación'];
                data = previewData.map(c => [
                    formatDate(c.fecha),
                    c.vehiculo,
                    c.estanque || '-',
                    c.litrosUsados,
                    c.empresa || '-',
                    c.responsable || '-',
                    c.observaciones || '-'
                ]);
                break;
            case 'cargas':
                title = 'Reporte de Cargas de Estanques';
                columns = ['Fecha', 'Estanque', 'Litros', 'Guía', 'Proveedor', 'Responsable'];
                data = previewData.map(c => [
                    formatDate(c.fecha),
                    c.estanque,
                    c.litros,
                    c.numeroGuia || '-',
                    c.proveedor || '-',
                    c.responsable || '-'
                ]);
                break;
            case 'vehiculos':
                title = 'Reporte de Vehículos';
                columns = ['Patente', 'Modelo', 'Año', 'Estado'];
                data = vehiculos.map(v => [v.id || '', v.modelo || '', v.anio || '', v.estado || '']);
                break;
            case 'mantenciones':
                title = 'Reporte de Mantenciones';
                columns = ['Fecha', 'Vehículo', 'Tipo', 'Km', 'Costo', 'Responsable', 'Descripción'];
                data = previewData.map(m => [
                    formatDate(m.fechaIngreso),
                    m.vehiculo,
                    m.tipoMantencion,
                    m.kilometraje || '-',
                    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(m.costo || 0),
                    m.responsable || '-',
                    m.descripcion || '-'
                ]);
                break;
            case 'almacenes':
                title = 'Reporte de Inventario';
                columns = ['Almacén', 'Ubicación', 'Productos', 'Alertas'];
                data = almacenes.map(a => [a.nombre, a.ubicacion, a.totalProductos, a.alertasStock]);
                break;
            case 'estanques':
                title = 'Reporte de Estanques';
                columns = ['Nombre', 'Ubicación', 'Capacidad', 'Stock Actual'];
                data = estanques.map(e => [e.nombre, e.ubicacion, e.capacidadTotal, e.stockActual]);
                break;
        }

        generatePDF(title, data, columns);
    };

    const handleExportExcel = () => {
        let data: any[] = [];
        let title = '';

        switch (selectedReport) {
            case 'consumo':
                title = 'Consumo';
                data = previewData.map(c => ({
                    Fecha: formatDate(c.fecha),
                    Vehiculo: c.vehiculo,
                    Estanque: c.estanque,
                    Litros: c.litrosUsados,
                    Persona: c.empresa,
                    Responsable: c.responsable,
                    Justificacion: c.observaciones
                }));
                break;
            case 'cargas':
                title = 'Cargas_Estanques';
                data = previewData.map(c => ({
                    Fecha: formatDate(c.fecha),
                    Estanque: c.estanque,
                    Litros: c.litros,
                    Guia: c.numeroGuia,
                    Proveedor: c.proveedor,
                    Responsable: c.responsable
                }));
                break;
            case 'vehiculos':
                title = 'Vehiculos';
                data = vehiculos.map(v => ({
                    Patente: v.id,
                    Marca: v.marca,
                    Modelo: v.modelo,
                    Año: v.anio,
                    Estado: v.estado,
                    Kilometraje: v.kilometraje,
                    Responsable: v.responsable,
                    Ubicacion: v.ubicacion
                }));
                break;
            case 'mantenciones':
                title = 'Mantenciones';
                data = previewData.map(m => ({ ...m, fechaIngreso: formatDate(m.fechaIngreso) }));
                break;
            case 'almacenes':
                title = 'Almacenes';
                data = almacenes;
                break;
            case 'estanques':
                title = 'Estanques';
                data = estanques;
                break;
        }

        generateExcel(title, data);
    };

    const reports = [
        { id: 'consumo', name: 'Consumo de Combustible', icon: TrendingUp, color: 'text-primary' },
        { id: 'cargas', name: 'Cargas de Estanques', icon: Fuel, color: 'text-info' },
        { id: 'vehiculos', name: 'Flota de Vehículos', icon: FileText, color: 'text-success' },
        { id: 'mantenciones', name: 'Mantenciones', icon: Calendar, color: 'text-warning' },
        { id: 'almacenes', name: 'Inventario de Almacenes', icon: FileSpreadsheet, color: 'text-accent' },
        { id: 'estanques', name: 'Estanques de Petróleo', icon: Download, color: 'text-info' },
    ];

    return (
        <div className="space-y-6">
            {/* Professional Header with Enel Logo */}
            <div className="bg-background border border-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-6">
                    <img src={enelLogo} alt="Enel Logo" className="h-10 object-contain" />
                    <div className="h-10 w-[1px] bg-border hidden md:block" />
                    <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">INFORMES DE GESTIÓN</h2>
                        <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest flex items-center gap-2">
                            Unidad de Control de Energía <Badge variant="outline" className="text-[10px] py-0">ENEL 2026</Badge>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg border">
                    <Button
                        variant={viewMode === 'stats' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('stats')}
                        className="gap-2 text-xs"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Estadísticas
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="gap-2 text-xs"
                    >
                        <TableIcon className="w-4 h-4" />
                        Datos
                    </Button>
                </div>
            </div>

            {/* Selector de Reporte */}
            <div className="flex bg-secondary/30 p-1 rounded-lg border border-border">
                {reports.map(report => (
                    <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${selectedReport === report.id
                            ? 'bg-background text-primary shadow-md border border-border'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <report.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{report.name}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel de Filtros */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="card-fuel p-5 space-y-4 shadow-sm border-border/50">
                        <div className="flex items-center gap-2 text-sm font-black text-foreground mb-2">
                            <Filter className="w-4 h-4 text-primary" />
                            FILTROS DINÁMICOS
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase font-black">Periodo Inicial</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase font-black">Periodo Final</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            {(selectedReport === 'consumo' || selectedReport === 'cargas') && (
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-[10px] text-muted-foreground uppercase font-black">Filtrar por Estanque</label>
                                    <Select value={selectedEstanque} onValueChange={setSelectedEstanque}>
                                        <SelectTrigger className="bg-secondary/50 h-10">
                                            <SelectValue placeholder="Todos los estanques" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los estanques</SelectItem>
                                            {estanques.map((est: any) => (
                                                <SelectItem key={est.id} value={est.nombre}>{est.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] font-bold uppercase tracking-wider h-8"
                            onClick={() => { setDateFrom(''); setDateTo(''); setSelectedEstanque('all'); }}
                        >
                            Restablecer Filtros
                        </Button>
                    </div>

                    <div className="card-fuel p-5 bg-primary/5 border-primary/20 shadow-inner">
                        <h4 className="text-[10px] font-black text-primary uppercase mb-4 tracking-widest flex items-center gap-2">
                            <Download className="w-3 h-3" />
                            EXPORTAR RESULTADOS
                        </h4>
                        <div className="space-y-2">
                            <Button onClick={handleExportPDF} className="w-full gap-2 bg-critical hover:bg-critical/90 shadow-sm">
                                <FileText className="w-4 h-4" />
                                Generar PDF
                            </Button>
                            <Button onClick={handleExportExcel} variant="outline" className="w-full gap-2 border-success/30 text-success hover:bg-success/5">
                                <FileSpreadsheet className="w-4 h-4" />
                                Generar Excel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Área de Contenido Principal */}
                <div className="lg:col-span-3 space-y-6">
                    {viewMode === 'stats' && selectedReport === 'consumo' && stats ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <KPICard
                                    title="Litros Totales"
                                    value={`${stats.totalLitros.toLocaleString()} L`}
                                    icon={Fuel}
                                    variant="accent"
                                />
                                <KPICard
                                    title="Rendimiento Medio"
                                    value={`${stats.avgRendimiento.toFixed(2)} km/L`}
                                    icon={Gauge}
                                    variant="success"
                                />
                                <KPICard
                                    title="Cargas Excesivas"
                                    value={stats.cargasExcesivas}
                                    subtitle="> 80 Litros"
                                    icon={AlertTriangle}
                                    variant="warning"
                                />
                                <KPICard
                                    title="Cargas Críticas"
                                    value={stats.cargasCriticas}
                                    subtitle="> 100 Litros"
                                    icon={AlertTriangle}
                                    variant="destructive"
                                />
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Evolución Temporal */}
                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[350px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Evolución del Consumo (L)</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.chartDataByDate}>
                                                <defs>
                                                    <linearGradient id="colorLitros" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef7d00" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#ef7d00" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                <YAxis fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                                    itemStyle={{ color: '#ef7d00' }}
                                                />
                                                <Area type="monotone" dataKey="litros" stroke="#ef7d00" fillOpacity={1} fill="url(#colorLitros)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribución por Vehículo */}
                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[350px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Top 10 Vehículos (Patentes)</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.chartDataByVehicle} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="patent" type="category" fontSize={9} tick={{ fill: '#ddd' }} width={70} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                                />
                                                <Bar dataKey="litros" fill="#0088FE" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribución por Estanque */}
                                <div className="card-fuel p-6 border-border/50 shadow-sm md:col-span-2">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Consumo por Estanque (L)</h4>
                                        <div className="flex gap-4">
                                            {stats.chartDataByEstanque.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-[200px] w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.chartDataByEstanque}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                <YAxis fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                                />
                                                <Bar dataKey="value" fill="#00C49F" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribución de Cargas */}
                                <div className="card-fuel p-6 border-border/50 shadow-sm md:col-span-2">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Analítica de Cargas Atípicas</h4>
                                        <div className="flex gap-4">
                                            {stats.chartDataByStatus.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-[200px] w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.chartDataByStatus}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {stats.chartDataByStatus.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'stats' && selectedReport === 'almacenes' && stats ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <KPICard
                                    title="Stock Total Items"
                                    value={stats.totalItems.toLocaleString()}
                                    icon={TableIcon}
                                    variant="accent"
                                />
                                <KPICard
                                    title="Alertas Stock Bajo"
                                    value={stats.lowStockCount}
                                    icon={AlertTriangle}
                                    variant="destructive"
                                />
                                <KPICard
                                    title="Almacenes Activos"
                                    value={almacenes.length}
                                    icon={FileSpreadsheet}
                                    variant="success"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[350px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Tendencias de Movimientos</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.chartDataMovements}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                <YAxis fontSize={10} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                                                <Legend iconType="circle" />
                                                <Area type="monotone" dataKey="entrado" stroke="#00C49F" fill="#00C49F" fillOpacity={0.1} name="Entradas" />
                                                <Area type="monotone" dataKey="salido" stroke="#FF8042" fill="#FF8042" fillOpacity={0.1} name="Salidas" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[350px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Stock por Almacén</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.chartDataAlmacen}
                                                    outerRadius={80}
                                                    labelLine={false}
                                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    dataKey="value"
                                                >
                                                    {stats.chartDataAlmacen.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'stats' && selectedReport === 'cargas' && stats ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KPICard title="Total Recargas" value={stats.count} icon={Fuel} variant="accent" />
                                <KPICard title="Litros Ingresados" value={`${stats.totalLitros.toLocaleString()} L`} icon={TrendingUp} variant="success" />
                                <KPICard title="Inversión Combustible" value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.totalCosto)} icon={FileCheck} variant="default" />
                                <KPICard title="Promedio x Carga" value={`${Math.round(stats.avgLitrosCarga)} L`} icon={Gauge} variant="default" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[350px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Evolución de Recargas (L)</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.chartDataByDate}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#888' }} axisLine={false} />
                                                <YAxis fontSize={10} tick={{ fill: '#888' }} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                                <Area type="monotone" dataKey="litros" stroke="#00C49F" fill="#00C49F" fillOpacity={0.1} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[350px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Distribución por Estanque</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.chartDataByEstanque}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#888' }} />
                                                <YAxis fontSize={10} tick={{ fill: '#888' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                                <Bar dataKey="value" fill="#ef7d00" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'stats' && selectedReport === 'mantenciones' && stats ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <KPICard title="Mantenciones Realizadas" value={stats.count} icon={Wrench} variant="accent" />
                                <KPICard title="Costo Total" value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.totalCosto)} icon={TrendingUp} variant="success" />
                                <KPICard title="Ticket Promedio" value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.avgCosto)} icon={Gauge} variant="default" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[400px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Inversión por Vehículo (Top 10)</h4>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.chartDataByVehicle} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="patent" type="category" fontSize={10} tick={{ fill: '#ddd' }} width={80} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                                <Bar dataKey="costo" fill="#FF8042" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card-fuel p-6 border-border/50 shadow-sm min-h-[400px]">
                                    <h4 className="text-sm font-black mb-6 uppercase tracking-wider text-muted-foreground">Distribución por Tipo</h4>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                                                <Pie
                                                    data={stats.chartDataByType}
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {stats.chartDataByType.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-fuel p-0 overflow-hidden flex flex-col h-[600px] border-border/50 shadow-lg animate-fade-in">
                            <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
                                <h3 className="text-xs font-black flex items-center gap-2 tracking-widest text-foreground">
                                    <TableIcon className="w-4 h-4 text-primary" />
                                    DETALLE DE OPERACIONES: {reports.find(r => r.id === selectedReport)?.name.toUpperCase()}
                                </h3>
                                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                                    {previewData.length} REGISTROS
                                </Badge>
                            </div>

                            <div className="flex-1 overflow-auto p-0 scrollbar-thin">
                                <table className="data-table text-[11px]">
                                    <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
                                        <tr className="border-b-2 border-border">
                                            {selectedReport === 'consumo' && (
                                                <>
                                                    <th>Fecha</th>
                                                    <th>Vehículo</th>
                                                    <th>Estanque</th>
                                                    <th className="text-right">Litros</th>
                                                    <th>Persona</th>
                                                    <th>Justificación</th>
                                                </>
                                            )}
                                            {selectedReport === 'cargas' && (
                                                <>
                                                    <th>Fecha</th>
                                                    <th>Estanque</th>
                                                    <th className="text-right">Litros</th>
                                                    <th>Guía</th>
                                                    <th>Proveedor</th>
                                                </>
                                            )}
                                            {selectedReport === 'vehiculos' && (
                                                <>
                                                    <th>Patente</th>
                                                    <th>Modelo</th>
                                                    <th>Estado</th>
                                                    <th className="text-right">Kilometraje</th>
                                                </>
                                            )}
                                            {selectedReport === 'mantenciones' && (
                                                <>
                                                    <th>Fecha</th>
                                                    <th>Vehículo</th>
                                                    <th>Tipo</th>
                                                    <th>Km</th>
                                                    <th className="text-right">Costo</th>
                                                    <th>Responsable</th>
                                                </>
                                            )}
                                            {selectedReport === 'almacenes' && (
                                                <>
                                                    <th>Nombre</th>
                                                    <th>Ubicación</th>
                                                    <th className="text-right">Productos</th>
                                                    <th>Estado</th>
                                                </>
                                            )}
                                            {selectedReport === 'estanques' && (
                                                <>
                                                    <th>Nombre</th>
                                                    <th className="text-right">Capacidad</th>
                                                    <th className="text-right">Stock</th>
                                                    <th>Estado</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {previewData.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-32">
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <Search className="w-8 h-8 opacity-20" />
                                                        <p className="font-bold tracking-widest uppercase text-[10px]">No se encontraron registros activos</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            previewData.map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                                    {selectedReport === 'consumo' && (
                                                        <>
                                                            <td className="font-mono text-muted-foreground">{formatDate(row.fecha)}</td>
                                                            <td className="font-bold">{row.vehiculo}</td>
                                                            <td className="text-muted-foreground">{row.estanque}</td>
                                                            <td className={`text-right font-mono font-bold ${row.litrosUsados > 100 ? 'text-critical' : row.litrosUsados > 80 ? 'text-warning' : 'text-success'}`}>
                                                                {row.litrosUsados} L
                                                            </td>
                                                            <td className="text-muted-foreground uppercase text-[9px] font-bold">{row.empresa}</td>
                                                            <td className="text-muted-foreground italic truncate max-w-[150px]">{row.observaciones}</td>
                                                        </>
                                                    )}
                                                    {selectedReport === 'cargas' && (
                                                        <>
                                                            <td className="font-mono text-muted-foreground">{formatDate(row.fecha)}</td>
                                                            <td className="font-bold">{row.estanque}</td>
                                                            <td className="text-right font-mono font-bold text-success">{row.litros} L</td>
                                                            <td className="text-muted-foreground uppercase text-[9px] font-bold">{row.numeroGuia}</td>
                                                            <td className="text-muted-foreground uppercase text-[9px] font-bold">{row.proveedor}</td>
                                                        </>
                                                    )}
                                                    {selectedReport === 'vehiculos' && (
                                                        <>
                                                            <td className="font-mono font-bold">{row.id}</td>
                                                            <td>{row.marca} {row.modelo}</td>
                                                            <td>
                                                                <Badge variant="outline" className={row.estado === 'operativo' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                                    {row.estado}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-right font-mono">{row.kilometraje?.toLocaleString()} km</td>
                                                        </>
                                                    )}
                                                    {selectedReport === 'mantenciones' && (
                                                        <>
                                                            <td className="font-mono text-muted-foreground">{formatDate(row.fechaIngreso)}</td>
                                                            <td className="font-bold uppercase">{row.vehiculo}</td>
                                                            <td className="text-muted-foreground">{row.tipoMantencion}</td>
                                                            <td className="font-mono text-center text-muted-foreground">{row.kilometraje?.toLocaleString()}</td>
                                                            <td className="text-right font-mono font-bold text-accent">${row.costo?.toLocaleString()}</td>
                                                            <td className="text-muted-foreground uppercase text-[9px] font-bold">{row.responsable}</td>
                                                        </>
                                                    )}
                                                    {selectedReport === 'almacenes' && (
                                                        <>
                                                            <td className="font-bold">{row.nombre}</td>
                                                            <td className="text-muted-foreground">{row.ubicacion}</td>
                                                            <td className="text-right font-mono">{row.totalProductos}</td>
                                                            <td>{row.estado}</td>
                                                        </>
                                                    )}
                                                    {selectedReport === 'estanques' && (
                                                        <>
                                                            <td className="font-bold">{row.nombre}</td>
                                                            <td className="text-right font-mono">{row.capacidadTotal?.toLocaleString()} L</td>
                                                            <td className="text-right font-mono font-bold text-accent">{row.stockActual?.toLocaleString()} L</td>
                                                            <td>{row.estado}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

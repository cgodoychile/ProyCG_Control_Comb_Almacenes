import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditoriaApi } from '@/lib/apiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/dashboard/KPICard';
import {
    Shield,
    Search,
    FileText,
    User,
    Calendar,
    Filter,
    Download,
    Loader2,
    Eye,
    Edit,
    Trash2,
    Plus,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';

export function AuditoriaModule() {
    const { user, isAdmin } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState<string>('todos');
    const [selectedAction, setSelectedAction] = useState<string>('todas');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Fetch audit logs
    const { data: auditResponse, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: auditoriaApi.getAll,
        refetchInterval: 30000,
    });

    const auditLogs = auditResponse?.data || [];

    // Calculate stats
    const totalActions = auditLogs.length;
    const createActions = auditLogs.filter(l => l.accionRealizada === 'crear').length;
    const updateActions = auditLogs.filter(l => l.accionRealizada === 'actualizar').length;
    const deleteActions = auditLogs.filter(l => l.accionRealizada === 'eliminar').length;


    // Filter logs
    const filteredLogs = useMemo(() => {
        let logs = [...auditLogs];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            logs = logs.filter(log =>
                log.mensaje?.toLowerCase().includes(search) ||
                log.modulo?.toLowerCase().includes(search) ||
                log.accionRealizada?.toLowerCase().includes(search)
            );
        }

        if (selectedModule !== 'todos') {
            logs = logs.filter(log => log.modulo === selectedModule);
        }

        if (selectedAction !== 'todas') {
            logs = logs.filter(log => log.accionRealizada === selectedAction);
        }

        if (fechaDesde && fechaHasta) {
            const start = new Date(fechaDesde);
            const end = new Date(fechaHasta);
            end.setHours(23, 59, 59);
            logs = logs.filter(log => {
                const logDate = new Date(log.fecha);
                return logDate >= start && logDate <= end;
            });
        }

        return logs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [auditLogs, searchTerm, selectedModule, selectedAction, fechaDesde, fechaHasta]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getActionLabel = (action: string) => {
        switch (action.toLowerCase()) {
            case 'crear': return 'Creación';
            case 'actualizar': case 'editar': return 'Actualización';
            case 'eliminar': return 'Eliminación';
            case 'ver': return 'Visualización';
            case 'movimiento': return 'Movimiento';
            default: return action.charAt(0).toUpperCase() + action.slice(1);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'crear': return <Plus className="w-4 h-4" />;
            case 'actualizar': case 'editar': return <Edit className="w-4 h-4" />;
            case 'eliminar': return <Trash2 className="w-4 h-4" />;
            case 'ver': return <Eye className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'crear': return 'text-success';
            case 'actualizar': case 'editar': return 'text-warning';
            case 'eliminar': return 'text-destructive';
            case 'ver': return 'text-blue-500';
            default: return 'text-muted-foreground';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'critical': return 'Crítico';
            case 'warning': return 'Aviso';
            case 'success': return 'Éxito';
            case 'info': return 'Info';
            default: return type ? type.toUpperCase() : 'Info';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando registros de auditoría...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="w-6 h-6 text-accent" />
                        Auditoría del Sistema
                    </h2>
                    <p className="text-muted-foreground">
                        Registro completo de acciones y cambios en el sistema
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <DateRangeFilter
                        onFilterChange={(desde, hasta) => {
                            setFechaDesde(desde);
                            setFechaHasta(hasta);
                        }}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-accent text-accent hover:bg-accent/10 h-10"
                        onClick={() => {
                            // TODO: Implement export functionality
                            console.log('Exportar auditoría');
                        }}
                    >
                        <Download className="w-4 h-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Total Acciones"
                    value={totalActions.toString()}
                    icon={FileText}
                    variant="default"
                />
                <KPICard
                    title="Creaciones"
                    value={createActions.toString()}
                    icon={Plus}
                    variant="success"
                />
                <KPICard
                    title="Actualizaciones"
                    value={updateActions.toString()}
                    icon={Edit}
                    variant="warning"
                />
                <KPICard
                    title="Eliminaciones"
                    value={deleteActions.toString()}
                    icon={Trash2}
                    variant="default"
                    subtitle={deleteActions > 0 ? "Requieren atención" : undefined}
                />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en auditoría..."
                        className="pl-8 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Module Filter */}
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todos los módulos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los módulos</SelectItem>
                        <SelectItem value="Consumo">Consumo</SelectItem>
                        <SelectItem value="Vehículos">Vehículos</SelectItem>
                        <SelectItem value="Estanques">Estanques</SelectItem>
                        <SelectItem value="Almacenes">Almacenes</SelectItem>
                        <SelectItem value="Personas">Personas</SelectItem>
                        <SelectItem value="Activos">Activos</SelectItem>
                        <SelectItem value="Cargas">Cargas</SelectItem>
                    </SelectContent>
                </Select>

                {/* Action Filter */}
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todas">Todas las acciones</SelectItem>
                        <SelectItem value="crear">Crear</SelectItem>
                        <SelectItem value="actualizar">Actualizar</SelectItem>
                        <SelectItem value="eliminar">Eliminar</SelectItem>
                        <SelectItem value="ver">Ver</SelectItem>
                    </SelectContent>
                </Select>

            </div>

            {/* Audit Table */}
            <div className="card-fuel rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="bg-secondary/50">
                            <tr>
                                <th className="w-[180px]">Fecha/Hora</th>
                                <th className="w-[100px]">Acción</th>
                                <th className="w-[120px]">Módulo</th>
                                <th>Descripción</th>
                                <th className="w-[150px]">Usuario</th>
                                <th className="w-[80px]">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {searchTerm ? 'No se encontraron resultados' : 'No hay registros de auditoría'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, index) => (
                                    <tr
                                        key={log.id || index}
                                        className="animate-fade-in text-sm hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="font-mono text-xs">
                                            {formatDate(log.fecha)}
                                        </td>
                                        <td>
                                            <div className={cn(
                                                "flex items-center gap-2 font-medium",
                                                getActionColor(log.accionRealizada || '')
                                            )}>
                                                {getActionIcon(log.accionRealizada || '')}
                                                <span className="capitalize">{getActionLabel(log.accionRealizada || '')}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold uppercase">
                                                {log.modulo || 'Sistema'}
                                            </span>
                                        </td>
                                        <td className="text-foreground">
                                            {log.mensaje || 'Sin descripción'}
                                        </td>
                                        <td className="text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3" />
                                                <span className="text-xs">{log.usuario || 'Sistema'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                log.tipo === 'critical' && "bg-destructive/10 text-destructive",
                                                log.tipo === 'warning' && "bg-warning/10 text-warning",
                                                log.tipo === 'success' && "bg-success/10 text-success",
                                                log.tipo === 'info' && "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {getTypeLabel(log.tipo || '')}
                                            </span>
                                        </td>
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
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
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
                        Página {currentPage} de {totalPages || 1}
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
            </div>

            {/* Future Features Placeholder */}
            <div className="card-fuel rounded-xl border border-dashed border-border p-6 bg-secondary/20">
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Funcionalidades Futuras
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Exportación de registros a Excel/PDF</li>
                    <li>Filtros avanzados por usuario específico</li>
                    <li>Visualización de cambios detallados (antes/después)</li>
                    <li>Alertas automáticas de acciones críticas</li>
                    <li>Retención configurable de registros</li>
                    <li>Búsqueda por ID de registro</li>
                    <li>Comparación de versiones de datos</li>
                </ul>
            </div>
        </div>
    );
}

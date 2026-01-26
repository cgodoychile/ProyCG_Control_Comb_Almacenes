import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    auditoriaApi,
    estanquesApi,
    vehiculosApi,
    almacenesApi,
    productosAlmacenApi,
    personasApi,
    usuariosApi,
    activosApi,
    consumosApi,
    mantencionesApi
} from '@/lib/apiService';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, ThumbsUp, ThumbsDown } from 'lucide-react';
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
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { execute, loading: isActionLoading } = useApi();
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
            case 'solicitud_eliminacion': return 'Solicitud de Eliminación';
            default: return action.charAt(0).toUpperCase() + action.slice(1);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'crear': return <Plus className="w-4 h-4" />;
            case 'actualizar': case 'editar': return <Edit className="w-4 h-4" />;
            case 'eliminar': return <Trash2 className="w-4 h-4" />;
            case 'ver': return <Eye className="w-4 h-4" />;
            case 'solicitud_eliminacion': return <AlertTriangle className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'crear': return 'text-success';
            case 'actualizar': case 'editar': return 'text-warning';
            case 'eliminar': return 'text-destructive';
            case 'ver': return 'text-blue-500';
            case 'solicitud_eliminacion': return 'text-orange-500';
            default: return 'text-muted-foreground';
        }
    };

    const handleApproveDelete = async (log: any) => {
        let entityType = '';
        let entityId = '';
        let justification = log.justificacion || "Aprobado por administrador";
        let deleteFromWarehouse = false;

        // Try to parse JSON first (New format)
        if (log.mensaje && log.mensaje.trim().startsWith('{')) {
            try {
                const metadata = JSON.parse(log.mensaje);
                entityType = metadata.entity || '';
                entityId = metadata.id || '';
                deleteFromWarehouse = metadata.deleteFromWarehouse === true;
                if (metadata.justification) justification = metadata.justification;
            } catch (e) {
                console.warn('Error parsing JSON log message:', e);
            }
        }

        // Fallback to Regex (Legacy format)
        if (!entityType || !entityId) {
            const regex = /Solicitud de eliminación de ([^:]+): .* \(ID: ([^)]+)\)/;
            const match = log.mensaje.match(regex);
            if (match) {
                entityType = match[1].toLowerCase();
                entityId = match[2];
            }
        }

        if (!entityType || !entityId) {
            toast({ variant: "destructive", title: "❌ Error", description: "No se pudo identificar la entidad o el ID a eliminar." });
            return;
        }

        const normalizedEntity = entityType.toLowerCase().trim();
        let api: any;

        // Map entity to API and ensure correct string for backend switch
        let backendEntity = normalizedEntity;

        switch (normalizedEntity) {
            case 'estanque': case 'estanques': api = estanquesApi; backendEntity = 'estanques'; break;
            case 'vehículo': case 'vehiculo': case 'vehiculos': api = vehiculosApi; backendEntity = 'vehiculos'; break;
            case 'almacén': case 'almacen': case 'almacenes': api = almacenesApi; backendEntity = 'almacenes'; break;
            case 'producto': case 'productos': api = productosAlmacenApi; backendEntity = 'productos'; break;
            case 'usuario': case 'usuarios': api = usuariosApi; backendEntity = 'usuarios'; break;
            case 'persona': case 'personas': api = personasApi; backendEntity = 'personas'; break;
            case 'activo': case 'activos': api = activosApi; backendEntity = 'activos'; break;
            case 'consumo': case 'consumos': api = consumosApi; backendEntity = 'consumos'; break;
            case 'mantención': case 'mantencion': case 'mantenciones': api = mantencionesApi; backendEntity = 'mantenciones'; break;
            default:
                toast({ variant: "destructive", title: "❌ Error", description: `Módulo '${entityType}' no soportado para aprobación automática.` });
                return;
        }

        // Use the Alerts API approveAndDelet flow which handles the cross-logic in backend
        await execute(auditoriaApi.update(log.id, {
            action: 'approveAndDelete',
            targetEntity: backendEntity,
            targetId: entityId,
            justification: justification,
            deleteFromWarehouse: deleteFromWarehouse
        } as any), {
            successMessage: "Eliminación ejecutada exitosamente.",
            onSuccess: () => {
                queryClient.invalidateQueries();
            }
        });
    };

    const handleRejectDelete = async (log: any) => {
        // Just record the rejection in audit log
        await execute(auditoriaApi.create({
            modulo: 'Auditoría',
            accion: 'rechazo_eliminacion',
            mensaje: `RECHAZADO: Solicitud de eliminación para ${log.modulo} (ID: ${log.mensaje.match(/\(ID: ([^)]+)\)/)?.[1] || '?'})`,
            tipo: 'info',
            usuario: user?.email || 'Admin',
            justificacion: 'Rechazado por administrador'
        }), {
            successMessage: "Solicitud rechazada y registrada.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            }
        });
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
                                {isAdmin && <th className="w-[100px] text-right">Acciones</th>}
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
                                            {(() => {
                                                const msg = log.mensaje || '';
                                                let jsonToParse = msg;
                                                let tail = '';

                                                if (msg.includes(' | Justificación:')) {
                                                    const parts = msg.split(' | Justificación:');
                                                    jsonToParse = parts[0];
                                                    tail = ` | Justificación: ${parts[1]}`;
                                                }

                                                if (jsonToParse.trim().startsWith('{')) {
                                                    try {
                                                        const parsed = JSON.parse(jsonToParse);
                                                        if (parsed.name && parsed.entity) {
                                                            const entityMap = { 'activos': 'Activo', 'vehiculos': 'Vehículo', 'consumos': 'Consumo', 'estanques': 'Estanque', 'almacenes': 'Bodega' };
                                                            const friendlyEntity = (entityMap as any)[parsed.entity.toLowerCase()] || parsed.entity;
                                                            return <>
                                                                <span className="font-semibold text-accent">Solicitud para eliminar {friendlyEntity}:</span> {parsed.name}
                                                                {parsed.justification && <span className="text-muted-foreground ml-1">- Motivo: {parsed.justification}</span>}
                                                                {tail && <span className="text-xs italic text-muted-foreground block mt-1">{tail.replace(' | ', '')}</span>}
                                                            </>;
                                                        }
                                                    } catch (e) { /* fallback to raw */ }
                                                }
                                                return msg;
                                            })()}
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
                                        {isAdmin && (
                                            <td className="text-right">
                                                {log.accionRealizada === 'solicitud_eliminacion' && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-success hover:bg-success/10"
                                                            onClick={() => handleApproveDelete(log)}
                                                            title="Aprobar y Eliminar"
                                                            disabled={isActionLoading}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRejectDelete(log)}
                                                            title="Rechazar solicitud"
                                                            disabled={isActionLoading}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
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

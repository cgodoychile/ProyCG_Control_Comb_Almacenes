import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowDownLeft, ArrowUpRight, History, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductTrackingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    producto: any;
    movimientos: any[];
    isLoading?: boolean;
    onReturn?: (responsable: string, cantidad: number) => void;
}

interface Assignment {
    responsable: string;
    cantidad: number;
    ultimaFecha: string;
    earliestDueDate?: string;
}

export function ProductTrackingDialog({ isOpen, onClose, producto, movimientos, isLoading, onReturn }: ProductTrackingDialogProps) {
    if (!producto) return null;

    // Filter movements for this product only
    const productMovements = useMemo(() => {
        return movimientos
            .filter(m => String(m.productoId) === String(producto.id))
            .sort((a, b) => {
                // Helper defined inside component, but we need it here.
                // Re-implementing simplified date parser or moving helper out of component?
                // Moving helper out is cleaner. But for now, let's use a quick parser here or use date string comparison if ISO.
                // Better: move parseDateValues outside/before this useMemo or define it before.
                // Since this useMemo is at top, we can't use the function defined below. 
                // Let's rely on standard ID sort if dates are equal, or just parse safely.
                const getDate = (dStr: string) => {
                    if (!dStr) return 0;
                    if (typeof dStr === 'string' && dStr.includes('-') && dStr.split('-')[2].length === 4) {
                        const p = dStr.split('-');
                        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
                    }
                    return new Date(dStr).getTime();
                };
                return getDate(b.fecha) - getDate(a.fecha);
            });
    }, [movimientos, producto]);

    // Calculate Active Assignments
    const activeAssignments = useMemo(() => {
        const assignments: { [key: string]: Assignment } = {};

        // Process widely to find net balance per person
        // We iterate from oldest to newest to track flow? No, standard aggregation is fine.
        // Logic: SALIDA adds to person's debt. RETORNO subtracts.
        // We need to look at ALL movements for this product.

        // Let's re-sort to chronological for calculation if needed, but for sum order doesn't matter.
        // However, last date does.

        // Iterate through all movements for this product
        productMovements.forEach(m => {
            const responsable = m.responsable || 'Sin Responsable';
            const tipo = m.tipo.toLowerCase();
            const cantidad = Number(m.cantidad) || 0;

            if (!assignments[responsable]) {
                assignments[responsable] = { cantidad: 0, ultimaFecha: m.fecha, earliestDueDate: '' };
            }

            if (new Date(m.fecha) > new Date(assignments[responsable].ultimaFecha)) {
                assignments[responsable].ultimaFecha = m.fecha;
            }

            if (tipo === 'salida') {
                assignments[responsable].cantidad += cantidad;
                // Track earliest due date for active loans
                if (m.fechaDevolucion) {
                    // logic: if we have a due date, store it. 
                    // Simplistic: if we have multiple exits, we keep the earliest one that hasn't been fully returned? 
                    // Complex to track "which specific unit returned", so just keeping the earliest seen due date of any exit for this person.
                    if (!assignments[responsable].earliestDueDate || new Date(m.fechaDevolucion) < new Date(assignments[responsable].earliestDueDate)) {
                        assignments[responsable].earliestDueDate = m.fechaDevolucion;
                    }
                }
            } else if (tipo === 'retorno') {
                assignments[responsable].cantidad -= cantidad;
            }
        });

        // Convert to array and filter only positive balances
        return Object.entries(assignments)
            .map(([responsable, data]) => ({
                responsable,
                cantidad: data.cantidad,
                ultimaFecha: data.ultimaFecha,
                earliestDueDate: data.earliestDueDate
            }))
            .filter(a => a.cantidad > 0)
            .sort((a, b) => b.cantidad - a.cantidad);
    }, [productMovements]);

    const parseDateValues = (dateString: string): Date | null => {
        if (!dateString) return null;
        // Try standard parsing first
        let d = new Date(dateString);
        if (!isNaN(d.getTime())) return d;

        // Try dd-mm-yyyy (Google Sheets / Utils.gs format)
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                // Determine if [0] is day or year (Utils.gs uses dd-mm-yyyy so parts[0] is day)
                const p0 = parseInt(parts[0]);
                const p2 = parseInt(parts[2]);
                // Heuristic: if p0 > 31, it's YYYY-MM-DD. If p2 > 31, it's DD-MM-YYYY
                if (p2 > 31) {
                    return new Date(p2, parseInt(parts[1]) - 1, p0);
                }
            }
        }
        return null;
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseDateValues(dateString);
            if (!date) return dateString;
            return new Intl.DateTimeFormat('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'America/Santiago'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-4 border-b pb-4">
                        <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Seguimiento: {producto.nombre}
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                                <span className="font-mono bg-secondary px-2 py-0.5 rounded text-xs">ID: {producto.id}</span>
                                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                    En Uso: {Number(producto.cantidadEnUso) || 0} {producto.unidad}
                                </span>
                                <span className="text-emerald-600">Stock: {Number(producto.cantidad)}</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
                    {/* Sección 1: Quién lo tiene ahora (Asignaciones Activas) */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            En Poder De (Asignaciones Activas)
                        </h3>

                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground animate-pulse">Cargando datos de seguimiento...</div>
                        ) : activeAssignments.length === 0 ? (
                            <div className="bg-secondary/20 border border-border rounded-lg p-8 text-center">
                                <p className="text-muted-foreground">No se detectaron asignaciones activas pendientes de retorno.</p>
                                {Number(producto.cantidadEnUso) > 0 && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        Nota: El stock "En Uso" ({producto.cantidadEnUso}) es mayor a 0, pero no se encontraron responsables directos en el historial reciente.
                                        Esto puede ocurrir si los movimientos antiguos fueron archivados o hubo ajustes manuales.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {activeAssignments.map((assignment, idx) => {
                                    const dueDate = assignment.earliestDueDate ? parseDateValues(assignment.earliestDueDate) : null;
                                    const isLate = dueDate ? dueDate.setHours(23, 59, 59) < new Date().getTime() : false;
                                    return (
                                        <div key={idx} className={cn("bg-white dark:bg-card border border-l-4 rounded-r-lg shadow-sm p-3 flex flex-col justify-between", isLate ? "border-l-destructive" : "border-l-indigo-500")}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="overflow-hidden">
                                                    <span className="font-bold text-sm truncate block" title={assignment.responsable}>{assignment.responsable}</span>
                                                    {assignment.earliestDueDate && (
                                                        <span className={cn("text-[10px] flex items-center gap-1", isLate ? "text-destructive font-bold" : "text-muted-foreground")}>
                                                            {isLate && <AlertTriangle className="w-3 h-3" />}
                                                            Vence: {formatDate(assignment.earliestDueDate)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2 py-1 rounded-full shrink-0">
                                                    {assignment.cantidad} {producto.unidad}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between mt-2">
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <History className="h-3 w-3" />
                                                    {formatDate(assignment.ultimaFecha)}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 text-[10px] px-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => onReturn && onReturn(assignment.responsable, assignment.cantidad)}
                                                >
                                                    <ArrowDownLeft className="h-3 w-3 mr-1" />
                                                    Devolver
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border my-2"></div>

                    {/* Sección 2: Historial Completo */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Historial Detallado
                        </h3>
                        <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/40 text-xs text-muted-foreground uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Acción</th>
                                        <th className="px-4 py-3">Responsable</th>
                                        <th className="px-4 py-3 text-center">Cantidad</th>
                                        <th className="px-4 py-3">Referencia / Destino</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {productMovements.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin movimientos registrados.</td>
                                        </tr>
                                    ) : productMovements.map((move: any) => (
                                        <tr key={move.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-muted-foreground">
                                                {formatDate(move.fecha)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center w-fit gap-1",
                                                    move.tipo.toLowerCase() === 'salida' ? "bg-amber-100 text-amber-800" :
                                                        move.tipo.toLowerCase() === 'retorno' ? "bg-blue-100 text-blue-800" :
                                                            move.tipo.toLowerCase() === 'entrada' ? "bg-emerald-100 text-emerald-800" :
                                                                "bg-gray-100 text-gray-800"
                                                )}>
                                                    {move.tipo.toLowerCase() === 'salida' && <ArrowUpRight className="h-3 w-3" />}
                                                    {move.tipo.toLowerCase() === 'retorno' && <ArrowDownLeft className="h-3 w-3" />}
                                                    {move.tipo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-xs">{move.responsable || '-'}</td>
                                            <td className="px-4 py-3 text-center font-bold text-xs">{move.cantidad}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[200px]">
                                                {move.guiaReferencia || move.observaciones || move.almacenDestino || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { actasApi } from '@/lib/apiService';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Search,
    Printer,
    Calendar,
    User,
    Loader2,
    ArrowLeftRight,
    Filter,
    Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useReactToPrint } from 'react-to-print';
import { PrintableCargoForm } from '@/components/shared/PrintableCargoForm';
import { ActaForm } from '@/components/forms/ActaForm';
import { generateCargoActaExcel } from '@/utils/excelForms';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useApi } from '@/hooks/useApi';

export default function ActasModule() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [printingData, setPrintingData] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { execute, loading: isActionLoading } = useApi();

    const { data: actasResponse, isLoading } = useQuery({
        queryKey: ['actas'],
        queryFn: actasApi.getAll
    });

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Acta_Cargo_${printingData?.responsable || 'Historial'}`,
        onAfterPrint: () => setPrintingData(null)
    });

    const triggerPrint = (payload: any) => {
        setPrintingData(payload);
        setTimeout(() => {
            if (handlePrint) handlePrint();
        }, 500);
    };

    const handleCreateActa = async (data: any) => {
        await execute(actasApi.generateCargo(data), {
            successMessage: "✅ Acta generada y registrada exitosamente.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['actas'] });
                setIsFormOpen(false);
                triggerPrint(data);
            }
        });
    };

    const triggerRePrint = (acta: any) => {
        const payload = {
            titulo: "RE-IMPRESIÓN DE ACTA DE CARGO",
            fecha: acta.fecha,
            responsable: acta.responsable,
            cargo: acta.cargo,
            equipo: acta.equipo,
            marca: acta.marca,
            modelo: acta.modelo,
            serie: acta.seriePatente,
            patente: acta.seriePatente,
            observaciones: acta.observaciones
        };
        triggerPrint(payload);
    };

    const handleDownloadExcel = (acta: any) => {
        const payload = {
            activoId: acta.id,
            responsable: acta.responsable,
            fecha: acta.fecha,
            cargo: acta.cargo,
            equipo: acta.equipo,
            marca: acta.marca,
            modelo: acta.modelo,
            serie: acta.seriePatente,
            patente: acta.seriePatente,
            observaciones: acta.observaciones
        };
        generateCargoActaExcel(payload);
    };

    const actasData = Array.isArray(actasResponse?.data) ? actasResponse.data : [];

    const filteredActas = actasData.filter((acta: any) => {
        const term = searchTerm.toLowerCase();
        return (
            acta.responsable?.toLowerCase().includes(term) ||
            acta.equipo?.toLowerCase().includes(term) ||
            acta.documentoId?.toLowerCase().includes(term) ||
            acta.seriePatente?.toLowerCase().includes(term)
        );
    }).sort((a, b) => b.id - a.id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Gestión de Actas
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Control centralizado de cargos y asignaciones.
                    </p>
                </div>
                <Button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-tighter px-6 shadow-lg shadow-orange-900/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Acta
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Buscar por responsable, equipo, patente o folio..."
                        className="pl-10 bg-slate-950/50 border-white/10 focus:border-accent/50 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="border-white/10 shrink-0">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>

            {/* Historial de Actas */}
            <div>
                <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    Historial de Asignaciones
                </h3>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-accent animate-spin" />
                        <p className="text-slate-400 font-medium animate-pulse">Cargando historial de actas...</p>
                    </div>
                ) : filteredActas.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-white/10">
                        <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300">No se encontraron actas</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Crea una nueva acta presionando el botón superior para comenzar el registro.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredActas.map((acta: any) => (
                            <Card key={acta.id} className="bg-slate-900/40 border-white/5 hover:border-accent/30 transition-all duration-300 group overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-5 border-b border-white/5 bg-slate-950/30">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-mono">
                                                {acta.documentoId || `#${acta.id}`}
                                            </Badge>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {acta.fecha}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
                                            {acta.responsable}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 italic">{acta.cargo}</p>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                                                <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Equipo Asignado</p>
                                                <p className="text-sm font-medium text-slate-300 line-clamp-1">{acta.equipo}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Marca/Modelo</p>
                                                <p className="text-xs text-slate-400 truncate">{acta.marca} / {acta.modelo}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ID / Patente</p>
                                                <p className="text-xs font-mono text-accent">{acta.seriePatente}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-3 bg-slate-950/20 flex justify-end gap-2 border-t border-white/5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-slate-400 hover:text-white hover:bg-white/5"
                                            onClick={() => triggerRePrint(acta)}
                                        >
                                            <Printer className="w-3.5 h-3.5 mr-2" />
                                            Re-imprimir
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-accent hover:text-white hover:bg-accent/10"
                                            onClick={() => handleDownloadExcel(acta)}
                                        >
                                            <FileText className="w-3.5 h-3.5 mr-2" />
                                            Excel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulario de Generación Centralizada */}
            <ActaForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreateActa}
                isLoading={isActionLoading}
            />

            {/* Componente de Impresión (Fuera del visor normal pero no hidden) */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
                {printingData && (
                    <PrintableCargoForm ref={printRef} data={printingData} />
                )}
            </div>
        </div>
    );
}

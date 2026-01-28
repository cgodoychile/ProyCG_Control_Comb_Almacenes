import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ClipboardList } from 'lucide-react';
import { vehiculosApi, activosApi, productosAlmacenApi, personasApi } from '@/lib/apiService';
import { useQuery } from '@tanstack/react-query';
import { generateCargoActaExcel } from '@/utils/excelForms';
import { Persona, Activo } from '@/types/crm';

const actaSchema = z.object({
    tipoRecurso: z.enum(['vehiculo', 'activo', 'producto']),
    recursoId: z.string().min(1, "Debe seleccionar un recurso"),
    responsable: z.string().min(1, "Debe seleccionar un responsable"),
    cargo: z.string().optional(),
    observaciones: z.string().optional(),
});

type ActaFormData = z.infer<typeof actaSchema>;

interface ActaFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
}

export function ActaForm({ open, onClose, onSubmit, isLoading }: ActaFormProps) {
    const [selectedRecursoLabel, setSelectedRecursoLabel] = useState('');

    const form = useForm<ActaFormData>({
        resolver: zodResolver(actaSchema),
        defaultValues: {
            tipoRecurso: 'vehiculo',
            recursoId: '',
            responsable: '',
            cargo: 'Operario / Responsable Técnico',
            observaciones: '',
        },
    });

    const tipoRecurso = form.watch('tipoRecurso');
    const responsable = form.watch('responsable');

    // Fetching Data for selectors
    const { data: vehiculos } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: vehiculosApi.getAll,
        enabled: open && tipoRecurso === 'vehiculo'
    });

    const { data: activos } = useQuery({
        queryKey: ['activos'],
        queryFn: activosApi.getAll,
        enabled: open && tipoRecurso === 'activo'
    });

    const { data: productos } = useQuery({
        queryKey: ['productos_almacen'],
        queryFn: () => productosAlmacenApi.getAll(),
        enabled: open && tipoRecurso === 'producto'
    });

    const { data: personas } = useQuery({
        queryKey: ['personas'],
        queryFn: personasApi.getAll,
        enabled: open
    });

    useEffect(() => {
        if (responsable && personas?.data) {
            const persona = personas.data.find((p: Persona) => p.nombreCompleto === responsable);
            if (persona) {
                form.setValue('cargo', persona.rol || 'Operario / Responsable Técnico');
            }
        }
    }, [responsable, personas?.data, form.setValue]);

    const handleFormSubmit = (values: ActaFormData) => {
        // Buscar detalles del recurso para el payload de impresión
        let recursoDetalles: any = {};

        if (tipoRecurso === 'vehiculo') {
            const v = vehiculos?.data?.find((x: any) => x.id === values.recursoId);
            recursoDetalles = {
                equipo: `Vehículo: ${v?.marca} ${v?.modelo}`,
                marca: v?.marca,
                modelo: v?.modelo,
                patente: v?.id,
                serie: v?.id
            };
        } else if (tipoRecurso === 'activo') {
            const a = activos?.data?.find((x: any) => x.id === values.recursoId);
            recursoDetalles = {
                equipo: a?.nombre,
                marca: a?.marca,
                modelo: a?.modelo,
                serie: a?.numeroSerie || a?.id
            };
        } else {
            const p = productos?.data?.find((x: any) => x.id === values.recursoId);
            recursoDetalles = {
                equipo: p?.nombre,
                marca: p?.categoria,
                modelo: p?.unidad,
                serie: p?.id
            };
        }

        const payload = {
            ...values,
            ...recursoDetalles,
            fecha: new Date().toLocaleDateString('es-CL'),
            titulo: "ACTA DE CARGO Y ENTREGA DE EQUIPO"
        };

        // Generar Excel automáticamente
        generateCargoActaExcel(payload);

        onSubmit(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border-white/10 text-white overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-primary to-orange-500" />

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-black italic tracking-tighter uppercase">
                        <ClipboardList className="w-6 h-6 text-orange-500" />
                        Generar Nueva Acta
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crea un documento profesional de cargo seleccionando el recurso y el responsable.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-5 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipoRecurso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Tipo de Recurso</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-white/10 focus:ring-orange-500/50">
                                                    <SelectValue placeholder="Seleccione tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                                <SelectItem value="vehiculo">Vehículos / Flota</SelectItem>
                                                <SelectItem value="activo">Herramientas / Activos</SelectItem>
                                                <SelectItem value="producto">Insumos / Almacén</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="recursoId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Elemento específico</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-white/10 focus:ring-orange-500/50">
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-white/10 text-white max-h-[200px]">
                                                {tipoRecurso === 'vehiculo' && vehiculos?.data?.map((v: any) => (
                                                    <SelectItem key={v.id} value={v.id}>{v.id} - {v.marca} {v.modelo}</SelectItem>
                                                ))}
                                                {tipoRecurso === 'activo' && activos?.data?.map((a: any) => (
                                                    <SelectItem key={a.id} value={a.id}>{a.nombre} ({a.id})</SelectItem>
                                                ))}
                                                {tipoRecurso === 'producto' && productos?.data?.map((p: any) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="responsable"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Responsable de Cargo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-950/50 border-white/10 focus:ring-orange-500/50">
                                                <SelectValue placeholder="Seleccione responsable..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            {personas?.data?.map((p: any) => (
                                                <SelectItem key={p.id} value={p.nombreCompleto}>{p.nombreCompleto} ({p.rol})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cargo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Cargo del Receptor</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-slate-950/50 border-white/10 focus:ring-orange-500/50" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="observaciones"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Observaciones de Entrega</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Indique el estado del equipo o condiciones de entrega..."
                                            className="bg-slate-950/50 border-white/10 focus:ring-orange-500/50 min-h-[80px]"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 border-t border-white/5">
                            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-tighter px-8"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    "Generar e Imprimir"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

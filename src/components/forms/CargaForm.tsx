import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cargaSchema, CargaFormData } from '@/lib/validations';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getLocalDate } from '@/lib/utils';

interface CargaFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CargaFormData) => Promise<void>;
    estanques: any[];
    initialData?: Partial<CargaFormData>;
    isLoading?: boolean;
}

export function CargaForm({
    open,
    onClose,
    onSubmit,
    estanques,
    initialData,
    isLoading = false,
}: CargaFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<CargaFormData>({
        resolver: zodResolver(cargaSchema),
        defaultValues: initialData || {
            fecha: getLocalDate(),
            tipo: 'real',
            litros: 0,
            proveedor: 'COPEC',
            responsable: 'Admin', // Added default for responsable
            fechaProgramada: getLocalDate(), // Added default for fechaProgramada
            precioUnitario: 0,
            precioTotal: 0,
        },
    });

    // Reset form when initialData changes or form opens
    useEffect(() => {
        if (open) {
            reset({
                fecha: getLocalDate(),
                tipo: 'real',
                litros: 0,
                proveedor: 'COPEC',
                responsable: 'Admin', // Added default for responsable
                fechaProgramada: getLocalDate(), // Added default for fechaProgramada
                precioUnitario: 0,
                precioTotal: 0,
                ...initialData
            });
        }
    }, [initialData, open, reset]);

    const estanqueSeleccionado = watch('estanque');
    const litros = watch('litros');
    const tipo = watch('tipo');
    const precioUnitario = watch('precioUnitario');

    // Auto-calculate Total
    useEffect(() => {
        const l = parseFloat(String(litros || 0));
        const p = parseFloat(String(precioUnitario || 0));
        setValue('precioTotal', l * p);
    }, [litros, precioUnitario, setValue]);

    const estanque = estanques.find(e => e.nombre === estanqueSeleccionado);
    const capacidadDisponible = estanque
        ? estanque.capacidadTotal - estanque.stockActual
        : 0;
    const excedeCapacidad = litros > capacidadDisponible;

    const onFormSubmit = async (data: CargaFormData) => {
        await onSubmit(data);
    };

    const title = initialData
        ? (initialData.tipo === 'programada' ? 'Programa Agenda Carga de Estanque' : 'Editar Carga')
        : (tipo === 'programada' ? 'Programa Agenda Carga de Estanque' : 'Nueva Carga de Combustible');

    const description = tipo === 'programada'
        ? "Registre la proxima fecha de carga de Estanque."
        : "Registre la carga de combustible al estanque";

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit(onFormSubmit)}
            title={title}
            description={description}
            isLoading={isLoading}
        >
            <div className="grid gap-4">
                {/* Tipo de Carga (Oculto pero presente si es necesario, o explícito) */}
                <input type="hidden" {...register('tipo')} />

                {/* Fecha de Registro / Fecha Programada */}
                <div className="grid gap-4">
                    {tipo === 'real' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="fecha">Fecha de Registro *</Label>
                            <Input
                                id="fecha"
                                type="date"
                                {...register('fecha')}
                                max={getLocalDate()}
                            />
                            {errors.fecha && (
                                <p className="text-sm text-destructive">{errors.fecha.message}</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="fechaProgramada">Fecha de Registro (Programada) *</Label>
                            <Input
                                id="fechaProgramada"
                                type="date"
                                {...register('fechaProgramada')}
                                min={getLocalDate()}
                            />
                            {errors.fechaProgramada && (
                                <p className="text-sm text-destructive">{errors.fechaProgramada.message}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Número de Guía (Solo real) */}
                {tipo === 'real' && (
                    <div className="grid gap-2">
                        <Label htmlFor="numeroGuia">Número de Guía/Factura *</Label>
                        <Input
                            id="numeroGuia"
                            {...register('numeroGuia')}
                            placeholder="Ej: 123456"
                        />
                        {errors.numeroGuia && (
                            <p className="text-sm text-destructive">{errors.numeroGuia.message}</p>
                        )}
                    </div>
                )}

                {/* Estanque */}
                <div className="grid gap-2">
                    <Label htmlFor="estanque">Estanque *</Label>
                    <Select
                        onValueChange={(value) => setValue('estanque', value)}
                        defaultValue={initialData?.estanque}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estanque" />
                        </SelectTrigger>
                        <SelectContent>
                            {estanques.map((est) => (
                                <SelectItem key={est.id} value={est.nombre}>
                                    {est.nombre} - {est.stockActual}L / {est.capacidadTotal}L
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.estanque && (
                        <p className="text-sm text-destructive">{errors.estanque.message}</p>
                    )}
                    {estanque && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Capacidad disponible: <strong>{capacidadDisponible.toLocaleString()} L</strong>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Proveedor */}
                <div className="grid gap-2">
                    <Label htmlFor="proveedor">Proveedor *</Label>
                    <Select
                        onValueChange={(value) => setValue('proveedor', value)}
                        defaultValue={initialData?.proveedor || 'COPEC'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione el proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="COPEC">COPEC</SelectItem>
                            <SelectItem value="SHELL">SHELL</SelectItem>
                            <SelectItem value="PETROBRAS">PETROBRAS</SelectItem>
                            <SelectItem value="ENEX">ENEX</SelectItem>
                            <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.proveedor && (
                        <p className="text-sm text-destructive">{errors.proveedor.message}</p>
                    )}
                </div>

                {/* Litros */}
                <div className="grid gap-2">
                    <Label htmlFor="litros">Litros *</Label>
                    <Input
                        id="litros"
                        type="number"
                        step="0.1"
                        {...register('litros', { valueAsNumber: true })}
                        placeholder="0.0"
                    />
                    {errors.litros && (
                        <p className="text-sm text-destructive">{errors.litros.message}</p>
                    )}
                    {excedeCapacidad && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                ⚠️ La carga excede la capacidad disponible del estanque
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Precio Unitario y Total */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="precioUnitario">Precio por Litro ($)</Label>
                        <Input
                            id="precioUnitario"
                            type="number"
                            step="0.1"
                            {...register('precioUnitario', { valueAsNumber: true })}
                            placeholder="0"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="precioTotal">Total ($)</Label>
                        <Input
                            id="precioTotal"
                            type="number"
                            step="1"
                            {...register('precioTotal', { valueAsNumber: true })}
                            placeholder="0"
                            readOnly
                            className="bg-muted"
                        />
                    </div>
                </div>

                {/* Detalle del Camión / Entrega */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="patenteCamion">Patente Camión</Label>
                        <Input
                            id="patenteCamion"
                            {...register('patenteCamion')}
                            placeholder="ABCD-12"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tipoCombustible">Tipo Combustible</Label>
                        <Input
                            id="tipoCombustible"
                            {...register('tipoCombustible')}
                            placeholder="Diesel / Gasolina"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="conductor">Conductor</Label>
                    <Input
                        id="conductor"
                        {...register('conductor')}
                        placeholder="Nombre del conductor"
                    />
                </div>

                {/* Responsable */}
                <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable *</Label>
                    <Input
                        id="responsable"
                        {...register('responsable')}
                        placeholder="Nombre del responsable"
                    />
                    {errors.responsable && (
                        <p className="text-sm text-destructive">{errors.responsable.message}</p>
                    )}
                </div>

                {/* Observaciones */}
                <div className="grid gap-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                        id="observaciones"
                        {...register('observaciones')}
                        placeholder="Observaciones adicionales (opcional)"
                        rows={3}
                    />
                    {errors.observaciones && (
                        <p className="text-sm text-destructive">{errors.observaciones.message}</p>
                    )}
                </div>
            </div>
        </FormDialog>
    );
}

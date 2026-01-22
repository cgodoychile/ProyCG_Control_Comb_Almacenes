import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { estanqueSchema, EstanqueFormData } from '@/lib/validations';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';
import type { Estanque } from '@/types/crm';

interface EstanqueFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Estanque>) => void;
    initialData?: Partial<Estanque> | null;
    isLoading?: boolean;
}

export function EstanqueForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: EstanqueFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<EstanqueFormData>({
        resolver: zodResolver(estanqueSchema),
        defaultValues: {
            nombre: '',
            ubicacion: '',
            capacidadTotal: 10000,
            stockActual: 0,
            estado: 'operativo',
            alertaMinima: 2000,
            tipoCombustible: 'Diesel',
            responsable: 'Admin',
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    id: initialData.id,
                    nombre: initialData.nombre || '',
                    ubicacion: initialData.ubicacion || '',
                    capacidadTotal: initialData.capacidadTotal || 10000,
                    stockActual: initialData.stockActual || 0,
                    estado: initialData.estado || 'operativo',
                    alertaMinima: initialData.alertaMinima || 2000,
                    tipoCombustible: initialData.tipoCombustible || 'Diesel',
                    responsable: initialData.responsable || 'Admin',
                });
            } else {
                reset({
                    nombre: '',
                    ubicacion: '',
                    capacidadTotal: 10000,
                    stockActual: 0,
                    estado: 'operativo',
                    alertaMinima: 2000,
                    tipoCombustible: 'Diesel',
                    responsable: 'Admin',
                });
            }
        }
    }, [initialData, reset, open]);

    const capacidadTotal = watch('capacidadTotal');
    const stockActual = watch('stockActual');
    const porcentaje = capacidadTotal > 0 ? Math.round((stockActual / capacidadTotal) * 100) : 0;

    const onFormSubmit = (data: EstanqueFormData) => {
        onSubmit(data);
    };

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit(onFormSubmit)}
            title={initialData?.id ? 'Editar Estanque' : 'Nuevo Estanque'}
            description="Complete los datos del estanque de combustible"
            isLoading={isLoading}
        >
            <div className="grid gap-4">
                <input type="hidden" {...register('id')} />
                {/* Nombre */}
                <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre del Estanque *</Label>
                    <Input
                        id="nombre"
                        {...register('nombre')}
                        placeholder="Ej: Estanque Principal"
                    />
                    {errors.nombre && (
                        <p className="text-sm text-destructive">{errors.nombre.message}</p>
                    )}
                </div>

                {/* Ubicación */}
                <div className="grid gap-2">
                    <Label htmlFor="ubicacion">Ubicación *</Label>
                    <Input
                        id="ubicacion"
                        {...register('ubicacion')}
                        placeholder="Ej: Bodega Central"
                    />
                    {errors.ubicacion && (
                        <p className="text-sm text-destructive">{errors.ubicacion.message}</p>
                    )}
                </div>

                {/* Capacidad Total */}
                <div className="grid gap-2">
                    <Label htmlFor="capacidadTotal">Capacidad Total (Litros) *</Label>
                    <Input
                        id="capacidadTotal"
                        type="number"
                        {...register('capacidadTotal', { valueAsNumber: true })}
                        placeholder="10000"
                    />
                    {errors.capacidadTotal && (
                        <p className="text-sm text-destructive">{errors.capacidadTotal.message}</p>
                    )}
                </div>

                {/* Stock Actual */}
                <div className="grid gap-2">
                    <Label htmlFor="stockActual">Stock Actual (Litros) *</Label>
                    <Input
                        id="stockActual"
                        type="number"
                        {...register('stockActual', { valueAsNumber: true })}
                        placeholder="0"
                    />
                    {errors.stockActual && (
                        <p className="text-sm text-destructive">{errors.stockActual.message}</p>
                    )}
                    {capacidadTotal > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nivel actual: {porcentaje}% de capacidad
                        </p>
                    )}
                </div>

                {/* Estado */}
                <div className="grid gap-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                        onValueChange={(value: any) => setValue('estado', value)}
                        value={watch('estado')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione el estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="operativo">Operativo</SelectItem>
                            <SelectItem value="bajo">Bajo Stock</SelectItem>
                            <SelectItem value="critico">Crítico</SelectItem>
                            <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.estado && (
                        <p className="text-sm text-destructive">{errors.estado.message}</p>
                    )}
                </div>

                {/* Alerta Mínima */}
                <div className="grid gap-2">
                    <Label htmlFor="alertaMinima">Nivel Mínimo de Alerta (Litros)</Label>
                    <Input
                        id="alertaMinima"
                        type="number"
                        {...register('alertaMinima', { valueAsNumber: true })}
                        placeholder="2000"
                    />
                    <p className="text-sm text-muted-foreground">
                        Se generará una alerta cuando el stock sea menor a este valor
                    </p>
                    {errors.alertaMinima && (
                        <p className="text-sm text-destructive">{errors.alertaMinima.message}</p>
                    )}
                </div>

                {/* Tipo de Combustible */}
                <div className="grid gap-2">
                    <Label htmlFor="tipoCombustible">Tipo de Combustible *</Label>
                    <Select
                        onValueChange={(value) => setValue('tipoCombustible', value)}
                        value={watch('tipoCombustible') || 'Diesel'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione el combustible" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Gasolina 93">Gasolina 93</SelectItem>
                            <SelectItem value="Gasolina 95">Gasolina 95</SelectItem>
                            <SelectItem value="Gasolina 97">Gasolina 97</SelectItem>
                            <SelectItem value="Kerosene">Kerosene</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Responsable */}
                <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable *</Label>
                    <Input
                        id="responsable"
                        {...register('responsable')}
                        placeholder="Ej: Juan Pérez"
                    />
                </div>
            </div>
        </FormDialog>
    );
}

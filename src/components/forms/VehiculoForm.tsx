import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehiculoSchema, VehiculoFormData } from '@/lib/validations';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect } from 'react';

import type { Vehiculo } from '@/types/crm';

interface VehiculoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Vehiculo>) => void;
    initialData?: Partial<Vehiculo> | null;
    isLoading?: boolean;
}

export function VehiculoForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: VehiculoFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<VehiculoFormData>({
        resolver: zodResolver(vehiculoSchema),
        defaultValues: {
            id: '',
            marca: '',
            modelo: '',
            anio: '',
            tipo: 'Camioneta',
            estado: 'operativo',
            kilometraje: 0,
            ultimaMantencion: '',
            proximaMantencion: '',
            proximaMantencionKm: 0,
            otrosMantenimientos: '',
            responsable: '',
            ubicacion: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    id: initialData.id || '',
                    marca: initialData.marca || '',
                    modelo: initialData.modelo || '',
                    anio: initialData.anio || '',
                    tipo: (initialData.tipo as any) || 'Camioneta',
                    estado: initialData.estado || 'operativo',
                    kilometraje: initialData.kilometraje || 0,
                    ultimaMantencion: initialData.ultimaMantencion || '',
                    proximaMantencion: initialData.proximaMantencion || '',
                    proximaMantencionKm: initialData.proximaMantencionKm || 0,
                    otrosMantenimientos: initialData.otrosMantenimientos || '',
                    responsable: initialData.responsable || '',
                    ubicacion: initialData.ubicacion || '',
                });
            } else {
                reset({
                    id: '',
                    marca: '',
                    modelo: '',
                    anio: '',
                    tipo: 'Camioneta',
                    estado: 'operativo',
                    kilometraje: 0,
                    ultimaMantencion: '',
                    proximaMantencion: '',
                    proximaMantencionKm: 0,
                    otrosMantenimientos: '',
                    responsable: '',
                    ubicacion: '',
                });
            }
        }
    }, [initialData, reset, open]);

    const onFormSubmit = (data: VehiculoFormData) => {
        onSubmit(data);
    };

    const isEditing = !!initialData?.id;

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            title={isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
            onSubmit={handleSubmit(onFormSubmit)}
            isLoading={isLoading}
        >
            <div className="grid gap-4 py-4">
                {/* Patente */}
                <div className="grid gap-2">
                    <Label htmlFor="id">Patente *</Label>
                    <Input
                        id="id"
                        placeholder="ABC-123"
                        {...register('id')}
                        className="uppercase"
                    />
                    {errors.id && (
                        <p className="text-sm text-destructive">{errors.id.message}</p>
                    )}
                </div>

                {/* Marca y Modelo */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="marca">Marca *</Label>
                        <Input
                            id="marca"
                            placeholder="Toyota"
                            {...register('marca')}
                        />
                        {errors.marca && (
                            <p className="text-sm text-destructive">{errors.marca.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="modelo">Modelo *</Label>
                        <Input
                            id="modelo"
                            placeholder="Hilux"
                            {...register('modelo')}
                        />
                        {errors.modelo && (
                            <p className="text-sm text-destructive">{errors.modelo.message}</p>
                        )}
                    </div>
                </div>

                {/* Año y Tipo */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="anio">Año *</Label>
                        <Input
                            id="anio"
                            placeholder="2020"
                            {...register('anio')}
                        />
                        {errors.anio && (
                            <p className="text-sm text-destructive">{errors.anio.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select
                            value={watch('tipo')}
                            onValueChange={(value) => setValue('tipo', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Camioneta">Camioneta</SelectItem>
                                <SelectItem value="Camión">Camión</SelectItem>
                                <SelectItem value="Automóvil">Automóvil</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.tipo && (
                            <p className="text-sm text-destructive">{errors.tipo.message}</p>
                        )}
                    </div>
                </div>

                {/* Estado y Kilometraje */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="estado">Estado *</Label>
                        <Select
                            value={watch('estado')}
                            onValueChange={(value) => setValue('estado', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operativo">Operativo</SelectItem>
                                <SelectItem value="mantencion">Mantención</SelectItem>
                                <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.estado && (
                            <p className="text-sm text-destructive">{errors.estado.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="kilometraje">Kilometraje *</Label>
                        <Input
                            id="kilometraje"
                            type="number"
                            placeholder="0"
                            {...register('kilometraje', { valueAsNumber: true })}
                        />
                        {errors.kilometraje && (
                            <p className="text-sm text-destructive">{errors.kilometraje.message}</p>
                        )}
                    </div>
                </div>

                {/* Fechas de Mantención */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ultimaMantencion">Última Mantención</Label>
                        <Input
                            id="ultimaMantencion"
                            type="date"
                            {...register('ultimaMantencion')}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="proximaMantencion">Mantenimiento (Fecha)</Label>
                        <Input
                            id="proximaMantencion"
                            type="date"
                            {...register('proximaMantencion')}
                        />
                    </div>
                </div>

                {/* Km Próxima Mantención y Otros */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="proximaMantencionKm">Mantenimiento (Kilometraje)</Label>
                        <Input
                            id="proximaMantencionKm"
                            type="number"
                            placeholder="0"
                            {...register('proximaMantencionKm', { valueAsNumber: true })}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="otrosMantenimientos">Otros Mantenimientos</Label>
                    <textarea
                        id="otrosMantenimientos"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Cambio de neumáticos, frenos, etc."
                        {...register('otrosMantenimientos')}
                    />
                </div>

                {/* Responsable y Ubicación */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="responsable">Responsable *</Label>
                        <Input
                            id="responsable"
                            placeholder="Juan Pérez"
                            {...register('responsable')}
                        />
                        {errors.responsable && (
                            <p className="text-sm text-destructive">{errors.responsable.message}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="ubicacion">Ubicación *</Label>
                        <Input
                            id="ubicacion"
                            placeholder="Faena Norte"
                            {...register('ubicacion')}
                        />
                        {errors.ubicacion && (
                            <p className="text-sm text-destructive">{errors.ubicacion.message}</p>
                        )}
                    </div>
                </div>
            </div>
        </FormDialog>
    );
}

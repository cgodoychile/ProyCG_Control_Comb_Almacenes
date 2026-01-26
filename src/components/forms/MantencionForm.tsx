import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { vehiculosApi } from '@/lib/apiService';
import { useQuery } from '@tanstack/react-query';
import { getLocalDate } from '@/lib/utils';

// Validation Schema
const mantencionSchema = z.object({
    fechaIngreso: z.string().min(1, 'La fecha es requerida'),
    vehiculo: z.string().min(1, 'El vehículo es requerido'),
    tipoMantencion: z.string().min(1, 'El tipo de mantención es requerido'),
    kmActual: z.number().min(0, 'El KM debe ser positivo'),
    proximaMantencionKm: z.number().optional(),
    proximaMantencionFecha: z.string().optional(),
    taller: z.string().optional(),
    costo: z.number().min(0).optional(),
    observaciones: z.string().optional(),
    estado: z.enum(['En Proceso', 'Completada', 'Agendada']),
    responsable: z.string().min(1, 'El responsable es requerido'),
});

export type MantencionFormData = z.infer<typeof mantencionSchema>;

interface MantencionFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: MantencionFormData) => Promise<void>;
    initialData?: Partial<MantencionFormData>;
    isLoading?: boolean;
}

export function MantencionForm({
    open,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: MantencionFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<MantencionFormData>({
        resolver: zodResolver(mantencionSchema),
        defaultValues: {
            fechaIngreso: initialData?.fechaIngreso || getLocalDate(),
            vehiculo: initialData?.vehiculo || '',
            responsable: 'Admin',
            kmActual: 0,
        },
    });

    // Fetch Vehicles for dropdown
    const { data: vehiculosResponse } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: vehiculosApi.getAll,
    });
    const vehiculos = vehiculosResponse?.data || [];

    // Reset when opening
    useEffect(() => {
        if (open) {
            reset({
                fechaIngreso: getLocalDate(),
                estado: 'Completada',
                responsable: 'Admin',
                kmActual: 0,
                ...initialData
            });
        }
    }, [open, initialData, reset]);

    const selectedVehiculo = watch('vehiculo');
    const kmActual = watch('kmActual');

    // Auto-calculate Next Maintenance KM (Logic: +10,000 km by default)
    useEffect(() => {
        if (kmActual > 0) {
            // Suggest next maintenance at +10,000 km
            const suggestion = Number(kmActual) + 10000;
            // Only set if field is empty or user hasn't manually overridden it heavily (naive check)
            setValue('proximaMantencionKm', suggestion);
        }
    }, [kmActual, setValue]);

    // Update KM Actual when vehicle selected (if available)
    useEffect(() => {
        if (selectedVehiculo) {
            const vehicleData = vehiculos.find(v => v.id === selectedVehiculo);
            if (vehicleData && vehicleData.kilometraje) {
                setValue('kmActual', Number(vehicleData.kilometraje));
            }
        }
    }, [selectedVehiculo, vehiculos, setValue]);


    const onFormSubmit = async (data: MantencionFormData) => {
        await onSubmit(data);
    };

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit(onFormSubmit)}
            title={initialData ? "Editar Mantención" : "Registrar Mantención"}
            description="Registre los detalles del servicio o reparación realizado."
            isLoading={isLoading}
        >
            <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fechaIngreso">Fecha de Ingreso *</Label>
                        <Input
                            id="fechaIngreso"
                            type="date"
                            {...register('fechaIngreso')}
                        />
                        {errors.fechaIngreso && (
                            <p className="text-sm text-destructive">{errors.fechaIngreso.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="estado">Estado *</Label>
                        <Select
                            onValueChange={(value: any) => setValue('estado', value)}
                            defaultValue="Completada"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Completada">Completada</SelectItem>
                                <SelectItem value="En Proceso">En Proceso</SelectItem>
                                <SelectItem value="Agendada">Agendada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="vehiculo">Vehículo *</Label>
                    <Select
                        onValueChange={(value) => setValue('vehiculo', value)}
                        defaultValue={initialData?.vehiculo}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione vehículo" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehiculos.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                    Patente: {v.id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.vehiculo && (
                        <p className="text-sm text-destructive">{errors.vehiculo.message}</p>
                    )}
                </div>

                {selectedVehiculo && (() => {
                    const v = vehiculos.find(v => v.id === selectedVehiculo);
                    return v ? (
                        <div className="grid gap-2">
                            <Label>Modelo del Vehículo</Label>
                            <Input disabled value={`${v.marca} ${v.modelo}`} className="bg-muted" />
                        </div>
                    ) : null;
                })()}

                <div className="grid gap-2">
                    <Label htmlFor="tipoMantencion">Tipo de Mantención *</Label>
                    <Select
                        onValueChange={(value) => setValue('tipoMantencion', value)}
                        defaultValue={initialData?.tipoMantencion}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Ej: Cambio de Aceite, Frenos..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cambio de Aceite">Cambio de Aceite</SelectItem>
                            <SelectItem value="Frenos">Frenos</SelectItem>
                            <SelectItem value="Neumáticos">Neumáticos</SelectItem>
                            <SelectItem value="Revisión Técnica">Revisión Técnica</SelectItem>
                            <SelectItem value="Mecánica General">Mecánica General</SelectItem>
                            <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.tipoMantencion && (
                        <p className="text-sm text-destructive">{errors.tipoMantencion.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="kmActual">KM Actual *</Label>
                        <Input
                            id="kmActual"
                            type="number"
                            {...register('kmActual', { valueAsNumber: true })}
                        />
                        {errors.kmActual && (
                            <p className="text-sm text-destructive">{errors.kmActual.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="proximaMantencionKm">Próxima Mantención (KM)</Label>
                        <Input
                            id="proximaMantencionKm"
                            type="number"
                            {...register('proximaMantencionKm', { valueAsNumber: true })}
                            placeholder="Ej: 15000"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="proximaMantencionFecha">Fecha Próxima Mantención</Label>
                        <Input
                            id="proximaMantencionFecha"
                            type="date"
                            {...register('proximaMantencionFecha')}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="taller">Taller / Proveedor</Label>
                        <Input
                            id="taller"
                            {...register('taller')}
                            placeholder="Nombre del taller"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="costo">Costo ($)</Label>
                        <Input
                            id="costo"
                            type="number"
                            {...register('costo', { valueAsNumber: true })}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable *</Label>
                    <Input
                        id="responsable"
                        {...register('responsable')}
                    />
                    {errors.responsable && (
                        <p className="text-sm text-destructive">{errors.responsable.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                        id="observaciones"
                        {...register('observaciones')}
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Al registrar, el kilometraje del vehículo se actualizará automáticamente si es mayor al actual.
                    </AlertDescription>
                </Alert>
            </div>
        </FormDialog>
    );
}

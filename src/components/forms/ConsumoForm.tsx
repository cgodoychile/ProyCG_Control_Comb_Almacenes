import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { consumoSchema, ConsumoFormData } from '@/lib/validations';
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
import { AlertCircle } from 'lucide-react';
import { VehicleSearchInput } from '@/components/shared/VehicleSearchInput';

interface ConsumoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ConsumoFormData) => Promise<void>;
    estanques: any[];
    vehiculos: any[];
    initialData?: Partial<ConsumoFormData>;
    isLoading?: boolean;
}

export function ConsumoForm({
    open,
    onClose,
    onSubmit,
    estanques,
    vehiculos,
    initialData,
    isLoading = false,
}: ConsumoFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<ConsumoFormData>({
        resolver: zodResolver(consumoSchema),
        defaultValues: initialData || {
            fecha: format(new Date(), 'yyyy-MM-dd'),
            litrosUsados: 0,
            kilometraje: 0,
            contadorInicial: 0,
            contadorFinal: 0,
        },
    });

    const litrosUsados = watch('litrosUsados');
    const vehiculoSeleccionado = watch('vehiculo');
    const estanqueSeleccionado = watch('estanque');

    // Detectar si es camioneta basado en la lista de vehículos
    const selectedVehicleObj = vehiculos.find(v => v.patente === vehiculoSeleccionado || v.id === vehiculoSeleccionado);
    const isCamioneta = selectedVehicleObj?.tipo?.toLowerCase().includes('camioneta') ||
        selectedVehicleObj?.nombre?.toLowerCase().includes('camioneta');

    // Alerta critica: Si consume > 80L. Si es Camioneta y > 80L también alerta (redundante pero explicito para el usuario)
    const showJustificationWarning = litrosUsados > 80 || (isCamioneta && litrosUsados > 60); // Ejemplo: Umbral menor para camionetas?
    // El usuario dijo "Agregar camioneta a la línea de alerta critica".
    // Si la alerta es > 80L, una camioneta DEFINITIVAMENTE debe alertar.
    // Voy a mantener > 80L como la regla general crítica, pero forzaré la UI a ser explícita.
    const isCritical = litrosUsados > 80;

    // Estado para controlar el modo de ingreso manual
    const [isIngresoManual, setIsIngresoManual] = useState(false);

    // Pre-poblar formulario cuando se edita
    useEffect(() => {
        if (initialData && open) {
            // Reset all form values
            setValue('fecha', initialData.fecha || format(new Date(), 'yyyy-MM-dd'));
            setValue('empresa', initialData.empresa || '');
            setValue('vehiculo', initialData.vehiculo || '');
            setValue('estanque', initialData.estanque || '');
            setValue('litrosUsados', initialData.litrosUsados || 0);
            setValue('kilometraje', initialData.kilometraje || 0);
            setValue('contadorInicial', initialData.contadorInicial || 0);
            setValue('contadorFinal', initialData.contadorFinal || 0);
            setValue('responsable', initialData.responsable || '');
            setValue('justificacion', initialData.justificacion || initialData.observaciones || '');

            // Check if it's manual input
            const isManual = initialData.vehiculo && !vehiculos.find(v => v.id === initialData.vehiculo || v.patente === initialData.vehiculo);
            setIsIngresoManual(isManual);
        } else if (!initialData && open) {
            // Reset to defaults for new entry
            setValue('fecha', format(new Date(), 'yyyy-MM-dd'));
            setValue('empresa', '');
            setValue('vehiculo', '');
            setValue('estanque', '');
            setValue('litrosUsados', 0);
            setValue('kilometraje', 0);
            setValue('contadorInicial', 0);
            setValue('contadorFinal', 0);
            setValue('responsable', '');
            setValue('justificacion', '');
            setIsIngresoManual(false);
        }
    }, [initialData, open, setValue, vehiculos]);

    // Calcular stock disponible del estanque seleccionado
    const estanque = estanques.find(e => e.nombre === estanqueSeleccionado);
    const stockDisponible = estanque ? estanque.stockActual : 0;
    const stockInsuficiente = litrosUsados > stockDisponible;

    const onFormSubmit = async (data: ConsumoFormData) => {
        await onSubmit(data);
    };

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit(onFormSubmit)}
            title={initialData ? 'Editar Registro de Consumo' : 'Nuevo Registro de Consumo'}
            description="Complete los datos del consumo de combustible"
            isLoading={isLoading}
        >
            <div className="grid gap-4">
                {/* Fecha */}
                <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                        id="fecha"
                        type="date"
                        {...register('fecha')}
                        max={format(new Date(), 'yyyy-MM-dd')}
                    />
                    {errors.fecha && (
                        <p className="text-sm text-destructive">{errors.fecha.message}</p>
                    )}
                </div>

                {/* Conductor/Empresa */}
                <div className="grid gap-2">
                    <Label htmlFor="empresa">Conductor/Empresa *</Label>
                    <Input
                        id="empresa"
                        {...register('empresa')}
                        placeholder="Ej: Juan Pérez"
                    />
                    {errors.empresa && (
                        <p className="text-sm text-destructive">{errors.empresa.message}</p>
                    )}
                </div>

                {/* Vehículo */}
                <div className="grid gap-2">
                    <Label htmlFor="vehiculo">Vehículo *</Label>
                    <VehicleSearchInput
                        vehicles={vehiculos}
                        value={vehiculoSeleccionado || ''}
                        onChange={(value) => setValue('vehiculo', value)}
                        onManualEntry={() => setIsIngresoManual(true)}
                        isManualMode={isIngresoManual}
                        placeholder="Buscar por patente..."
                    />
                    {errors.vehiculo && (
                        <p className="text-sm text-destructive">{errors.vehiculo.message}</p>
                    )}

                    {/* Campo de texto para ingreso manual */}
                    {isIngresoManual && (
                        <div className="mt-2">
                            <Input
                                id="vehiculoManual"
                                placeholder="Ingrese la patente del vehículo (ej: ABC-123)"
                                value={vehiculoSeleccionado || ''}
                                onChange={(e) => setValue('vehiculo', e.target.value)}
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                💡 Ingrese la patente del vehículo
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsIngresoManual(false);
                                        setValue('vehiculo', '');
                                    }}
                                    className="text-accent hover:underline ml-2"
                                >
                                    Volver a búsqueda
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Estanque */}
                <div className="grid gap-2">
                    <Label htmlFor="estanque">Estanque *</Label>
                    <Select
                        onValueChange={(value) => setValue('estanque', value)}
                        value={estanqueSeleccionado || undefined}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estanque" />
                        </SelectTrigger>
                        <SelectContent>
                            {estanques.map((estanque) => (
                                <SelectItem key={estanque.id} value={estanque.nombre}>
                                    {estanque.nombre} ({estanque.stockActual}L disponibles)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.estanque && (
                        <p className="text-sm text-destructive">{errors.estanque.message}</p>
                    )}
                </div>

                {/* Litros Usados */}
                <div className="grid gap-2">
                    <Label htmlFor="litrosUsados">Litros Usados *</Label>
                    <Input
                        id="litrosUsados"
                        type="number"
                        step="0.1"
                        {...register('litrosUsados', { valueAsNumber: true })}
                        placeholder="0.0"
                    />
                    {errors.litrosUsados && (
                        <p className="text-sm text-destructive">{errors.litrosUsados.message}</p>
                    )}
                    {estanque && (
                        <Alert className={stockInsuficiente ? 'border-destructive' : ''}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Stock disponible en {estanque.nombre}: <strong>{stockDisponible.toLocaleString()} L</strong>
                                {stockInsuficiente && (
                                    <span className="block mt-1 text-destructive font-medium">
                                        ⚠️ Stock insuficiente. Faltan {(litrosUsados - stockDisponible).toFixed(1)} L
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    {showJustificationWarning && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                ⚠️ Consumo Crítico: Mayor a 80L (Camiones/Maquinaria) o Camionetas. Requiere justificación.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Kilometraje */}
                <div className="grid gap-2">
                    <Label htmlFor="kilometraje">Kilometraje *</Label>
                    <Input
                        id="kilometraje"
                        type="number"
                        {...register('kilometraje', { valueAsNumber: true })}
                        placeholder="0"
                    />
                    {errors.kilometraje && (
                        <p className="text-sm text-destructive">{errors.kilometraje.message}</p>
                    )}
                </div>

                {/* Contadores */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="contadorInicial">Contador Inicial *</Label>
                        <Input
                            id="contadorInicial"
                            type="number"
                            {...register('contadorInicial', { valueAsNumber: true })}
                            placeholder="0"
                        />
                        {errors.contadorInicial && (
                            <p className="text-sm text-destructive">{errors.contadorInicial.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contadorFinal">Contador Final *</Label>
                        <Input
                            id="contadorFinal"
                            type="number"
                            {...register('contadorFinal', { valueAsNumber: true })}
                            placeholder="0"
                        />
                        {errors.contadorFinal && (
                            <p className="text-sm text-destructive">{errors.contadorFinal.message}</p>
                        )}
                    </div>
                </div>

                {/* Responsable */}
                <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable *</Label>
                    <Input
                        id="responsable"
                        {...register('responsable')}
                        placeholder="Nombre empresa responsable"
                    />
                    {errors.responsable && (
                        <p className="text-sm text-destructive">{errors.responsable.message}</p>
                    )}
                </div>

                {/* Justificación */}
                <div className="grid gap-2">
                    <Label htmlFor="justificacion">
                        Justificación/Observaciones {showJustificationWarning && '*'}
                    </Label>
                    <Textarea
                        id="justificacion"
                        {...register('justificacion')}
                        placeholder={showJustificationWarning
                            ? "Justifique el consumo mayor a 80L (mínimo 10 caracteres)"
                            : "Observaciones adicionales (opcional)"
                        }
                        rows={3}
                        className={showJustificationWarning ? 'border-destructive' : ''}
                    />
                    {errors.justificacion && (
                        <p className="text-sm text-destructive">{errors.justificacion.message}</p>
                    )}
                </div>
            </div>
        </FormDialog>
    );
}

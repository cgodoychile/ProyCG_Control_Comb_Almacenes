import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { activoSchema, ActivoFormData } from '@/lib/validations';
import { FormDialog } from '@/components/shared/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { getLocalDate } from '@/lib/utils';

interface ActivoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ActivoFormData) => Promise<void>;
    almacenes?: any[]; // Allow passing list of warehouses
    initialData?: any;
}

export function ActivoForm({ open, onClose, onSubmit, initialData, almacenes = [] }: ActivoFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<ActivoFormData>({
        resolver: zodResolver(activoSchema),
        defaultValues: initialData || {
            id: '',
            nombre: '',
            categoria: '',
            marca: '',
            modelo: '',
            numeroSerie: '',
            ubicacion: '',
            estado: 'operativo',
            fechaAdquisicion: getLocalDate(),
            valorInicial: 0,
            responsable: '',
        },
    });

    const selectedCategory = watch('categoria');
    const [customCategory, setCustomCategory] = useState('');
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // Initialize custom category state if editing existing item with potentially custom category
    useEffect(() => {
        if (initialData) {
            reset(initialData);
            const predefined = ['Camión', 'Camioneta', 'Automóvil', 'Maquinaria', 'Generador', 'Otro'];
            if (initialData.categoria && !predefined.includes(initialData.categoria)) {
                setValue('categoria', 'Otro');
                setCustomCategory(initialData.categoria);
                setIsCustomCategory(true);
            } else {
                setIsCustomCategory(false);
            }
        } else {
            reset({
                id: '',
                nombre: '',
                categoria: '',
                marca: '',
                modelo: '',
                numeroSerie: '',
                ubicacion: '',
                estado: 'operativo',
                fechaAdquisicion: getLocalDate(),
                valorInicial: 0,
                responsable: '',
            });
        }
    }, [initialData, reset, setValue]);

    const onFormSubmit = async (data: ActivoFormData) => {
        // If custom category is used, override the "Otro" value
        if (data.categoria === 'Otro' && customCategory) {
            data.categoria = customCategory;
        }
        await onSubmit(data);
        reset();
        setCustomCategory('');
        setIsCustomCategory(false);
    };

    return (
        <FormDialog
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit(onFormSubmit)}
            title={initialData ? 'Editar Activo' : 'Nuevo Activo'}
            description="Complete los datos del activo (vehículo o equipo)"
        >
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Patente / ID */}
                <div className="grid gap-2">
                    <Label htmlFor="id">ID de Activo {initialData ? '*' : '(Automático)'}</Label>
                    <Input
                        id="id"
                        {...register('id')}
                        disabled={!initialData}
                        placeholder={initialData ? "ID del activo" : "ACT-XXXX (Se genera al guardar)"}
                    />
                    {errors.id && (
                        <p className="text-sm text-destructive">{errors.id.message}</p>
                    )}
                </div>

                {/* Nombre */}
                <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre del Equipo *</Label>
                    <Input
                        id="nombre"
                        {...register('nombre')}
                        placeholder="Ej: Generador Eléctrico 50kVA"
                    />
                    {errors.nombre && (
                        <p className="text-sm text-destructive">{errors.nombre.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Marca */}
                    <div className="grid gap-2">
                        <Label htmlFor="marca">Marca *</Label>
                        <Input
                            id="marca"
                            {...register('marca')}
                            placeholder="Ej: Caterpillar"
                        />
                        {errors.marca && (
                            <p className="text-sm text-destructive">{errors.marca.message}</p>
                        )}
                    </div>

                    {/* Modelo */}
                    <div className="grid gap-2">
                        <Label htmlFor="modelo">Modelo *</Label>
                        <Input
                            id="modelo"
                            {...register('modelo')}
                            placeholder="Ej: XQ60"
                        />
                        {errors.modelo && (
                            <p className="text-sm text-destructive">{errors.modelo.message}</p>
                        )}
                    </div>
                </div>

                {/* Número de Serie */}
                <div className="grid gap-2">
                    <Label htmlFor="numeroSerie">Número de Serie / N/S *</Label>
                    <Input
                        id="numeroSerie"
                        {...register('numeroSerie')}
                        placeholder="Ej: S-987654321"
                    />
                    {errors.numeroSerie && (
                        <p className="text-sm text-destructive">{errors.numeroSerie.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Categoría */}
                    <div className="grid gap-2">
                        <Label htmlFor="categoria">Categoría *</Label>
                        <div className="flex flex-col gap-2">
                            <Select
                                onValueChange={(value) => {
                                    setValue('categoria', value);
                                    setIsCustomCategory(value === 'Otro');
                                }}
                                defaultValue={isCustomCategory ? 'Otro' : initialData?.categoria}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Camión">Camión</SelectItem>
                                    <SelectItem value="Camioneta">Camioneta</SelectItem>
                                    <SelectItem value="Automóvil">Automóvil</SelectItem>
                                    <SelectItem value="Maquinaria">Maquinaria</SelectItem>
                                    <SelectItem value="Generador">Generador</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomCategory && (
                                <Input
                                    placeholder="Especifique..."
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                />
                            )}
                        </div>
                        {errors.categoria && (
                            <p className="text-sm text-destructive">{errors.categoria.message}</p>
                        )}
                    </div>

                    {/* Estado */}
                    <div className="grid gap-2">
                        <Label htmlFor="estado">Estado *</Label>
                        <Select
                            onValueChange={(value) => setValue('estado', value as 'operativo' | 'mantencion' | 'fuera_servicio')}
                            defaultValue={initialData?.estado || 'operativo'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operativo">Operativo</SelectItem>
                                <SelectItem value="mantencion">En Mantención</SelectItem>
                                <SelectItem value="fuera_servicio">Fuera de Servicio</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.estado && (
                            <p className="text-sm text-destructive">{errors.estado.message}</p>
                        )}
                    </div>
                </div>

                {/* Ubicación (Bodega o Manual) */}
                <div className="grid gap-2">
                    <Label htmlFor="ubicacion">Ubicación *</Label>
                    <Select
                        onValueChange={(value) => setValue('ubicacion', value)}
                        defaultValue={initialData?.ubicacion}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="En Terreno">En Terreno</SelectItem>
                            <SelectItem value="Taller Externo">Taller Externo</SelectItem>
                            {almacenes.map((a: any) => (
                                <SelectItem key={a.id} value={a.id}>{a.nombre} (Bodega)</SelectItem>
                            ))}
                            <SelectItem value="Otra">Otra (Manual)</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Fallback to text input if needed or if user selects "Otra"? 
                        The schema expects a string. If they select a warehouse, we store the name.
                        Maybe we should allow free text too?
                        Let's simplify: Use a datalist or just a Select combined with Input logic? 
                        The user asked to "Choose an existing warehouse". 
                        Let's keep the Select as primary. If they want custom, maybe just assume "En Terreno" or let them type in a separate field if "Otra" is chosen.
                        For now, let's implement standard Input logic if "Otra" is selected, similar to Category.
                    */}
                    {/* Wait, the original was just an Input. Let's make it a smart combo. */}
                    {watch('ubicacion') === 'Otra' && (
                        <Input
                            className="mt-2"
                            placeholder="Especifique ubicación manual"
                            onChange={(e) => setValue('ubicacion', e.target.value)}
                        />
                    )}

                    {errors.ubicacion && (
                        <p className="text-sm text-destructive">{errors.ubicacion.message}</p>
                    )}
                </div>


                <div className="grid grid-cols-2 gap-4">
                    {/* Fecha de Adquisición */}
                    <div className="grid gap-2">
                        <Label htmlFor="fechaAdquisicion">Fecha de Adquisición *</Label>
                        <Input
                            id="fechaAdquisicion"
                            type="date"
                            {...register('fechaAdquisicion')}
                        />
                        {errors.fechaAdquisicion && (
                            <p className="text-sm text-destructive">{errors.fechaAdquisicion.message}</p>
                        )}
                    </div>

                    {/* Valor Inicial */}
                    <div className="grid gap-2">
                        <Label htmlFor="valorInicial">Valor Inicial (CLP) *</Label>
                        <Input
                            id="valorInicial"
                            type="number"
                            {...register('valorInicial', { valueAsNumber: true })}
                            placeholder="0"
                        />
                        {errors.valorInicial && (
                            <p className="text-sm text-destructive">{errors.valorInicial.message}</p>
                        )}
                    </div>
                </div>

                {/* Responsable */}
                <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable *</Label>
                    <Input
                        id="responsable"
                        {...register('responsable')}
                        placeholder="Ej: Juan Pérez"
                    />
                    {errors.responsable && (
                        <p className="text-sm text-destructive">{errors.responsable.message}</p>
                    )}
                </div>
            </div>
        </FormDialog>
    );
}

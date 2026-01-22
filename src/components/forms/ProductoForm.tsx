import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ProductoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    almacenId: string;
    initialData?: any;
}

export function ProductoForm({ open, onClose, onSubmit, almacenId, initialData }: ProductoFormProps) {
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
        defaultValues: initialData || {
            nombre: '',
            categoria: '',
            cantidad: 0,
            unidad: '',
            stockMinimo: 0,
            valorUnitario: 0,
            proveedorPrincipal: '',
            esActivo: false,
            esRetornable: false,
            cantidadEnUso: 0,
            responsable: '',
            proveedor: '',
            referencia: ''
        }
    });

    useEffect(() => {
        const parseBool = (val: any) => {
            if (val === true || val === 'true') return true;
            if (val === false || val === 'false') return false;
            if (typeof val === 'string') {
                const s = val.toUpperCase();
                return s === 'TRUE' || s === 'VERDADERO' || s === 'SÍ' || s === 'SI';
            }
            return !!val;
        };

        const defaultValues = {
            nombre: '',
            categoria: '',
            cantidad: 0,
            unidad: '',
            stockMinimo: 0,
            valorUnitario: 0,
            proveedorPrincipal: '',
            esActivo: false,
            esRetornable: false,
            cantidadEnUso: 0,
            responsable: '',
            proveedor: '',
            referencia: ''
        };

        if (open) {
            const cleanedData = initialData ? {
                ...initialData,
                esActivo: parseBool(initialData.esActivo),
                esRetornable: parseBool(initialData.esRetornable)
            } : {};

            reset({
                ...defaultValues,
                ...cleanedData
            });
        }
    }, [initialData, reset, open]);

    const handleFormSubmit = (data: any) => {
        // Asegurar que todos los campos numéricos y booleanos tengan valores válidos
        const cleanedData = {
            almacenId: String(almacenId || ''),
            nombre: String(data.nombre || '').trim(),
            categoria: String(data.categoria || '').trim(),
            cantidad: Number(data.cantidad) || 0,
            unidad: String(data.unidad || '').trim(),
            stockMinimo: Number(data.stockMinimo) || 0,
            valorUnitario: Number(data.valorUnitario) || 0,
            proveedorPrincipal: String(data.proveedorPrincipal || '').trim(),
            estado: String(data.estado || 'activo'),
            esRetornable: Boolean(data.esRetornable),
            cantidadEnUso: Number(data.cantidadEnUso || 0),
            esActivo: Boolean(data.esActivo),
            responsable: String(data.responsable || '').trim(),
            proveedor: String(data.proveedor || '').trim(),
            referencia: String(data.referencia || '').trim()
        };

        console.error('🚀 PROYCG DEBUG - PAYLOAD IDENTIFICADO:', cleanedData);
        (window as any).debugLastPayload = cleanedData;
        onSubmit(cleanedData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? '📝 Editar Producto' : '📥 Nuevo Producto / Entrada'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="nombre">Nombre del Producto *</Label>
                            <Input
                                id="nombre"
                                {...register('nombre', { required: "El nombre es obligatorio" })}
                                placeholder="Ej: Bomba de Agua"
                                className={errors.nombre ? "border-destructive" : ""}
                            />
                            {errors.nombre && <p className="text-[10px] text-destructive">{errors.nombre.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <Input
                                id="categoria"
                                {...register('categoria', { required: "La categoría es obligatoria" })}
                                placeholder="Ej: Repuestos"
                                className={errors.categoria ? "border-destructive" : ""}
                            />
                            {errors.categoria && <p className="text-[10px] text-destructive">{errors.categoria.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unidad">Unidad *</Label>
                            <Input
                                id="unidad"
                                {...register('unidad', { required: "La unidad es obligatoria" })}
                                placeholder="Ej: unidades, kg, L"
                                className={errors.unidad ? "border-destructive" : ""}
                            />
                            {errors.unidad && <p className="text-[10px] text-destructive">{errors.unidad.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cantidad">{initialData ? 'Stock Actual' : 'Cantidad de Entrada *'}</Label>
                            <Input
                                id="cantidad"
                                type="number"
                                {...register('cantidad', { required: "La cantidad es obligatoria", valueAsNumber: true, min: 0 })}
                                placeholder="0"
                                className={errors.cantidad ? "border-destructive" : ""}
                            />
                            {errors.cantidad && <p className="text-[10px] text-destructive">{errors.cantidad.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                            <Input
                                id="stockMinimo"
                                type="number"
                                {...register('stockMinimo', { valueAsNumber: true, min: 0 })}
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="valorUnitario">Valor Unitario (CLP)</Label>
                            <Input
                                id="valorUnitario"
                                type="number"
                                {...register('valorUnitario', { valueAsNumber: true, min: 0 })}
                                placeholder="0"
                            />
                        </div>

                        {initialData && (
                            <div className="space-y-2">
                                <Label htmlFor="cantidadEnUso" className="text-accent font-bold">Cantidad EN USO</Label>
                                <Input
                                    id="cantidadEnUso"
                                    type="number"
                                    {...register('cantidadEnUso', { valueAsNumber: true, min: 0 })}
                                    className="border-accent/50 focus:border-accent"
                                />
                                <p className="text-[10px] text-muted-foreground">Herramientas/Equipos actualmente fuera de bodega.</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="responsable">Responsable {initialData ? '' : '*'}</Label>
                            <Input
                                id="responsable"
                                {...register('responsable', { required: !initialData })}
                                placeholder="¿Quién recibe?"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="proveedorPrincipal">Proveedor Principal</Label>
                            <Input
                                id="proveedorPrincipal"
                                {...register('proveedorPrincipal')}
                                placeholder="Nombre del proveedor habitual"
                            />
                        </div>
                    </div>

                    {!initialData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-success/5 border-success/20">
                            <div className="col-span-2">
                                <h4 className="text-xs font-bold text-success uppercase mb-3">Detalles de la Entrega (Guía/Factura)</h4>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proveedor">Proveedor</Label>
                                <Input
                                    id="proveedor"
                                    {...register('proveedor')}
                                    placeholder="Nombre del proveedor"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="referencia">Nº Guía / Factura</Label>
                                <Input
                                    id="referencia"
                                    {...register('referencia')}
                                    placeholder="Referencia de ingreso"
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/10">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">¿Es un Activo?</Label>
                                <p className="text-xs text-muted-foreground">
                                    Se registrará en el módulo de Activos.
                                </p>
                            </div>
                            <Controller
                                control={control}
                                name="esActivo"
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/5">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">¿Es Retornable?</Label>
                                <p className="text-xs text-muted-foreground">
                                    Herramientas que vuelven a bodega.
                                </p>
                            </div>
                            <Controller
                                control={control}
                                name="esRetornable"
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-accent text-accent-foreground font-bold border-2 border-white/20">
                            {initialData ? '🚀 ACTUALIZAR PRODUCTO (V3)' : '📥 REGISTRAR ENTRADA (V3)'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

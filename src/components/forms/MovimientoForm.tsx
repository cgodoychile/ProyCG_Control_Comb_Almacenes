import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Almacen {
    id: string;
    nombre: string;
}

interface MovimientoFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    almacenId: string;
    productoId: string;
    tipo: 'entrada' | 'salida' | 'traslado' | 'retorno' | 'baja';
    almacenes?: Almacen[]; // List of warehouses for transfers
    isRetornable?: boolean;
    initialData?: any;
}

export function MovimientoForm({ open, onClose, onSubmit, almacenId, productoId, tipo, almacenes = [], isRetornable = false, initialData }: MovimientoFormProps) {
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            cantidad: initialData?.cantidad || 0,
            responsable: initialData?.responsable || '',
            guiaReferencia: '',
            proveedor: '',
            almacenDestino: '',
            motivo: '',
            observaciones: '',
            proveedorTransporte: '',
            fechaDevolucion: ''
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                cantidad: initialData.cantidad || 0,
                responsable: initialData.responsable || '',
                guiaReferencia: '',
                proveedor: '',
                almacenDestino: '',
                motivo: '',
                observaciones: '',
                proveedorTransporte: '',
                fechaDevolucion: ''
            });
        }
    }, [initialData, reset]);

    const selectedAlmacenDestino = watch('almacenDestino');

    const handleFormSubmit = (data: any) => {
        const payload: any = {
            productoId,
            tipo: tipo,
            cantidad: data.cantidad,
            responsable: data.responsable,
            guiaReferencia: data.guiaReferencia,
            motivo: data.motivo,
            observaciones: data.observaciones,
            fechaDevolucion: data.fechaDevolucion
        };

        if (tipo === 'entrada') {
            payload.almacenId = almacenId;
            payload.proveedor = data.proveedor;
        } else if (tipo === 'salida' || tipo === 'retorno' || tipo === 'baja') {
            payload.almacenId = almacenId;
            payload.almacenOrigen = almacenId;
        } else if (tipo === 'traslado') {
            payload.almacenOrigen = almacenId;
            payload.almacenDestino = data.almacenDestino;
            payload.proveedorTransporte = data.proveedorTransporte;
        }

        onSubmit(payload);
        reset();
    };

    const otrasBodegas = almacenes.filter(a => a.id !== almacenId);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {tipo === 'entrada' ? '📥 Registrar Entrada' :
                            tipo === 'salida' ? '📤 Registrar Salida' :
                                tipo === 'retorno' ? '↩️ Retorno a Bodega' :
                                    tipo === 'baja' ? '⚠️ Dar de Baja' : '🚚 Traslado entre Bodegas'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cantidad">Cantidad *</Label>
                            <Input
                                id="cantidad"
                                type="number"
                                {...register('cantidad', { required: true, valueAsNumber: true, min: 1 })}
                                placeholder="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="responsable">Responsable *</Label>
                            <Input
                                id="responsable"
                                {...register('responsable', { required: true })}
                                placeholder="Nombre"
                            />
                        </div>
                    </div>

                    {tipo === 'traslado' && (
                        <div className="space-y-2">
                            <Label htmlFor="almacenDestino">Bodega de Destino *</Label>
                            <Select
                                onValueChange={(val) => setValue('almacenDestino', val)}
                                value={selectedAlmacenDestino}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione bodega" />
                                </SelectTrigger>
                                <SelectContent>
                                    {otrasBodegas.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="guiaReferencia">Nº Guía / Factura</Label>
                            <Input
                                id="guiaReferencia"
                                {...register('guiaReferencia')}
                                placeholder="Ej: G1234"
                            />
                        </div>

                        {tipo === 'entrada' ? (
                            <div className="space-y-2">
                                <Label htmlFor="proveedor">Proveedor</Label>
                                <Input
                                    id="proveedor"
                                    {...register('proveedor')}
                                    placeholder="Nombre"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="motivo">Motivo</Label>
                                <Input
                                    id="motivo"
                                    {...register('motivo')}
                                    placeholder={tipo === 'retorno' ? 'Ej: Fin de obra' : tipo === 'baja' ? 'Ej: Daño irreparable' : 'Ej: Uso en Terreno'}
                                />
                            </div>
                        )}
                    </div>

                    {tipo === 'salida' && isRetornable && (
                        <div className="space-y-2 border-l-4 border-indigo-500 pl-4 bg-indigo-50/50 p-2 rounded-r">
                            <Label htmlFor="fechaDevolucion" className="text-indigo-700 font-bold">Fecha Estimada de Devolución</Label>
                            <Input
                                id="fechaDevolucion"
                                type="date"
                                {...register('fechaDevolucion', { required: true })}
                                className="border-indigo-200 focus-visible:ring-indigo-500"
                            />
                            <p className="text-[10px] text-muted-foreground">Requerido para el seguimiento de productos retornables.</p>
                        </div>
                    )}

                    {tipo === 'traslado' && (
                        <div className="space-y-2">
                            <Label htmlFor="proveedorTransporte">Empresa de Transporte</Label>
                            <Input
                                id="proveedorTransporte"
                                {...register('proveedorTransporte')}
                                placeholder="Nombre de la empresa"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <Textarea
                            id="observaciones"
                            {...register('observaciones')}
                            placeholder="Detalles adicionales..."
                            className="resize-none"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={tipo === 'traslado' && !selectedAlmacenDestino}
                            className={
                                tipo === 'entrada' ? 'bg-success text-success-foreground hover:bg-success/90' :
                                    tipo === 'salida' ? 'bg-warning text-warning-foreground hover:bg-warning/90' :
                                        tipo === 'retorno' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                            tipo === 'baja' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
                                                'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }
                        >
                            {tipo === 'entrada' ? '📥 Confirmar Entrada' :
                                tipo === 'salida' ? '📤 Confirmar Salida' :
                                    tipo === 'retorno' ? '↩️ Confirmar Retorno' :
                                        tipo === 'baja' ? '⚠️ Confirmar Baja' : '🚚 Confirmar Traslado'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

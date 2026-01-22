import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AlmacenFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export function AlmacenForm({ open, onClose, onSubmit, initialData }: AlmacenFormProps) {
    const { register, handleSubmit, setValue, reset } = useForm({
        defaultValues: initialData || {
            nombre: '',
            ubicacion: '',
            responsable: '',
            estado: 'activo'
        }
    });

    useEffect(() => {
        if (open) {
            reset(initialData || {
                nombre: '',
                ubicacion: '',
                responsable: '',
                estado: 'activo'
            });
        }
    }, [initialData, reset, open]);

    const handleFormSubmit = (data: any) => {
        onSubmit(data);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Editar Almacén' : 'Nuevo Almacén'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Almacén *</Label>
                        <Input
                            id="nombre"
                            {...register('nombre', { required: true })}
                            placeholder="Ej: Bodega Central"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ubicacion">Ubicación *</Label>
                        <Input
                            id="ubicacion"
                            {...register('ubicacion', { required: true })}
                            placeholder="Ej: Santiago Centro"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="responsable">Responsable *</Label>
                        <Input
                            id="responsable"
                            {...register('responsable', { required: true })}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select
                            defaultValue={initialData?.estado || 'activo'}
                            onValueChange={(value) => setValue('estado', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="activo">Activo</SelectItem>
                                <SelectItem value="inactivo">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-accent text-accent-foreground">
                            {initialData ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

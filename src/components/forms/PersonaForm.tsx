import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Persona } from '@/types/crm';

type PersonaFormData = Omit<Persona, 'fechaRegistro'>;
import { useEffect } from 'react';

const formSchema = z.object({
    id: z.string().min(1, 'El ID (RUT/DNI) es requerido'),
    nombreCompleto: z.string().min(3, 'El nombre completo es requerido'),
    rol: z.string().min(1, 'El rol es requerido'),
    empresa: z.string().min(1, 'La empresa es requerida'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().optional(),
    estado: z.enum(['activo', 'inactivo']),
    observaciones: z.string().optional(),
});

interface PersonaFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: PersonaFormData) => void;
    initialData?: Persona | null;
}

export function PersonaForm({ open, onClose, onSubmit, initialData }: PersonaFormProps) {
    const form = useForm<PersonaFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: '',
            nombreCompleto: '',
            rol: 'Operador',
            empresa: '',
            email: '',
            telefono: '',
            estado: 'activo',
            observaciones: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                id: initialData.id,
                nombreCompleto: initialData.nombreCompleto,
                rol: initialData.rol,
                empresa: initialData.empresa,
                email: initialData.email || '',
                telefono: initialData.telefono || '',
                estado: initialData.estado,
                observaciones: initialData.observaciones || '',
            });
        } else {
            form.reset({
                id: '',
                nombreCompleto: '',
                rol: 'Operador',
                empresa: '',
                email: '',
                telefono: '',
                estado: 'activo',
                observaciones: '',
            });
        }
    }, [initialData, form, open]);

    const handleSubmit = (values: PersonaFormData) => {
        onSubmit(values);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Persona' : 'Registrar Nueva Persona'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID (RUT/DNI)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 12.345.678-9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="activo">Activo</SelectItem>
                                                <SelectItem value="inactivo">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="nombreCompleto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre y Apellidos" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="rol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rol / Cargo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Chofer, Operador..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="empresa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Enel" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+56 9..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="observaciones"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Información adicional relevante..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {initialData ? 'Guardar Cambios' : 'Registrar Persona'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

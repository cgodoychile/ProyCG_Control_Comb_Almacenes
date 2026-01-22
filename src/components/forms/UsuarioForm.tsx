import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UsuarioFormData {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'user' | 'viewer';
}

interface UsuarioFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: UsuarioFormData) => void;
    initialData?: any;
    isLoading?: boolean;
}

export function UsuarioForm({ open, onClose, onSubmit, initialData, isLoading }: UsuarioFormProps) {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UsuarioFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'viewer'
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                email: initialData.email,
                password: '', // Do not populate password
                role: initialData.role
            });
        } else {
            reset({
                name: '',
                email: '',
                password: '',
                role: 'viewer'
            });
        }
    }, [initialData, reset, open]);

    const handleFormSubmit = (data: UsuarioFormData) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            {...register('name', { required: 'El nombre es obligatorio' })}
                            placeholder="Nombre completo"
                        />
                        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email', { required: 'El email es obligatorio' })}
                            placeholder="usuario@ejemplo.com"
                        />
                        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="text" // Visible for admin convenience or password type? Text is easier for initial setup.
                            {...register('password', { required: !initialData ? 'La contraseña es obligatoria' : false })}
                            placeholder={initialData ? 'Dejar en blanco para mantener' : 'Contraseña'}
                        />
                        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select
                            onValueChange={(value) => setValue('role', value as any)}
                            defaultValue={initialData?.role || 'viewer'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="user">Operador (Editor)</SelectItem>
                                <SelectItem value="viewer">Visor (Lectura)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

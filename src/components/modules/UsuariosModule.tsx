import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosApi, auditoriaApi } from '@/lib/apiService';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { UsuarioForm } from '@/components/forms/UsuarioForm';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ConfirmDeleteWithJustificationDialog } from '@/components/shared/ConfirmDeleteWithJustificationDialog';

export function UsuariosModule() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { isAdmin, user } = useAuth();
    const { execute, loading: isActionLoading } = useApi();

    // Fetch Data
    const { data: usuariosResponse, isLoading } = useQuery({
        queryKey: ['usuarios'],
        queryFn: usuariosApi.getAll
    });

    const usuariosData = usuariosResponse?.data || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: usuariosApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast({ title: "✅ Usuario creado", description: "El usuario ha sido registrado." });
            setIsFormOpen(false);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message || "Error al crear usuario." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => usuariosApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast({ title: "✅ Usuario actualizado", description: "Los cambios se han guardado." });
            setIsFormOpen(false);
            setEditingUsuario(null);
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message || "Error al actualizar usuario." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, justification }: { id: string, justification: string }) =>
            usuariosApi.delete(id, { justificacion: justification }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast({ title: "✅ Usuario eliminado", description: "El usuario ha sido eliminado." });
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "❌ Error", description: error.message || "Error al eliminar usuario." });
        }
    });

    const handleNuevoUsuario = () => {
        setEditingUsuario(null);
        setIsFormOpen(true);
    };

    const handleEdit = (usuario: any) => {
        setEditingUsuario(usuario);
        setIsFormOpen(true);
    };

    const handleDelete = async (usuario: any) => {
        setUsuarioToDelete(usuario);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async (justification: string) => {
        if (!usuarioToDelete) return;

        if (!isAdmin) {
            // Flow for non-admins: Send a deletion request
            await execute(
                auditoriaApi.create({
                    modulo: 'Usuarios',
                    accion: 'solicitud_eliminacion',
                    mensaje: `Solicitud de eliminación de Usuario: ${usuarioToDelete.name || usuarioToDelete.email} (ID: ${usuarioToDelete.email})`,
                    tipo: 'warning',
                    usuario: user?.email || 'Usuario',
                    justificacion: justification
                }),
                {
                    successMessage: "Solicitud de eliminación enviada para aprobación del administrador.",
                    onSuccess: () => {
                        setIsDeleteDialogOpen(false);
                        setUsuarioToDelete(null);
                    }
                }
            );
        } else {
            // Flow for admins: Direct deletion
            await deleteMutation.mutateAsync({
                id: usuarioToDelete.id || usuarioToDelete.email,
                justification
            });
            setIsDeleteDialogOpen(false);
            setUsuarioToDelete(null);
        }
    };

    const handleSubmit = (data: any) => {
        if (editingUsuario) {
            updateMutation.mutate({ id: editingUsuario.email, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <Badge variant="default" className="bg-primary">Administrador</Badge>;
            case 'user': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Operador</Badge>;
            default: return <Badge variant="outline">Visor</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando usuarios...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Gestión de Usuarios
                    </h2>
                    <p className="text-sm text-muted-foreground">Administración de accesos y roles del sistema</p>
                </div>
                <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleNuevoUsuario}
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                </Button>
            </div>

            <div className="card-fuel rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="bg-secondary/50">
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosData.map((usuario: any) => (
                                <tr key={usuario.email} className="animate-fade-in">
                                    <td className="font-medium">
                                        {usuario.name || 'Sin nombre'}
                                    </td>
                                    <td className="font-mono text-sm">{usuario.email}</td>
                                    <td>{getRoleBadge(usuario.role)}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(usuario)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(usuario)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <UsuarioForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingUsuario(null);
                }}
                onSubmit={handleSubmit}
                initialData={editingUsuario}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <ConfirmDeleteWithJustificationDialog
                open={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setUsuarioToDelete(null);
                }}
                onConfirm={confirmDelete}
                isLoading={deleteMutation.isPending || isActionLoading}
                title="¿Eliminar Usuario?"
                description="Esta acción eliminará permanentemente el acceso del usuario al sistema. Se requiere una justificación."
                itemName={usuarioToDelete?.name || usuarioToDelete?.email}
                isAdmin={isAdmin}
                isCritical={true}
            />
        </div>
    );
}

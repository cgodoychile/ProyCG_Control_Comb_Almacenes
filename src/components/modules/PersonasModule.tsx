import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personasApi, consumosApi, vehiculosApi, movimientosAlmacenApi } from '@/lib/apiService';
import { PersonaForm } from '@/components/forms/PersonaForm';
import { PersonaDetailView } from './PersonaDetailView';
import {
    Users,
    UserPlus,
    Search,
    Edit,
    Trash2,
    Eye,
    Building2,
    Mail,
    Phone,
    UserCheck,
    UserX,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/dashboard/KPICard';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { speakSuccess } from '@/utils/voiceNotification';
import { useApi } from '@/hooks/useApi';
import type { Persona } from '@/types/crm';

export function PersonasModule() {
    const { toast } = useToast();
    const { canEdit } = useAuth();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

    // Initial Fetch
    const { data: personasResponse, isLoading } = useQuery({
        queryKey: ['personas'],
        queryFn: personasApi.getAll
    });

    const personas = personasResponse?.data || [];

    // Stats
    const stats = useMemo(() => {
        return {
            total: personas.length,
            activos: personas.filter(p => p.estado === 'activo').length,
            empresas: new Set(personas.map(p => p.empresa)).size,
        };
    }, [personas]);

    const filteredPersonas = personas
        .filter(p =>
            p.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.empresa.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Sort by fechaRegistro descending (newest first)
            const dateA = new Date(a.fechaRegistro || 0).getTime();
            const dateB = new Date(b.fechaRegistro || 0).getTime();
            return dateB - dateA;
        });

    const { execute, loading: isActionLoading } = useApi();

    const handleCreate = async (data: Partial<Persona>) => {
        const result = await execute(personasApi.create(data), {
            successMessage: "El personal se ha guardado correctamente.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['personas'] });
                speakSuccess();
                setIsFormOpen(false);
            }
        });
    };

    const handleUpdate = async (id: string, data: Partial<Persona>) => {
        await execute(personasApi.update(id, data), {
            successMessage: "Los cambios se han guardado.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['personas'] });
                speakSuccess();
                setIsFormOpen(false);
                setEditingPersona(null);
            }
        });
    };

    const handleDelete = async (id: string) => {
        await execute(personasApi.delete(id), {
            successMessage: "Persona eliminada correctamente.",
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['personas'] });
            }
        });
    };

    if (selectedPersonaId) {
        const persona = personas.find(p => p.id === selectedPersonaId);
        if (persona) {
            return (
                <PersonaDetailView
                    persona={persona}
                    onBack={() => setSelectedPersonaId(null)}
                />
            );
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Personal</h2>
                    <p className="text-muted-foreground">Listado de personas vinculadas a la operación</p>
                </div>
                {canEdit && (
                    <Button
                        size="sm"
                        className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => {
                            setEditingPersona(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Agregar Persona
                    </Button>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Personal"
                    value={stats.total.toString()}
                    icon={Users}
                    variant="default"
                />
                <KPICard
                    title="Personal Activo"
                    value={stats.activos.toString()}
                    icon={UserCheck}
                    variant="success"
                />
                <KPICard
                    title="Empresas"
                    value={stats.empresas.toString()}
                    icon={Building2}
                    variant="default"
                />
            </div>

            {/* List and Search */}
            <div className="card-fuel rounded-xl border border-border p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, RUT, rol o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-secondary/50 border-border/50"
                        />
                    </div>
                </div>

                <div className="relative overflow-x-auto rounded-lg border border-border/50">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Nombre / ID</th>
                                <th className="px-6 py-4 font-semibold">Rol / Empresa</th>
                                <th className="px-6 py-4 font-semibold">Contacto</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                                        Cargando personal...
                                    </td>
                                </tr>
                            ) : filteredPersonas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                                        No se encontraron personas.
                                    </td>
                                </tr>
                            ) : filteredPersonas.map((persona) => (
                                <tr key={persona.id} className="hover:bg-primary/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{persona.nombreCompleto}</span>
                                            <span className="text-xs text-muted-foreground">{persona.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{persona.rol}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Building2 className="w-3 h-3" /> {persona.empresa}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {persona.email && (
                                                <span className="text-xs flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {persona.email}
                                                </span>
                                            )}
                                            {persona.telefono && (
                                                <span className="text-xs flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {persona.telefono}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                            persona.estado === 'activo'
                                                ? "bg-success/20 text-success"
                                                : "bg-destructive/20 text-destructive"
                                        )}>
                                            {persona.estado === 'activo' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                            {persona.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-1 justify-end transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-accent hover:bg-accent/10"
                                                onClick={() => setSelectedPersonaId(persona.id)}
                                                title="Ver detalle de actividad"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {canEdit && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            setEditingPersona(persona);
                                                            setIsFormOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-destructive/10"
                                                        disabled={isActionLoading}
                                                        onClick={() => {
                                                            if (confirm(`¿Eliminar a ${persona.nombreCompleto}?`)) {
                                                                handleDelete(persona.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PersonaForm
                open={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingPersona(null);
                }}
                initialData={editingPersona}
                onSubmit={(data) => {
                    if (editingPersona) {
                        handleUpdate(editingPersona.id, data);
                    } else {
                        handleCreate(data);
                    }
                }}
            />
        </div>
    );
}

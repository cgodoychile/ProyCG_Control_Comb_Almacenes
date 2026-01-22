import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function PerfilModule() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '+56 9 1234 5678',
        location: 'Santiago, Chile',
        department: 'Operaciones',
        position: user?.role === 'admin' ? 'Administrador' : 'Operador',
    });

    const handleSave = () => {
        toast({
            title: "✅ Perfil actualizado",
            description: "Los cambios se han guardado correctamente."
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            phone: '+56 9 1234 5678',
            location: 'Santiago, Chile',
            department: 'Operaciones',
            position: user?.role === 'admin' ? 'Administrador' : 'Operador',
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Mi Perfil</h2>
                    <p className="text-muted-foreground">Información personal y configuración de cuenta</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                                <X className="w-4 h-4" />
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSave} className="gap-2 bg-accent text-accent-foreground">
                                <Save className="w-4 h-4" />
                                Guardar
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" onClick={() => setIsEditing(true)} className="gap-2 bg-accent text-accent-foreground">
                            <Edit className="w-4 h-4" />
                            Editar Perfil
                        </Button>
                    )}
                </div>
            </div>

            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Avatar Section */}
                <div className="card-fuel rounded-xl border border-border p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
                            <User className="w-16 h-16" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold">{formData.name}</h3>
                            <p className="text-sm text-muted-foreground">{formData.position}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formData.department}</p>
                        </div>
                        {isEditing && (
                            <Button variant="outline" size="sm" className="w-full">
                                Cambiar Foto
                            </Button>
                        )}
                    </div>
                </div>

                {/* Information Section */}
                <div className="lg:col-span-2 card-fuel rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold mb-6">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Ubicación</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    disabled={!isEditing}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Departamento</Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo</Label>
                            <Input
                                id="position"
                                value={formData.position}
                                disabled
                                className="bg-secondary/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-fuel rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Miembro desde</p>
                            <p className="text-lg font-semibold">Enero 2024</p>
                        </div>
                    </div>
                </div>

                <div className="card-fuel rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Último acceso</p>
                            <p className="text-lg font-semibold">Hoy, 18:10</p>
                        </div>
                    </div>
                </div>

                <div className="card-fuel rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Mail className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Estado</p>
                            <p className="text-lg font-semibold text-success">Activo</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

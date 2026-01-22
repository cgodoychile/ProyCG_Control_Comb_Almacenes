import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Loader2, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import enelLogo from '@/assets/enel-logo.png';
import profilePhoto from '@/assets/LogoId.png';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login(email, password);
            if (!success) {
                toast({
                    variant: "destructive",
                    title: "Error de inicio de sesión",
                    description: "Credenciales inválidas. Intente nuevamente."
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Ocurrió un error al intentar iniciar sesión."
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary relative overflow-hidden">
                <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-10"
                    style={{
                        backgroundImage: `url(${enelLogo})`,
                        backgroundSize: '60%',
                        backgroundPosition: 'center 20%',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
                <CardHeader className="relative pb-2 pt-24 z-10 space-y-0">
                    <div className="absolute left-6 top-6 h-12 flex items-center justify-start">
                        <img src={enelLogo} alt="Enel" className="h-full object-contain" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4 text-primary shadow-lg overflow-hidden p-0 border-2 border-primary/30">
                            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">ProyCG</CardTitle>
                            <CardDescription>Control de Gestión de Combustible</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Usuario</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    placeholder="admin"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

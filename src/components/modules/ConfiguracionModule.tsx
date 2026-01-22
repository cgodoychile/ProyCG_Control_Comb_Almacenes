import { Settings, Bell, Fuel, AlertTriangle, Mail, Database, Shield, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function ConfiguracionModule() {
    const { toast } = useToast();

    const [config, setConfig] = useState({
        // Alertas de Consumo
        alertaConsumoAlto: true,
        umbralConsumoAlto: 80,
        alertaStockBajo: true,
        umbralStockBajo: 20,
        alertaMantenimiento: true,
        diasAnticipacionMantenimiento: 7,

        // Notificaciones
        notificacionesEmail: true,
        notificacionesPush: false,
        emailNotificaciones: 'admin@fuelcrm.cl',

        // Sistema
        idioma: 'es',
        zonaHoraria: 'America/Santiago',
        formatoFecha: 'DD-MM-YYYY',
        moneda: 'CLP',

        // Seguridad
        sesionExpira: 60,
        requiere2FA: false,

        // Reportes
        frecuenciaReportes: 'semanal',
        incluirGraficos: true,
    });

    const handleSave = () => {
        toast({
            title: "✅ Configuración guardada",
            description: "Los cambios se han aplicado correctamente."
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Configuración</h2>
                    <p className="text-muted-foreground">Personaliza el comportamiento del sistema</p>
                </div>
                <Button size="sm" onClick={handleSave} className="gap-2 bg-accent text-accent-foreground">
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertas de Consumo */}
                <div className="card-fuel rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                            <Fuel className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Alertas de Consumo</h3>
                            <p className="text-xs text-muted-foreground">Configurar umbrales de consumo</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Alerta de Consumo Alto</Label>
                                <p className="text-xs text-muted-foreground">Notificar cuando el consumo supere el umbral</p>
                            </div>
                            <Switch
                                checked={config.alertaConsumoAlto}
                                onCheckedChange={(checked) => setConfig({ ...config, alertaConsumoAlto: checked })}
                            />
                        </div>

                        {config.alertaConsumoAlto && (
                            <div className="space-y-2 pl-4 border-l-2 border-warning/50">
                                <Label htmlFor="umbralConsumo">Umbral de Consumo (Litros)</Label>
                                <Input
                                    id="umbralConsumo"
                                    type="number"
                                    value={config.umbralConsumoAlto}
                                    onChange={(e) => setConfig({ ...config, umbralConsumoAlto: parseInt(e.target.value) })}
                                    className="max-w-xs"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Se enviará alerta cuando un consumo supere {config.umbralConsumoAlto}L
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Alerta de Stock Bajo</Label>
                                <p className="text-xs text-muted-foreground">Notificar cuando el stock esté bajo</p>
                            </div>
                            <Switch
                                checked={config.alertaStockBajo}
                                onCheckedChange={(checked) => setConfig({ ...config, alertaStockBajo: checked })}
                            />
                        </div>

                        {config.alertaStockBajo && (
                            <div className="space-y-2 pl-4 border-l-2 border-destructive/50">
                                <Label htmlFor="umbralStock">Umbral de Stock (%)</Label>
                                <Input
                                    id="umbralStock"
                                    type="number"
                                    value={config.umbralStockBajo}
                                    onChange={(e) => setConfig({ ...config, umbralStockBajo: parseInt(e.target.value) })}
                                    className="max-w-xs"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Alerta cuando el stock esté por debajo del {config.umbralStockBajo}%
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Alertas de Mantenimiento */}
                <div className="card-fuel rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Alertas de Mantenimiento</h3>
                            <p className="text-xs text-muted-foreground">Recordatorios preventivos</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Recordatorios de Mantenimiento</Label>
                                <p className="text-xs text-muted-foreground">Notificar mantenciones próximas</p>
                            </div>
                            <Switch
                                checked={config.alertaMantenimiento}
                                onCheckedChange={(checked) => setConfig({ ...config, alertaMantenimiento: checked })}
                            />
                        </div>

                        {config.alertaMantenimiento && (
                            <div className="space-y-2 pl-4 border-l-2 border-primary/50">
                                <Label htmlFor="diasAnticipacion">Días de Anticipación</Label>
                                <Input
                                    id="diasAnticipacion"
                                    type="number"
                                    value={config.diasAnticipacionMantenimiento}
                                    onChange={(e) => setConfig({ ...config, diasAnticipacionMantenimiento: parseInt(e.target.value) })}
                                    className="max-w-xs"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Notificar {config.diasAnticipacionMantenimiento} días antes del mantenimiento
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notificaciones */}
                <div className="card-fuel rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Notificaciones</h3>
                            <p className="text-xs text-muted-foreground">Canales de comunicación</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notificaciones por Email</Label>
                                <p className="text-xs text-muted-foreground">Recibir alertas por correo</p>
                            </div>
                            <Switch
                                checked={config.notificacionesEmail}
                                onCheckedChange={(checked) => setConfig({ ...config, notificacionesEmail: checked })}
                            />
                        </div>

                        {config.notificacionesEmail && (
                            <div className="space-y-2 pl-4">
                                <Label htmlFor="emailNotif">Email para Notificaciones</Label>
                                <Input
                                    id="emailNotif"
                                    type="email"
                                    value={config.emailNotificaciones}
                                    onChange={(e) => setConfig({ ...config, emailNotificaciones: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notificaciones Push</Label>
                                <p className="text-xs text-muted-foreground">Alertas en tiempo real</p>
                            </div>
                            <Switch
                                checked={config.notificacionesPush}
                                onCheckedChange={(checked) => setConfig({ ...config, notificacionesPush: checked })}
                            />
                        </div>
                    </div>
                </div>

                {/* Sistema */}
                <div className="card-fuel rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Configuración del Sistema</h3>
                            <p className="text-xs text-muted-foreground">Preferencias generales</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="idioma">Idioma</Label>
                            <Select value={config.idioma} onValueChange={(value) => setConfig({ ...config, idioma: value })}>
                                <SelectTrigger id="idioma">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="es">Español</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="zona">Zona Horaria</Label>
                            <Select value={config.zonaHoraria} onValueChange={(value) => setConfig({ ...config, zonaHoraria: value })}>
                                <SelectTrigger id="zona">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="America/Santiago">Santiago (GMT-3)</SelectItem>
                                    <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                                    <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="moneda">Moneda</Label>
                            <Select value={config.moneda} onValueChange={(value) => setConfig({ ...config, moneda: value })}>
                                <SelectTrigger id="moneda">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Seguridad */}
                <div className="card-fuel rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Seguridad</h3>
                            <p className="text-xs text-muted-foreground">Protección de cuenta</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sesion">Expiración de Sesión (minutos)</Label>
                            <Input
                                id="sesion"
                                type="number"
                                value={config.sesionExpira}
                                onChange={(e) => setConfig({ ...config, sesionExpira: parseInt(e.target.value) })}
                            />
                            <p className="text-xs text-muted-foreground">
                                La sesión expirará después de {config.sesionExpira} minutos de inactividad
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Autenticación de Dos Factores</Label>
                                <p className="text-xs text-muted-foreground">Mayor seguridad en el acceso</p>
                            </div>
                            <Switch
                                checked={config.requiere2FA}
                                onCheckedChange={(checked) => setConfig({ ...config, requiere2FA: checked })}
                            />
                        </div>
                    </div>
                </div>

                {/* Reportes */}
                <div className="card-fuel rounded-xl border border-border p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Reportes Automáticos</h3>
                            <p className="text-xs text-muted-foreground">Generación de informes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="frecuencia">Frecuencia de Reportes</Label>
                            <Select value={config.frecuenciaReportes} onValueChange={(value) => setConfig({ ...config, frecuenciaReportes: value })}>
                                <SelectTrigger id="frecuencia">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="diario">Diario</SelectItem>
                                    <SelectItem value="semanal">Semanal</SelectItem>
                                    <SelectItem value="mensual">Mensual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Incluir Gráficos</Label>
                                <p className="text-xs text-muted-foreground">Visualizaciones en reportes</p>
                            </div>
                            <Switch
                                checked={config.incluirGraficos}
                                onCheckedChange={(checked) => setConfig({ ...config, incluirGraficos: checked })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

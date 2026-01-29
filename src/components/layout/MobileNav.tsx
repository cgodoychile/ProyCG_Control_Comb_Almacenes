import {
    Fuel,
    Database,
    Truck,
    Package,
    Bell,
    BarChart3,
    MoreHorizontal,
    FileText,
    User,
    LogOut,
    Warehouse,
    Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileNavProps {
    activeModule: string;
    onModuleChange: (module: string) => void;
}

export function MobileNav({ activeModule, onModuleChange }: MobileNavProps) {
    const { user, logout, isAdmin } = useAuth();
    const { activeAlerts } = useAlerts();

    // Primary mobile items (max 4-5 to fit width)
    const primaryItems = [
        { id: 'dashboard', icon: BarChart3, label: 'Dash' },
        { id: 'consumo', icon: Fuel, label: 'Consumo' },
        { id: 'estanques', icon: Database, label: 'Estanques' },
        { id: 'cargas', icon: Truck, label: 'Cargas' }, // Changed icon to Truck for clarity or keep Droplets? Truck fits 'Cargas' context better visually here? No, Droplets was Cargas. Let's stick to consistent icons.
    ];

    // Secondary items (tucked in "More")
    const secondaryItems = [
        { id: 'vehiculos', icon: Truck, label: 'Vehículos' },
        { id: 'mantenciones', icon: Wrench, label: 'Mant.' },
        { id: 'activos', icon: Package, label: 'Activos' },
        { id: 'alertas', icon: Bell, label: 'Alertas' },
        { id: 'almacenes', icon: Warehouse, label: 'Almacenes' },
        { id: 'personas', icon: User, label: 'Personas' },
        { id: 'reportes', icon: FileText, label: 'Reportes' },
        { id: 'actas', icon: FileText, label: 'Actas de Cargo' },
    ];

    if (isAdmin) {
        secondaryItems.push({ id: 'usuarios', icon: User, label: 'Usuarios' });
        secondaryItems.push({ id: 'auditoria', icon: Database, label: 'Auditoría' });
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex items-center justify-around pb-safe pt-2 px-2 h-16 md:hidden shadow-lg-up">
            {primaryItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onModuleChange(item.id)}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1",
                        activeModule === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}

            {/* More Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
                            secondaryItems.some(i => i.id === activeModule) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className="relative">
                            <MoreHorizontal className="w-5 h-5" />
                            {activeAlerts.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive"></span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">Más</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mb-2">
                    <DropdownMenuLabel>Menú Principal</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {secondaryItems.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            onClick={() => onModuleChange(item.id)}
                            className={cn(
                                "cursor-pointer justify-between",
                                activeModule === item.id && "bg-accent text-accent-foreground"
                            )}
                        >
                            <div className="flex items-center">
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.label}</span>
                            </div>
                            {item.id === 'alertas' && activeAlerts.length > 0 && (
                                <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 rounded-full">
                                    {activeAlerts.length}
                                </span>
                            )}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

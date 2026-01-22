import { useState } from 'react';
import {
  Fuel,
  Database,
  Truck,
  Package,
  Bell,
  BarChart3,
  LogOut,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FileText,
  Warehouse,
  Wrench,
  Users,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import profilePhoto from '@/assets/LogoId.png';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'consumo', label: 'Consumo', icon: Fuel },
  { id: 'estanques', label: 'Estanques', icon: Database },
  { id: 'cargas', label: 'Cargas', icon: Droplets },
  { id: 'vehiculos', label: 'Vehículos', icon: Truck },
  { id: 'mantenciones', label: 'Mantenciones', icon: Wrench },
  { id: 'activos', label: 'Activos', icon: Package },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'almacenes', label: 'Almacenes', icon: Warehouse },
  { id: 'personas', label: 'Personas', icon: Users },
  { id: 'reportes', label: 'Reportes', icon: FileText },
  { id: 'auditoria', label: 'Auditoría', icon: Shield, adminOnly: true },
  { id: 'usuarios', label: 'Usuarios', icon: User, adminOnly: true },
];

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth(); // Destructure isAdmin
  const { activeAlerts } = useAlerts();

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        {/* ... (no change) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg overflow-hidden p-0 border-2 border-primary/30">
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-foreground">ProyCG</h1>
              <p className="text-xs text-muted-foreground">Control de Gestión</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "nav-item w-full relative",
                activeModule === item.id && "active"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.id === 'alertas' && activeAlerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-sidebar"></span>
                )}
              </div>
              {!collapsed && (
                <span className="animate-fade-in flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.id === 'alertas' && activeAlerts.length > 0 && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-fade-in">
                  {activeAlerts.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>



      {/* Collapse Button */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full justify-center h-9"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

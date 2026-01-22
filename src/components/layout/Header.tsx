import { Bell, Search, User, AlertTriangle, AlertCircle, CheckCircle2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useAlerts } from '@/hooks/useAlerts';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onModuleChange?: (module: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function Header({ title, subtitle, onModuleChange, searchValue, onSearchChange }: HeaderProps) {
  const { activeAlerts, handleDismissAll } = useAlerts();
  const { user, logout } = useAuth();
  const alertasNoLeidas = activeAlerts.length;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'critical':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return CheckCircle2;
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10 w-64 bg-secondary border-border"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {alertasNoLeidas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-critical text-critical-foreground text-xs rounded-full flex items-center justify-center animate-pulse-glow">
                  {alertasNoLeidas}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notificaciones</h4>
              {alertasNoLeidas > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={handleDismissAll}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Marcar todo
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {activeAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
                  <CheckCircle2 className="w-8 h-8 text-success mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No tienes notificaciones pendientes</p>
                </div>
              ) : (
                <div className="grid divide-y">
                  {activeAlerts.map((alerta) => {
                    const Icon = getIcon(alerta.tipo);
                    return (
                      <div key={alerta.id} className="p-4 hover:bg-secondary/50 transition-colors">
                        <div className="flex gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            alerta.tipo === 'critical' ? "bg-critical/20 text-critical" :
                              alerta.tipo === 'warning' ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none mb-1">{alerta.titulo}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{alerta.mensaje}</p>
                            <p className="text-[10px] text-muted-foreground mt-2">{alerta.fecha}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onModuleChange?.('perfil')}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onModuleChange?.('configuracion')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

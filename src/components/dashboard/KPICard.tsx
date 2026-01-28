import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'destructive';
  size?: 'default' | 'sm';
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  size = 'default',
  onClick,
  className
}: KPICardProps) {
  const variantStyles = {
    default: 'bg-slate-950 border-white/10 hover:border-primary/30 shadow-2xl',
    accent: 'bg-gradient-to-br from-primary/60 to-primary border-primary/40 hover:border-primary shadow-primary/30',
    success: 'bg-gradient-to-br from-success/60 to-success border-success/40 hover:border-success shadow-success/30',
    warning: 'bg-gradient-to-br from-warning/60 to-warning border-warning/40 hover:border-warning shadow-warning/30',
    destructive: 'bg-gradient-to-br from-critical/60 to-critical border-critical/40 hover:border-critical shadow-critical/30',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-500 shadow-2xl',
        size === 'default' ? 'p-5' : 'p-3',
        'bg-slate-950 text-white', // FORZAR FONDO OSCURO SIEMPRE
        variantStyles[variant],
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl',
        className
      )}
      onClick={onClick}
    >
      {/* Decorative background glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-24 h-24 blur-3xl rounded-full opacity-40 transition-opacity duration-500 group-hover:opacity-60",
        variant === 'accent' && 'bg-primary',
        variant === 'success' && 'bg-success',
        variant === 'warning' && 'bg-warning',
        variant === 'destructive' && 'bg-critical',
        variant === 'default' && 'bg-blue-500'
      )} />

      <div className={cn("flex items-center justify-between relative z-10", size === 'default' ? 'mb-4' : 'mb-2')}>
        <span className={cn(
          "font-bold uppercase tracking-widest transition-colors duration-300",
          size === 'default' ? 'text-[10px]' : 'text-[8px]',
          "text-slate-300 group-hover:text-white" // TEXTO SIEMPRE CLARO SOBRE FONDO OSCURO
        )}>
          {title}
        </span>
        <div className={cn(
          "p-2 rounded-xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-inner",
          "bg-white/10 text-white"
        )}>
          <Icon className={cn(size === 'default' ? 'w-5 h-5' : 'w-4 h-4')} />
        </div>
      </div>
      <div className="relative z-10 space-y-1">
        <p className={cn(
          "font-black tracking-tighter transition-all duration-300 drop-shadow-md text-white border-none",
          size === 'default' ? 'text-3xl' : 'text-xl'
        )}>
          {value}
        </p>
        {subtitle && (
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-wider leading-none",
            "text-slate-400 group-hover:text-slate-200"
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

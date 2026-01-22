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
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  size = 'default',
  onClick
}: KPICardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    accent: 'bg-accent/10 border-accent/20',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    destructive: 'bg-critical/10 border-critical/20',
  };

  return (
    <div
      className={cn(
        'card-fuel rounded-xl border transition-all',
        size === 'default' ? 'p-4' : 'p-2.5',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
      )}
      onClick={onClick}
    >
      <div className={cn("flex items-center justify-between", size === 'default' ? 'mb-2' : 'mb-1')}>
        <span className={cn("text-muted-foreground", size === 'default' ? 'text-sm' : 'text-[10px] uppercase tracking-wider')}>{title}</span>
        <Icon className={cn(
          size === 'default' ? 'w-5 h-5' : 'w-3.5 h-3.5',
          variant === 'accent' && 'text-accent',
          variant === 'success' && 'text-success',
          variant === 'warning' && 'text-warning',
          variant === 'destructive' && 'text-critical',
          variant === 'default' && 'text-primary'
        )} />
      </div>
      <div className="space-y-0.5">
        <p className={cn("font-bold text-foreground", size === 'default' ? 'text-2xl' : 'text-lg')}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground leading-none">{subtitle}</p>}
      </div>
    </div>
  );
}

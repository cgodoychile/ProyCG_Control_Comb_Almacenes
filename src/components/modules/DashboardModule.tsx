import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@/components/dashboard/KPICard';
import { TankStatus } from '@/components/dashboard/TankStatus';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { ConsumoChart } from '@/components/dashboard/ConsumoChart';
import { TopVehiculos } from '@/components/dashboard/TopVehiculos';
import { TopCargas } from '@/components/dashboard/TopCargas';
import { DashboardDetailsModal } from '@/components/dashboard/DashboardDetailsModal';
import { estanquesApi, consumosApi, vehiculosApi, dashboardApi } from '@/lib/apiService';
import { useAlerts } from '@/hooks/useAlerts';
import { subDays, isAfter, format, isSameDay, isSameMonth } from 'date-fns';
import { Fuel, Database, Truck, Bell, TrendingUp, TrendingDown, Gauge, Loader2, AlertTriangle } from 'lucide-react';

export function DashboardModule() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'consumoDiario' | 'consumoSemanal' | 'consumoMensual' | 'consumoMesAnterior' | 'stock' | 'flota' | null>(null);
  const { activeAlerts: alertsFromHook, handleDismiss } = useAlerts();

  // Fetch unified stats from backend
  const { data: statsResponse, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  const { data: estanquesResponse, isLoading: loadingEstanques } = useQuery({
    queryKey: ['estanques'],
    queryFn: estanquesApi.getAll,
  });

  const { data: consumosResponse, isLoading: loadingConsumos } = useQuery({
    queryKey: ['consumos'],
    queryFn: consumosApi.getAll,
  });

  const { data: vehiculosResponse, isLoading: loadingVehiculos } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: vehiculosApi.getAll,
  });

  const stats = statsResponse?.data || {
    combustible: { litrosMesActual: 0, litrosAnioActual: 0, estanquesLowStock: 0, totalStockDisponible: 0 },
    almacenes: { totalBodegas: 0, valorInventarioTotal: 0 },
    alertas: 0,
    flota: { totalVehiculos: 0, enMantencion: 0, mantencionesPendientes: 0 }
  };

  const estanquesData = estanquesResponse?.data || [];
  const consumosData = consumosResponse?.data || [];
  const vehiculosData = vehiculosResponse?.data || [];

  const isLoading = loadingStats || loadingEstanques || loadingConsumos || loadingVehiculos;

  // Calculate KPIs from real data
  const stockTotal = estanquesData.reduce((sum, e) => sum + (e.stockActual || 0), 0);
  const vehiculosActivos = vehiculosData.filter(v => v.estado?.toLowerCase() === 'operativo').length;
  const vehiculosMantencion = vehiculosData.filter(v => {
    const status = v.estado?.toLowerCase() || '';
    return status === 'mantencion' || status === 'mantención';
  }).length;
  const vehiculosFueraServicio = vehiculosData.filter(v => v.estado?.toLowerCase() === 'fuera_servicio').length;

  const rendimientoPromedio = consumosData.length > 0
    ? (consumosData.reduce((sum, c) => sum + (c.rendimiento || 0), 0) / consumosData.length).toFixed(1)
    : '0';

  // Get today's local date
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const thisMonth = format(now, 'yyyy-MM');

  const consumoDiario = consumosData
    .filter(c => {
      const fechaRec = new Date(c.fecha);
      return isSameDay(fechaRec, now);
    })
    .reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

  // Get last 7 days consumption
  const weekAgo = subDays(new Date(), 7);
  const consumoSemanal = consumosData
    .filter(c => {
      const fechaRec = new Date(c.fecha);
      return isAfter(fechaRec, weekAgo);
    })
    .reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

  // Get this month's consumption
  const consumoMensual = consumosData
    .filter(c => {
      const fechaRec = new Date(c.fecha);
      return isSameMonth(fechaRec, now);
    })
    .reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

  // Get last month's consumption
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = format(lastMonth, 'yyyy-MM');
  const consumoMesAnterior = consumosData
    .filter(c => {
      const fechaStr = typeof c.fecha === 'string' ? c.fecha : (c.fecha ? format(new Date(c.fecha), 'yyyy-MM-dd') : '');
      return fechaStr.startsWith(lastMonthStr);
    })
    .reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

  // Filtrar estanques reales (no de prueba)
  const estanquesReales = estanquesData.filter(e =>
    !e.nombre.toLowerCase().includes('prueba') &&
    !e.nombre.toLowerCase().includes('test')
  );

  // Transformar alertas del hook al formato que espera AlertsList si es necesario
  // El hook usa Alerta de useAlerts.ts, DashboardModule usaba un objeto local.
  // Vamos a unificar.
  const mappedAlerts = alertsFromHook.map(a => ({
    id: a.id,
    tipo: (a.tipo === 'info' || a.tipo === 'success' ? 'success' : a.tipo) as 'critical' | 'warning' | 'success',
    mensaje: a.mensaje,
    modulo: a.origen,
    fecha: a.fecha,
    leida: false // En el Dashboard mostramos las activas
  }));

  const alertasActivas = mappedAlerts.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando datos desde Google Sheets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Consumo Crítico (Branding Camioneta) */}
      {(() => {
        const criticalPending = consumosData
          .filter(c => c.litrosUsados >= 80 &&
            (String(c.justificacion || '').trim().length < 10 && String(c.observaciones || '').trim().length < 10))
          .slice(0, 3);

        if (criticalPending.length === 0) return null;

        return (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-critical/20 via-critical/40 to-critical/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 bg-background/80 backdrop-blur-xl border border-critical/30 rounded-2xl shadow-glow-critical overflow-hidden">
              {/* Imagen Camioneta */}
              <div className="relative shrink-0 flex items-center justify-center p-3 bg-critical/10 rounded-full border border-critical/20 shadow-inner">
                <img
                  src="/camioneta.png"
                  alt="Alerta Crítica"
                  className="w-24 md:w-28 h-auto drop-shadow-[0_0_15px_rgba(var(--critical),0.4)] animate-float"
                />
                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-critical animate-bounce shadow-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Contenido Alerta */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xl font-black text-critical tracking-tighter flex items-center gap-2 uppercase italic">
                    <AlertTriangle className="h-6 w-6 animate-pulse" />
                    Consumos Críticos Pendientes
                  </h3>
                  <span className="text-[10px] font-mono bg-critical/20 text-critical px-2 py-0.5 rounded-full border border-critical/30 animate-pulse">
                    PRIORIDAD ALTA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {criticalPending.map((alert, idx) => (
                    <div
                      key={idx}
                      className="group/alert p-3 rounded-xl bg-critical/5 border border-critical/10 hover:bg-critical/20 hover:border-critical/40 hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-critical/70 uppercase">Fuga/Exceso</span>
                        <span className="text-xs font-black text-critical">{alert.litrosUsados} L</span>
                      </div>
                      <p className="font-mono text-sm font-bold text-foreground">{alert.vehiculo || alert.id}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate font-medium uppercase tracking-wider">{alert.empresa}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground italic mt-2">
                  * Estos registros no cumplen con el requerimiento de justificación (mínimo 10 caracteres). Diríjase al módulo de Consumo para regularizar.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Consumo Mensual"
          value={`${stats.combustible.litrosMesActual.toLocaleString('es-ES')} L`}
          subtitle={new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          icon={Fuel}
          variant="accent"
          onClick={() => {
            setModalType('consumoMensual');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Consumo Anual"
          value={`${stats.combustible.litrosAnioActual.toLocaleString('es-ES')} L`}
          subtitle={`Año ${new Date().getFullYear()}`}
          icon={TrendingUp}
          variant="default"
          onClick={() => {
            setModalType('consumoMensual');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Stock Total"
          value={`${stats.combustible.totalStockDisponible.toLocaleString('es-ES')} L`}
          subtitle="Disponible en silos"
          icon={Database}
          variant="success"
          onClick={() => {
            setModalType('stock');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Nivel Bajo"
          value={stats.combustible.estanquesLowStock}
          subtitle="Silos en alerta"
          icon={Bell}
          variant={stats.combustible.estanquesLowStock > 0 ? "warning" : "default"}
          onClick={() => {
            setModalType('stock');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Flota Total"
          value={stats.flota.totalVehiculos}
          subtitle={`${stats.flota.enMantencion} en mantención`}
          icon={Truck}
          variant="default"
          onClick={() => {
            setModalType('flota');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Alertas Sistema"
          value={stats.alertas}
          subtitle="Pendientes de revisión"
          icon={Bell}
          variant={stats.alertas > 0 ? "warning" : "default"}
        />
      </div>

      {/* Charts and Tanks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ConsumoChart consumos={consumosData} />
        </div>
        <TopVehiculos consumos={consumosData} />
      </div>

      {/* Top Cargas y Estanques Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TopCargas consumos={consumosData} />
        <div className="lg:col-span-2">
          <div className="card-fuel p-8 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 opacity-50" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Monitoreo de Estanques
                </h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Estado de Almacenamiento Crítico</p>
              </div>
              <span className="px-4 py-1.5 rounded-2xl bg-slate-800/50 border border-white/5 text-xs font-black text-slate-400 uppercase tracking-tighter">
                {estanquesReales.length} Unidades Activas
              </span>
            </div>

            {estanquesReales.length === 0 ? (
              <p className="text-center text-slate-500 py-12 italic font-medium">Buscando telemetría de estanques...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {estanquesReales.slice(0, 4).map((estanque) => (
                  <TankStatus key={estanque.id} estanque={estanque} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card-fuel p-8 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-critical/5 blur-3xl rounded-full -mr-16 -mt-16" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Bell className="w-5 h-5 text-critical animate-bounce-slow" />
                Alertas Recientes
              </h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Notificaciones del Sistema</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-critical/20 border border-critical/30 text-[10px] font-black text-critical uppercase">
              {mappedAlerts.length} Prioritarias
            </span>
          </div>

          <div className="relative z-10">
            <AlertsList
              alertas={mappedAlerts}
              limit={6}
              onDismiss={handleDismiss}
            />
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      <DashboardDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        data={{
          consumosData,
          estanquesData: estanquesReales,
          activosData: vehiculosData,
          today,
          thisMonth,
          lastMonth
        }}
      />
    </div>
  );
}

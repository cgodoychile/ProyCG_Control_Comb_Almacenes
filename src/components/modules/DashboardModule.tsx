import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@/components/dashboard/KPICard';
import { TankStatus } from '@/components/dashboard/TankStatus';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { ConsumoChart } from '@/components/dashboard/ConsumoChart';
import { TopVehiculos } from '@/components/dashboard/TopVehiculos';
import { TopCargas } from '@/components/dashboard/TopCargas';
import { DashboardDetailsModal } from '@/components/dashboard/DashboardDetailsModal';
import { estanquesApi, consumosApi, vehiculosApi } from '@/lib/apiService';
import { useAlerts } from '@/hooks/useAlerts';
import { subDays, isAfter, format, isSameDay, isSameMonth } from 'date-fns';
import { Fuel, Database, Truck, Bell, TrendingUp, TrendingDown, Gauge, Loader2 } from 'lucide-react';

export function DashboardModule() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'consumoDiario' | 'consumoSemanal' | 'consumoMensual' | 'consumoMesAnterior' | 'stock' | 'flota' | null>(null);
  const { activeAlerts: alertsFromHook, handleDismiss } = useAlerts();

  // Fetch real data from Google Sheets
  const { data: estanquesResponse, isLoading: loadingEstanques } = useQuery({
    queryKey: ['estanques'],
    queryFn: estanquesApi.getAll,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: consumosResponse, isLoading: loadingConsumos } = useQuery({
    queryKey: ['consumos'],
    queryFn: consumosApi.getAll,
    refetchInterval: 30000,
  });

  const { data: vehiculosResponse, isLoading: loadingVehiculos } = useQuery({
    queryKey: ['vehiculos'],
    queryFn: vehiculosApi.getAll,
    refetchInterval: 30000,
  });

  const estanquesData = estanquesResponse?.data || [];
  const consumosData = consumosResponse?.data || [];
  const vehiculosData = vehiculosResponse?.data || [];

  const isLoading = loadingEstanques || loadingConsumos || loadingVehiculos;

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
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);
  const consumoMesAnterior = consumosData
    .filter(c => {
      const fechaStr = typeof c.fecha === 'string' ? c.fecha : (c.fecha ? new Date(c.fecha).toISOString().split('T')[0] : '');
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Consumo Diario"
          value={`${consumoDiario.toLocaleString('es-ES')} L`}
          subtitle="Hoy"
          icon={Fuel}
          variant="accent"
          onClick={() => {
            setModalType('consumoDiario');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Consumo Semanal"
          value={`${consumoSemanal.toLocaleString('es-ES')} L`}
          subtitle="Últimos 7 días"
          icon={Gauge}
          variant="accent"
          onClick={() => {
            setModalType('consumoSemanal');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Consumo Mensual"
          value={`${consumoMensual.toLocaleString('es-ES')} L`}
          subtitle={new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          icon={TrendingUp}
          variant="default"
          onClick={() => {
            setModalType('consumoMensual');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Mes Anterior"
          value={`${consumoMesAnterior.toLocaleString('es-ES')} L`}
          subtitle={lastMonth.toLocaleDateString('es-ES', { month: 'long' })}
          icon={TrendingDown}
          variant="default"
          onClick={() => {
            setModalType('consumoMesAnterior');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Stock Total"
          value={`${stockTotal.toLocaleString('es-ES')} L`}
          subtitle="Disponible"
          icon={Database}
          variant="success"
          onClick={() => {
            setModalType('stock');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Flota"
          value={vehiculosData.length}
          subtitle={`${vehiculosActivos} operativos, ${vehiculosMantencion} mantención`}
          icon={Truck}
          variant="default"
          onClick={() => {
            setModalType('flota');
            setModalOpen(true);
          }}
        />
        <KPICard
          title="Alertas"
          value={alertasActivas}
          subtitle="Pendientes"
          icon={Bell}
          variant={alertasActivas > 2 ? "warning" : "default"}
        />
      </div>

      {/* Charts and Tanks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsumoChart consumos={consumosData} />
        </div>
        <TopVehiculos />
      </div>

      {/* Top Cargas y Estanques Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopCargas consumos={consumosData} />
        <div className="lg:col-span-2">
          <div className="card-fuel p-6 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Estado de Estanques</h3>
              <span className="text-sm text-muted-foreground">
                {estanquesReales.length} estanques
              </span>
            </div>
            {estanquesReales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay estanques registrados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {estanquesReales.slice(0, 4).map((estanque) => (
                  <TankStatus key={estanque.id} estanque={estanque} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="card-fuel p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Alertas Recientes</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              {mappedAlerts.length} activas
            </span>
          </div>
          <AlertsList
            alertas={mappedAlerts}
            limit={6}
            onDismiss={handleDismiss}
          />
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

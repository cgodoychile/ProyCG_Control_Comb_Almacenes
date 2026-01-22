import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConsumoChartProps {
  consumos: any[];
}

export function ConsumoChart({ consumos }: ConsumoChartProps) {
  // Generar los últimos 7 días
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = last7Days.map(day => {
    const totalLitros = consumos
      .filter(c => {
        const itemDate = new Date(c.fecha);
        return isSameDay(itemDate, day);
      })
      .reduce((sum, c) => sum + (c.litrosUsados || 0), 0);

    return {
      fecha: format(day, 'eee dd', { locale: es }),
      litros: totalLitros,
    };
  });

  return (
    <div className="card-fuel p-6 rounded-xl border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Consumo Semanal</h3>
          <p className="text-sm text-muted-foreground">Últimos 7 días</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Litros</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorLitros" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(35 95% 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(35 95% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220 15% 22%)"
              vertical={false}
            />
            <XAxis
              dataKey="fecha"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 15% 55%)', fontSize: 12 }}
              tickFormatter={(value) => `${value}L`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220 18% 13%)',
                border: '1px solid hsl(220 15% 22%)',
                borderRadius: '8px',
                boxShadow: '0 4px 24px -4px hsla(0 0% 0% / 0.4)',
              }}
              labelStyle={{ color: 'hsl(210 20% 95%)' }}
              itemStyle={{ color: 'hsl(35 95% 55%)' }}
              formatter={(value: number) => [`${value} L`, 'Consumo']}
            />
            <Area
              type="monotone"
              dataKey="litros"
              stroke="hsl(35 95% 55%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLitros)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { Truck } from 'lucide-react';

const topVehiculos = [
  { patente: 'LXYW66', consumo: 312, conductor: 'L. Nancucheo' },
  { patente: 'TVVZ99', consumo: 289, conductor: 'I. Gutierrez' },
  { patente: 'SHKS52', consumo: 276, conductor: 'R. Quiroz' },
  { patente: 'TVVZ87', consumo: 258, conductor: 'J. Contreras' },
  { patente: 'TYPB57', consumo: 245, conductor: 'J. Contreras' },
];

const maxConsumo = Math.max(...topVehiculos.map(v => v.consumo));

export function TopVehiculos() {
  return (
    <div className="card-fuel p-6 rounded-xl border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Top Consumidores</h3>
          <p className="text-sm text-muted-foreground">Esta semana</p>
        </div>
        <Truck className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {topVehiculos.map((vehiculo, index) => (
          <div key={vehiculo.patente} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground w-5">
                  #{index + 1}
                </span>
                <div>
                  <span className="font-mono font-medium text-foreground">
                    {vehiculo.patente}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {vehiculo.conductor}
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm text-accent font-medium">
                {vehiculo.consumo} L
              </span>
            </div>
            <div className="tank-level ml-8">
              <div 
                className="tank-level-fill bg-accent"
                style={{ width: `${(vehiculo.consumo / maxConsumo) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

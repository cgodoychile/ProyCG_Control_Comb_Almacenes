import { ConsumoRegistro, Estanque, CargaEstanque, Activo, Alerta, KPIData } from '@/types/crm';

export const consumoData: ConsumoRegistro[] = [
  { id: '1', fecha: '2025-01-09', empresa: 'DIEGO COFRÉ', vehiculo: 'SHJS31', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 59, kilometraje: 44903, contadorInicial: 669569, contadorFinal: 669628, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 761.1 },
  { id: '2', fecha: '2025-01-09', empresa: 'IGNACIO GUTIERREZ', vehiculo: 'TVVZ99', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 63, kilometraje: 8280, contadorInicial: 669628, contadorFinal: 669691, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 131.4 },
  { id: '3', fecha: '2025-01-09', empresa: 'DAVID QUITRAL', vehiculo: 'TVWD55', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 40, kilometraje: 27609, contadorInicial: 669691, contadorFinal: 669731, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 690.2 },
  { id: '4', fecha: '2025-01-09', empresa: 'PABLO OLIVA', vehiculo: 'TZYF19', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 54, kilometraje: 9224, contadorInicial: 669731, contadorFinal: 669785, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 170.8 },
  { id: '5', fecha: '2025-01-09', empresa: 'JOSE CONTRERAS', vehiculo: 'TVVZ87', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 62, kilometraje: 38499, contadorInicial: 669785, contadorFinal: 669847, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 621.0 },
  { id: '6', fecha: '2025-01-10', empresa: 'FELIPE MUÑOZ', vehiculo: 'LWYZ44', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 58, kilometraje: 14053, contadorInicial: 669847, contadorFinal: 669905, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 242.3 },
  { id: '7', fecha: '2025-01-10', empresa: 'DANISA VALDIVIA', vehiculo: 'TVWB16', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 49, kilometraje: 31724, contadorInicial: 669905, contadorFinal: 669954, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 647.4 },
  { id: '8', fecha: '2025-01-10', empresa: 'L. NANCUCHEO', vehiculo: 'LXYW66', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 68, kilometraje: 23346, contadorInicial: 669954, contadorFinal: 670022, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 343.3 },
  { id: '9', fecha: '2025-01-10', empresa: 'CHRISTIAN GALVEZ', vehiculo: 'JHKJ52', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 48, kilometraje: 19636, contadorInicial: 670022, contadorFinal: 670070, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 409.1 },
  { id: '10', fecha: '2025-01-10', empresa: 'LUIS REYES', vehiculo: 'TVWC61', estanque: 'OF ENEL PEHUENCHE', litrosUsados: 53, kilometraje: 26208, contadorInicial: 670070, contadorFinal: 670123, responsable: 'ENEL', observaciones: 'terreno', rendimiento: 494.5 },
];

export const estanquesData: Estanque[] = [
  { id: '1', nombre: 'OF ENEL PEHUENCHE', ubicacion: 'Planta Pehuenche', capacidadTotal: 10000, stockActual: 6850, estado: 'operativo' },
  { id: '2', nombre: 'Estanque Central', ubicacion: 'Bodega Central', capacidadTotal: 15000, stockActual: 3200, estado: 'bajo' },
  { id: '3', nombre: 'Estanque Norte', ubicacion: 'Faena Norte', capacidadTotal: 8000, stockActual: 1200, estado: 'critico' },
  { id: '4', nombre: 'Reserva Emergencia', ubicacion: 'Base Principal', capacidadTotal: 5000, stockActual: 4500, estado: 'operativo' },
];

export const cargasData: CargaEstanque[] = [
  { id: '1', fecha: '2025-01-08', numeroGuia: 'GF-2025-001', estanque: 'OF ENEL PEHUENCHE', proveedor: 'COPEC', litros: 5000, responsable: 'Juan Pérez', observaciones: 'Entrega programada' },
  { id: '2', fecha: '2025-01-05', numeroGuia: 'GF-2025-002', estanque: 'Estanque Central', proveedor: 'SHELL', litros: 8000, responsable: 'María González', observaciones: 'Carga completa' },
];

export const activosData: Activo[] = [
  { id: 'SHJS31', nombre: 'Camioneta Toyota Hilux', categoria: 'Vehículo', ubicacion: 'Planta Pehuenche', estado: 'operativo', fechaAdquisicion: '2022-03-15', valorInicial: 35000000, responsable: 'Diego Cofré' },
  { id: 'TVVZ99', nombre: 'Camioneta Nissan NP300', categoria: 'Vehículo', ubicacion: 'Planta Pehuenche', estado: 'operativo', fechaAdquisicion: '2023-01-20', valorInicial: 28000000, responsable: 'Ignacio Gutierrez' },
  { id: 'TVWD55', nombre: 'Camioneta Ford Ranger', categoria: 'Vehículo', ubicacion: 'Faena Norte', estado: 'mantencion', fechaAdquisicion: '2021-08-10', valorInicial: 32000000, responsable: 'David Quitral' },
  { id: 'LWYZ44', nombre: 'Camioneta Chevrolet S10', categoria: 'Vehículo', ubicacion: 'Bodega Central', estado: 'operativo', fechaAdquisicion: '2023-06-05', valorInicial: 30000000, responsable: 'Felipe Muñoz' },
];

export const alertasData: Alerta[] = [
  { id: '1', tipo: 'critical', mensaje: 'Estanque Norte con stock crítico (1,200 L)', modulo: 'Estanques', fecha: '2025-01-12 08:30', leida: false },
  { id: '2', tipo: 'warning', mensaje: 'Estanque Central bajo stock (3,200 L)', modulo: 'Estanques', fecha: '2025-01-12 07:15', leida: false },
  { id: '3', tipo: 'warning', mensaje: 'Consumo elevado: TVVZ99 - 68L en última carga', modulo: 'Consumo', fecha: '2025-01-11 16:45', leida: true },
  { id: '4', tipo: 'success', mensaje: 'Recarga completada: OF ENEL PEHUENCHE +5,000L', modulo: 'Cargas', fecha: '2025-01-10 14:20', leida: true },
];

export const kpiData: KPIData = {
  consumoDiario: 554,
  consumoMensual: 18420,
  stockTotal: 15750,
  vehiculosActivos: 12,
  alertasActivas: 3,
  rendimientoPromedio: 8.5,
};

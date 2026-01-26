export interface Persona {
  id: string; // RUT, DNI o ID único
  nombreCompleto: string;
  rol: string;
  empresa: string;
  email?: string;
  telefono?: string;
  estado: 'activo' | 'inactivo';
  fechaRegistro: string;
  observaciones?: string;
}

export interface ConsumoRegistro {
  id: string;
  fecha: string;
  empresa: string;
  vehiculo: string; // Patente
  estanque: string; // ID Estanque
  litrosUsados: number;
  kilometraje: number;
  contadorInicial: number;
  contadorFinal: number;
  responsable: string; // ID Persona
  observaciones: string;
  rendimiento?: number;
  justificacion?: string; // Requerido si litrosUsados > 80
  mantenerLitrosEnEstanque?: boolean; // Para cuando se elimina el registro
}

export interface Estanque {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidadTotal: number;
  stockActual: number;
  estado: 'operativo' | 'bajo' | 'critico' | 'fuera_servicio';
  alertaMinima?: number;
  tipoCombustible?: string;
  responsable?: string;
  proximaCargaAgendada?: string; // Fecha de carga agendada
  historialCargas: CargaEstanque[];
  alertasStock?: boolean; // alertar si < 2000l
}

export interface CargaEstanque {
  id: string;
  fecha: string;
  tipo: 'real' | 'programada';
  fechaProgramada?: string;
  numeroGuia?: string;
  numeroFactura?: string; // Solicitado para completar agendamiento
  estanque: string;
  proveedor: string;
  litros: number;
  responsable: string;
  observaciones: string;
  patenteCamion?: string;
  tipoCombustible?: string;
  conductor?: string;
  completada: boolean; // Para vincular agendamiento con carga real
}

export interface Activo {
  id: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  estado: 'operativo' | 'mantencion' | 'fuera_servicio';
  fechaAdquisicion: string;
  valorInicial: number;
  valorActual: number; // Para depreciación
  tasaDepreciacion: number; // Porcentaje anual
  responsable: string;
  esProductoAlmacen?: boolean;
}

export interface Vehiculo {
  id: string; // Patente
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  estado: 'operativo' | 'mantencion' | 'fuera_servicio';
  kilometraje: number;
  ultimaMantencion: string;
  proximaMantencion: string;
  proximaMantencionKm: number;
  responsable: string;
  ubicacion: string;
  otrosMantenimientos?: string;
}

export interface Mantencion {
  id: string;
  fechaIngreso: string;
  estado: 'Agendada' | 'En Proceso' | 'Completada' | 'Cancelada';
  vehiculo: string; // Patente
  tipoMantencion: string;
  kmActual: number;
  proximaMantencionKm: number;
  proximaMantencionFecha?: string;
  taller: string;
  costo: number;
  responsable: string;
  observaciones?: string;
}

export interface Almacen {
  id: string;
  nombre: string;
  ubicacion: string;
  responsable: string;
  fechaCreacion?: string;
  estado: 'activo' | 'inactivo';
  totalProductos?: number;
  alertasStock?: number;
}

export interface ProductoAlmacen {
  id: string;
  nombre: string;
  sku: string;
  cantidad: number;
  unidad: string;
  esActivo: boolean;
  almacenId: string;
  categoria: string;
  stockMinimo: number;
  valorUnitario: number;
  fechaIngreso: string;
  proveedorPrincipal: string; // or proveedor
  estado: string;
  esRetornable: boolean;
  cantidadEnUso: number;
}

export interface MovimientoAlmacen {
  id: string;
  fecha: string;
  tipo: 'Entrada' | 'Salida' | 'Traslado' | 'Retorno' | 'Baja';
  almacenId: string;
  almacenOrigen?: string;
  almacenDestino?: string;
  productoId: string;
  cantidad: number;
  responsable: string;
  referencia?: string;      // Guía o Factura
  guiaReferencia?: string;   // For consistency with backend
  proveedor?: string;        // Solo para entradas
  proveedorTransporte?: string;
  destino?: string;          // Solo para salidas
  motivo?: string;           // Motivo/Observaciones
  observaciones?: string;
}

export interface Alerta {
  id: string;
  tipo: 'success' | 'warning' | 'critical';
  mensaje: string;
  modulo: string;
  fecha: string;
  leida: boolean;
  accionRealizada?: string; // editar, borrar, ingresar
  accion?: string; // Para flujo de aprobación (ES)
  action?: string; // Para flujo de aprobación (EN)
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'Admin' | 'Supervisor' | 'Operador' | 'Consultor';
  estado: 'activo' | 'inactivo';
}

export interface AuditoriaLog {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  accionRealizada: string; // Internal action label
  accion?: string;         // Support for 'accion' property in frontend calls
  mensaje: string;
  tipo: 'success' | 'warning' | 'critical' | 'info';
  justificacion?: string;
}

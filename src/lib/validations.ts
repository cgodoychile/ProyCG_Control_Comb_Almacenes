import { z } from 'zod';

// Consumo Validation Schema
export const consumoSchema = z.object({
    fecha: z.string().min(1, 'La fecha es requerida'),
    empresa: z.string().min(1, 'El conductor es requerido'),
    vehiculo: z.string().min(1, 'El vehículo es requerido'),
    estanque: z.string().min(1, 'El estanque es requerido'),
    litrosUsados: z.number()
        .min(0.1, 'Los litros deben ser mayor a 0')
        .max(200, 'Los litros no pueden exceder 200L'),
    kilometraje: z.number().min(0, 'El kilometraje debe ser positivo'),
    contadorInicial: z.number().min(0, 'El contador inicial debe ser positivo'),
    contadorFinal: z.number().min(0, 'El contador final debe ser positivo'),
    responsable: z.string().min(1, 'El responsable es requerido'),
    justificacion: z.string().optional(),
    observaciones: z.string().optional(), // Mantener por compatibilidad si es necesario
}).refine((data) => data.contadorFinal >= data.contadorInicial, {
    message: 'El contador final debe ser mayor o igual al inicial',
    path: ['contadorFinal'],
}).refine((data) => {
    // Si litros > 80, una de las dos debe ser obligatoria y tener >= 10 caracteres
    if (data.litrosUsados > 80) {
        const value = data.justificacion || data.observaciones;
        return value && value.length >= 10;
    }
    return true;
}, {
    message: 'Debe justificar consumos mayores a 80L (mínimo 10 caracteres)',
    path: ['justificacion'],
});

export type ConsumoFormData = z.infer<typeof consumoSchema>;

// Estanque Validation Schema
export const estanqueSchema = z.object({
    id: z.any().optional(),
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    ubicacion: z.string().min(3, 'La ubicación es requerida'),
    capacidadTotal: z.number()
        .min(100, 'La capacidad debe ser al menos 100L')
        .max(50000, 'La capacidad no puede exceder 50,000L'),
    stockActual: z.number().min(0, 'El stock debe ser positivo'),
    estado: z.enum(['operativo', 'bajo', 'critico', 'fuera_servicio']),
    alertaMinima: z.number().min(0, 'La alerta mínima debe ser positiva').optional(),
    tipoCombustible: z.string().min(1, 'El tipo de combustible es requerido').optional().default('Diesel'),
    responsable: z.string().min(1, 'El responsable es requerido').optional().default('Admin'),
}).refine((data) => data.stockActual <= data.capacidadTotal, (data) => ({
    message: `El stock no puede exceder la capacidad total (Actual: ${data.stockActual}L, Capacidad: ${data.capacidadTotal}L)`,
    path: ['stockActual'],
}));

export type EstanqueFormData = z.infer<typeof estanqueSchema>;

// Carga Validation Schema
export const cargaSchema = z.object({
    fecha: z.string().min(1, 'La fecha es requerida'),
    tipo: z.enum(['real', 'programada']).default('real'),
    fechaProgramada: z.string().optional(),
    numeroGuia: z.string().optional(),
    estanque: z.string().min(1, 'El estanque es requerido'),
    proveedor: z.string().min(1, 'El proveedor es requerido'),
    litros: z.number()
        .min(1, 'Los litros deben ser mayor a 0')
        .max(50000, 'Los litros no pueden exceder 50,000L'),
    responsable: z.string().min(1, 'El responsable es requerido'),
    observaciones: z.string().optional(),
    patenteCamion: z.string().optional(),
    tipoCombustible: z.string().optional(),
    conductor: z.string().optional(),
}).refine((data) => {
    if (data.tipo === 'real' && !data.numeroGuia) {
        return false;
    }
    return true;
}, {
    message: 'El número de guía es requerido para cargas reales',
    path: ['numeroGuia'],
}).refine((data) => {
    if (data.tipo === 'programada' && !data.fechaProgramada) {
        return false;
    }
    return true;
}, {
    message: 'La fecha programada es requerida',
    path: ['fechaProgramada'],
});

export type CargaFormData = z.infer<typeof cargaSchema>;

// Activo Validation Schema
export const activoSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    categoria: z.string().min(1, 'La categoría es requerida'),
    marca: z.string().min(1, 'La marca es requerida'),
    modelo: z.string().min(1, 'El modelo es requerido'),
    numeroSerie: z.string().min(1, 'N/S es requerido'),
    ubicacion: z.string().min(1, 'La ubicación es requerida'),
    estado: z.enum(['operativo', 'mantencion', 'fuera_servicio']),
    fechaAdquisicion: z.string().min(1, 'La fecha de adquisición es requerida'),
    valorInicial: z.number().min(0, 'El valor debe ser positivo'),
    responsable: z.string().min(1, 'El responsable es requerido'),
});

export type ActivoFormData = z.infer<typeof activoSchema>;

// Vehiculo Validation Schema
export const vehiculoSchema = z.object({
    id: z.string().min(1, 'Patente es requerida'),
    marca: z.string().min(1, 'Marca es requerida'),
    modelo: z.string().min(1, 'Modelo es requerido'),
    anio: z.string().min(4, 'Año es requerido'),
    tipo: z.enum(['Camioneta', 'Camión', 'Automóvil', 'Otro']),
    estado: z.enum(['operativo', 'mantencion', 'fuera_servicio']),
    kilometraje: z.number().min(0, 'Kilometraje debe ser mayor o igual a 0'),
    ultimaMantencion: z.string().optional(),
    proximaMantencion: z.string().optional(),
    proximaMantencionKm: z.number().min(0, 'Kilometraje debe ser mayor o igual a 0').optional(),
    otrosMantenimientos: z.string().optional(),
    responsable: z.string().min(1, 'Responsable es requerido'),
    ubicacion: z.string().min(1, 'Ubicación es requerida'),
});

export type VehiculoFormData = z.infer<typeof vehiculoSchema>;

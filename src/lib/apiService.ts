import { apiFetch } from './api';
import type {
    Persona,
    Vehiculo,
    Estanque,
    ConsumoRegistro,
    CargaEstanque,
    Activo,
    Mantencion,
    Almacen,
    MovimientoAlmacen,
    Alerta,
    Usuario,
    AuditoriaLog
} from '@/types/crm';

// Re-export types for convenience
export type { Estanque, ConsumoRegistro as Consumo, CargaEstanque as Carga, Activo, Vehiculo, Mantencion };

// Helper to create standard CRUD API
const createCrudApi = <T>(entity: string) => ({
    getAll: () => apiFetch<T[]>(entity, 'getAll'),
    getById: (id: string) => apiFetch<T>(entity, 'getById', { id }),
    create: (data: Partial<T>) => apiFetch<T>(entity, 'create', { method: 'POST', body: data }),
    update: (id: string, data: Partial<T>) => apiFetch<T>(entity, 'update', { id, method: 'POST', body: data }),
    delete: (id: string, body: any = {}) => apiFetch<{ message: string }>(entity, 'delete', { id, method: 'POST', body }),
});

// Cargas API
export const cargasApi = {
    ...createCrudApi<CargaEstanque>('cargas'),
    getAll: () => apiFetch<CargaEstanque[]>('cargas', 'getAll'),
};

// Agendamientos API
export const agendamientosApi = {
    ...createCrudApi<CargaEstanque>('agendamientos'),
};

// Productos Almacen API
export const productosAlmacenApi = {
    getAll: () => apiFetch<any[]>('productos', 'getAll'),
    getAllByAlmacen: (almacenId: string) =>
        apiFetch<any[]>('productos', 'getAll', { params: { almacenId, _t: Date.now().toString() } }),
    getById: (id: string) => apiFetch<any>('productos', 'getById', { id }),
    create: (data: any) => {
        console.error('🚀 API SERVICE - Creating Product:', data);
        return apiFetch<any>('productos', 'create', { method: 'POST', body: data });
    },
    update: (id: string, data: any) => {
        console.error('🚀 API SERVICE - Updating Product:', { id, data });
        // Enviamos el ID tanto en la URL como en el cuerpo para máxima compatibilidad
        return apiFetch<any>('productos', 'update', { method: 'POST', id, body: { ...data, id } });
    },
    delete: (id: string) =>
        apiFetch<void>('productos', 'delete', { method: 'POST', id, body: {} }),
};

// Movimientos Almacen API
export const movimientosAlmacenApi = {
    ...createCrudApi<MovimientoAlmacen>('movimientos'),
    getByAlmacen: (almacenId: string) =>
        apiFetch<MovimientoAlmacen[]>('movimientos', 'getAll', { params: { almacenId } }),
};

export const personasApi = createCrudApi<Persona>('personas');
export const vehiculosApi = createCrudApi<Vehiculo>('vehiculos');
export const estanquesApi = createCrudApi<Estanque>('estanques');
export const consumosApi = createCrudApi<ConsumoRegistro>('consumos');
export const activosApi = createCrudApi<Activo>('activos');
export const mantencionesApi = createCrudApi<Mantencion>('mantenciones');
export const almacenesApi = createCrudApi<Almacen>('almacenes');
export const alertasApi = createCrudApi<Alerta>('alertas');
export const auditoriaApi = createCrudApi<AuditoriaLog>('auditoria');
export const usuariosApi = createCrudApi<Usuario>('usuarios');

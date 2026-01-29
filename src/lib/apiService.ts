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
    post: (action: string, body: any = {}) => apiFetch<any>(entity, action, { method: 'POST', body }),
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
    getAll: () => apiFetch<any[]>('productos_almacen', 'getAll'),
    getAllByAlmacen: (almacenId: string) =>
        apiFetch<any[]>('productos_almacen', 'getAll', { params: { almacenId, _t: Date.now().toString() } }),
    getById: (id: string) => apiFetch<any>('productos_almacen', 'getById', { id }),
    create: (data: any) => {
        return apiFetch<any>('productos_almacen', 'create', { method: 'POST', body: data });
    },
    update: (id: string, data: any) => {
        return apiFetch<any>('productos_almacen', 'update', { method: 'POST', id, body: { ...data, id } });
    },
    delete: (id: string, body: any = {}) =>
        apiFetch<void>('productos_almacen', 'delete', { method: 'POST', id, body }),
};

// Movimientos Almacen API
export const movimientosAlmacenApi = {
    ...createCrudApi<MovimientoAlmacen>('movimientos_almacen'),
    getByAlmacen: (almacenId: string) =>
        apiFetch<MovimientoAlmacen[]>('movimientos_almacen', 'getAll', { params: { almacenId } }),
};

export const personasApi = createCrudApi<Persona>('personas');
export const vehiculosApi = createCrudApi<Vehiculo>('vehiculos');
export const estanquesApi = createCrudApi<Estanque>('estanques');
export const consumosApi = createCrudApi<ConsumoRegistro>('consumos');
export const activosApi = {
    ...createCrudApi<Activo>('activos'),
    generateCargo: (activoId: string, data: any) =>
        apiFetch<any>('actas', 'generate_cargo', { method: 'POST', body: { ...data, activoId } }),
};
export const mantencionesApi = createCrudApi<Mantencion>('mantenciones');
export const almacenesApi = createCrudApi<Almacen>('almacenes');
export const alertasApi = createCrudApi<Alerta>('alertas');
export const auditoriaApi = createCrudApi<AuditoriaLog>('auditoria');
export const usuariosApi = createCrudApi<Usuario>('usuarios');
export const actasApi = {
    getAll: () => apiFetch<any[]>('actas', 'get_all'),
    generateCargo: (data: any) => apiFetch<any>('actas', 'generate_cargo', { method: 'POST', body: data }),
};

// Dashboard API
export const dashboardApi = {
    getStats: () => apiFetch<any>('dashboard', 'getStats'),
};

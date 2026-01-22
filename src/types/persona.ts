export interface Persona {
    id: string; // RUT, DNI o ID único
    nombreCompleto: string; // Reemplaza Nombre y Apellido por un solo campo profesional
    rol: string; // Operador, Chofer, Supervisor, etc.
    empresa: string;
    email?: string;
    telefono?: string;
    estado: 'activo' | 'inactivo';
    fechaRegistro: string;
    observaciones?: string;
}

export type PersonaFormData = Omit<Persona, 'fechaRegistro'>;

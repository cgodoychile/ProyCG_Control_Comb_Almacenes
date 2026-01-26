/**
 * CRUD OPERATIONS: PERSONAS
 */

function handlePersonasGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllPersonas();
    case 'getbyid': return getPersonaById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handlePersonasPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createPersona(data);
    case 'update': return updatePersona(id, data);
    case 'delete': return deletePersona(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllPersonas() {
  try {
    const sheet = getSheet(SHEET_NAMES.PERSONAS);
    const data = sheet.getDataRange().getValues();
    
    // DYNAMIC COLUMN MAPPING
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'RUT', 'DNI'],
        NOMBRE: ['NOMBRE', 'NOMBRE_COMPLETO', 'NOMBRE COMPLETO'],
        ROL: ['ROL', 'CARGO'],
        EMPRESA: ['EMPRESA', 'DEPARTAMENTO'],
        EMAIL: ['EMAIL', 'CORREO'],
        TELEFONO: ['TELEFONO', 'CELULAR'],
        ESTADO: ['ESTADO'],
        FECHA: ['FECHA_REGISTRO', 'FECHA INGRESO'],
        OBSERVACIONES: ['OBSERVACIONES']
    });

    if (data.length <= 1) return createResponse(true, []);
    
    const personas = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PERSONAS.ID;
        if (!row[idIdx]) continue;
        
        const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.PERSONAS.NOMBRE_COMPLETO;
        const rlIdx = colMap.ROL !== -1 ? colMap.ROL : COLUMNS.PERSONAS.ROL;
        const empIdx = colMap.EMPRESA !== -1 ? colMap.EMPRESA : COLUMNS.PERSONAS.EMPRESA;
        const emIdx = colMap.EMAIL !== -1 ? colMap.EMAIL : COLUMNS.PERSONAS.EMAIL;
        const telIdx = colMap.TELEFONO !== -1 ? colMap.TELEFONO : COLUMNS.PERSONAS.TELEFONO;
        const estIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.PERSONAS.ESTADO;
        const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.PERSONAS.FECHA_REGISTRO;
        const obsIdx = colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : COLUMNS.PERSONAS.OBSERVACIONES;
    
        personas.push({
            id: row[idIdx],
            nombreCompleto: row[nmIdx] || '',
            rol: row[rlIdx] || '',
            empresa: row[empIdx] || '',
            email: row[emIdx] || '',
            telefono: row[telIdx] || '',
            estado: row[estIdx] || 'activo',
            fechaRegistro: row[fcIdx] || '',
            observaciones: row[obsIdx] || ''
        });
    }
    return createResponse(true, personas);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function getPersonaById(id) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.PERSONAS);
    const data = sheet.getDataRange().getValues();
    
    // DYNAMIC MAP
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'RUT', 'DNI'],
        NOMBRE: ['NOMBRE', 'NOMBRE_COMPLETO', 'NOMBRE COMPLETO'],
        ROL: ['ROL', 'CARGO'],
        EMPRESA: ['EMPRESA', 'DEPARTAMENTO'],
        EMAIL: ['EMAIL', 'CORREO'],
        TELEFONO: ['TELEFONO', 'CELULAR'],
        ESTADO: ['ESTADO'],
        FECHA: ['FECHA_REGISTRO', 'FECHA INGRESO'],
        OBSERVACIONES: ['OBSERVACIONES']
    });

    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PERSONAS.ID;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[idIdx] === id) {
            
            const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.PERSONAS.NOMBRE_COMPLETO;
            const rlIdx = colMap.ROL !== -1 ? colMap.ROL : COLUMNS.PERSONAS.ROL;
            const empIdx = colMap.EMPRESA !== -1 ? colMap.EMPRESA : COLUMNS.PERSONAS.EMPRESA;
            const emIdx = colMap.EMAIL !== -1 ? colMap.EMAIL : COLUMNS.PERSONAS.EMAIL;
            const telIdx = colMap.TELEFONO !== -1 ? colMap.TELEFONO : COLUMNS.PERSONAS.TELEFONO;
            const estIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.PERSONAS.ESTADO;
            const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.PERSONAS.FECHA_REGISTRO;
            const obsIdx = colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : COLUMNS.PERSONAS.OBSERVACIONES;

            return createResponse(true, {
                id: row[idIdx],
                nombreCompleto: row[nmIdx] || '',
                rol: row[rlIdx] || '',
                empresa: row[empIdx] || '',
                email: row[emIdx] || '',
                telefono: String(row[telIdx] || ''),
                estado: row[estIdx] || 'activo',
                fechaRegistro: row[fcIdx] || '',
                observaciones: row[obsIdx] || ''
            });
        }
    }
    throw new Error('Persona no encontrada');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createPersona(data) {
  try {
    if (!data.id) throw new Error('ID (RUT) es requerido');
    if (!data.nombreCompleto) throw new Error('Nombre completo es requerido');
    
    const sheet = getSheet(SHEET_NAMES.PERSONAS);
    // DYNAMIC MAP
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'RUT', 'DNI'],
        NOMBRE: ['NOMBRE', 'NOMBRE_COMPLETO', 'NOMBRE COMPLETO'],
        ROL: ['ROL', 'CARGO'],
        EMPRESA: ['EMPRESA', 'DEPARTAMENTO'],
        EMAIL: ['EMAIL', 'CORREO'],
        TELEFONO: ['TELEFONO', 'CELULAR'],
        ESTADO: ['ESTADO'],
        FECHA: ['FECHA_REGISTRO', 'FECHA INGRESO'],
        OBSERVACIONES: ['OBSERVACIONES']
    });

    const dataRows = sheet.getDataRange().getValues();
    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PERSONAS.ID;

    // Idempotency check: if it already exists, return success to clear sync queue
    for (let i = 1; i < dataRows.length; i++) {
      if (String(dataRows[i][idIdx]).trim() === String(data.id).trim()) {
        console.warn("Person already exists, returning success for idempotency: " + data.id);
        return createResponse(true, { id: data.id, ...data, _isDuplicate: true }, "Esta persona ya está registrada");
      }
    }
    
    // Determined max index to size the row correctly
    const indices = Object.values(colMap).filter(v => v !== -1);
    const maxIdx = Math.max(...indices, 10); // Assume at least 10 columns
    const newRow = new Array(maxIdx + 1).fill('');
    
    // Fill data into dynamic positions
    const set = (keyIdx, val) => {
        if (keyIdx !== -1) newRow[keyIdx] = val;
    };
    
    set(idIdx, data.id);
    set(colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.PERSONAS.NOMBRE_COMPLETO, data.nombreCompleto);
    set(colMap.ROL !== -1 ? colMap.ROL : COLUMNS.PERSONAS.ROL, data.rol || '');
    set(colMap.EMPRESA !== -1 ? colMap.EMPRESA : COLUMNS.PERSONAS.EMPRESA, data.empresa || '');
    set(colMap.EMAIL !== -1 ? colMap.EMAIL : COLUMNS.PERSONAS.EMAIL, data.email || '');
    set(colMap.TELEFONO !== -1 ? colMap.TELEFONO : COLUMNS.PERSONAS.TELEFONO, data.telefono || '');
    set(colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.PERSONAS.ESTADO, data.estado || 'activo');
    set(colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.PERSONAS.FECHA_REGISTRO, data.fechaRegistro || formatDate(new Date()));
    set(colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : COLUMNS.PERSONAS.OBSERVACIONES, data.observaciones || '');
    
    sheet.appendRow(newRow);
    
    registrarAccion('Personas', 'crear', `Nueva persona registrada: ${data.nombreCompleto} (RUT: ${data.id})`, 'success', null);
    
    return createResponse(true, { id: data.id, ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updatePersona(id, data) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.PERSONAS);
    const sheetData = sheet.getDataRange().getValues();
    
    // DYNAMIC MAP
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'RUT', 'DNI'],
        NOMBRE: ['NOMBRE', 'NOMBRE_COMPLETO', 'NOMBRE COMPLETO'],
        ROL: ['ROL', 'CARGO'],
        EMPRESA: ['EMPRESA', 'DEPARTAMENTO'],
        EMAIL: ['EMAIL', 'CORREO'],
        TELEFONO: ['TELEFONO', 'CELULAR'],
        ESTADO: ['ESTADO'],
        FECHA: ['FECHA_REGISTRO', 'FECHA INGRESO'],
        OBSERVACIONES: ['OBSERVACIONES']
    });

    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PERSONAS.ID;
    
    let rowIndex = -1;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][idIdx] === id) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Persona no encontrada');
    
    // Helper to safely write
    const write = (colIdx, val) => {
        if (colIdx !== -1 && val !== undefined) {
             sheet.getRange(rowIndex, colIdx + 1).setValue(val);
        }
    };

    if (data.id && data.id !== id) {
        write(idIdx, data.id);
        id = data.id; 
    }
    
    write(colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.PERSONAS.NOMBRE_COMPLETO, data.nombreCompleto);
    write(colMap.ROL !== -1 ? colMap.ROL : COLUMNS.PERSONAS.ROL, data.rol);
    write(colMap.EMPRESA !== -1 ? colMap.EMPRESA : COLUMNS.PERSONAS.EMPRESA, data.empresa);
    write(colMap.EMAIL !== -1 ? colMap.EMAIL : COLUMNS.PERSONAS.EMAIL, data.email);
    write(colMap.TELEFONO !== -1 ? colMap.TELEFONO : COLUMNS.PERSONAS.TELEFONO, data.telefono);
    write(colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.PERSONAS.ESTADO, data.estado);
    write(colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : COLUMNS.PERSONAS.OBSERVACIONES, data.observaciones);
    
    registrarAccion('Personas', 'actualizar', `Persona actualizada: ${id}`, 'info', null);
    
    return getPersonaById(id);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deletePersona(id, data) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.PERSONAS);
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'RUT', 'DNI']
    });
    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PERSONAS.ID;
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (String(sheetData[i][idIdx]) === String(id)) {
        sheet.deleteRow(i + 1);
        // Audit Log
        registrarAccion('Personas', 'eliminar', `Persona ${id} eliminada`, 'warning', null, data ? data.justificacion : null);
        return createResponse(true, { message: 'Persona eliminada' });
      }
    }
    throw new Error('Persona no encontrada');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

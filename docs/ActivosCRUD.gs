/**
 * CRUD OPERATIONS: ACTIVOS
 */

function handleActivosGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllActivos();
    case 'getbyid': return getActivoById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleActivosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createActivo(data);
    case 'update': return updateActivo(id, data);
    case 'delete': return deleteActivo(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllActivos() {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    const activos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[COLUMNS.ACTIVOS.ID]) continue;

        activos.push({
            id: row[COLUMNS.ACTIVOS.ID],
            nombre: row[COLUMNS.ACTIVOS.NOMBRE],
            categoria: row[COLUMNS.ACTIVOS.TIPO],
            ubicacion: row[COLUMNS.ACTIVOS.UBICACION],
            estado: row[COLUMNS.ACTIVOS.ESTADO],
            fechaAdquisicion: row[COLUMNS.ACTIVOS.FECHA_ADQUISICION],
            valorInicial: row[COLUMNS.ACTIVOS.VALOR],
            responsable: row[COLUMNS.ACTIVOS.RESPONSABLE]
        });
    }
    return createResponse(true, activos);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function getActivoById(id) {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][COLUMNS.ACTIVOS.ID] == id) {
             const row = data[i];
             return createResponse(true, {
                id: row[COLUMNS.ACTIVOS.ID],
                nombre: row[COLUMNS.ACTIVOS.NOMBRE],
                categoria: row[COLUMNS.ACTIVOS.TIPO],
                ubicacion: row[COLUMNS.ACTIVOS.UBICACION],
                estado: row[COLUMNS.ACTIVOS.ESTADO],
                fechaAdquisicion: row[COLUMNS.ACTIVOS.FECHA_ADQUISICION],
                valorInicial: row[COLUMNS.ACTIVOS.VALOR],
                responsable: row[COLUMNS.ACTIVOS.RESPONSABLE]
             });
        }
    }
    return createErrorResponse("Activo no encontrado", 404);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

/**
 * Generate unique asset code based on category
 */
function generateAssetCode(categoria) {
  const sheet = getSheet(SHEET_NAMES.ACTIVOS);
  const data = sheet.getDataRange().getValues();
  
  // Category to prefix mapping
  const prefixMap = {
    'Generadores': 'GEN',
    'Vehículos': 'VEH',
    'Herramientas': 'HER',
    'Equipos': 'EQP',
    'Mobiliario': 'MOB',
    'Informática': 'INF',
    'Maquinaria': 'MAQ',
    'Otro': 'OTR'
  };
  
  const prefix = prefixMap[categoria] || 'ACT';
  
  // Find max number for this prefix
  let maxNumber = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][COLUMNS.ACTIVOS.ID] || '');
    if (id.startsWith('ACT-' + prefix + '-')) {
      const parts = id.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2]);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  
  const newNumber = String(maxNumber + 1).padStart(3, '0');
  return 'ACT-' + prefix + '-' + newNumber;
}

function createActivo(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    
    // Generate automatic code if not provided
    if (!data.id && data.categoria) {
      data.id = generateAssetCode(data.categoria);
    } else if (!data.id) {
      data.id = 'ACT-' + new Date().getTime();
    }
    
    // Check duplicates
    const existing = getAllActivos().data.find(a => a.id === data.id);
    if (existing) throw new Error("ID ya existe");

    const newRow = Array(8).fill('');
    newRow[COLUMNS.ACTIVOS.ID] = data.id;
    newRow[COLUMNS.ACTIVOS.NOMBRE] = data.nombre;
    newRow[COLUMNS.ACTIVOS.TIPO] = data.categoria;
    newRow[COLUMNS.ACTIVOS.UBICACION] = data.ubicacion;
    newRow[COLUMNS.ACTIVOS.ESTADO] = data.estado || 'operativo';
    newRow[COLUMNS.ACTIVOS.FECHA_ADQUISICION] = data.fechaAdquisicion;
    newRow[COLUMNS.ACTIVOS.VALOR] = data.valorInicial;
    newRow[COLUMNS.ACTIVOS.RESPONSABLE] = data.responsable;
    
    sheet.appendRow(newRow);
    return createResponse(true, { ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateActivo(id, data) {
    try {
        const sheet = getSheet(SHEET_NAMES.ACTIVOS);
        const values = sheet.getDataRange().getValues();
        
        for (let i = 1; i < values.length; i++) {
            if (values[i][COLUMNS.ACTIVOS.ID] == id) {
                const row = i + 1;
                
                // Support ID change
                if (data.id && data.id != id) {
                    sheet.getRange(row, COLUMNS.ACTIVOS.ID + 1).setValue(data.id);
                    id = data.id;
                }

                // Update columns based on COLUMNS.ACTIVOS
                if (data.nombre !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.NOMBRE + 1).setValue(data.nombre);
                if (data.categoria !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.TIPO + 1).setValue(data.categoria);
                if (data.ubicacion !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.UBICACION + 1).setValue(data.ubicacion);
                if (data.estado !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.ESTADO + 1).setValue(data.estado);
                if (data.fechaAdquisicion !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.FECHA_ADQUISICION + 1).setValue(data.fechaAdquisicion);
                if (data.valorInicial !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.VALOR + 1).setValue(data.valorInicial);
                if (data.responsable !== undefined) sheet.getRange(row, COLUMNS.ACTIVOS.RESPONSABLE + 1).setValue(data.responsable);
                
                return createResponse(true, { id, ...data });
            }
        }
        throw new Error("Activo no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function deleteActivo(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.ACTIVOS);
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            const rowId = String(data[i][COLUMNS.ACTIVOS.ID]).trim();
            const targetId = String(id).trim();
            
            if (rowId === targetId) {
                sheet.deleteRow(i + 1);
                return createResponse(true, { message: "Activo eliminado" });
            }
        }
        throw new Error("Activo no encontrado (ID: " + id + ")");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

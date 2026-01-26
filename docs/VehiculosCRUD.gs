/**
 * CRUD OPERATIONS: VEHICULOS
 */

function handleVehiculosGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllVehiculos();
    case 'getbyid': return getVehiculoById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleVehiculosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createVehiculo(data);
    case 'update': return updateVehiculo(id, data);
    case 'delete': return deleteVehiculo(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllVehiculos() {
  try {
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const data = sheet.getDataRange().getValues();

    // Fetch latest KM from Consumos to SYNC
    const consumosSheet = getSheet(SHEET_NAMES.CONSUMOS);
    const consumosData = consumosSheet.getDataRange().getValues();
    const latestKmByPatent = {};
    for (let i = 1; i < consumosData.length; i++) {
        const patent = String(consumosData[i][COLUMNS.CONSUMOS.VEHICULO]).trim().toUpperCase();
        const km = Number(consumosData[i][COLUMNS.CONSUMOS.KILOMETRAJE]) || 0;
        if (patent) {
            // Last one wins (latest entry in sheet)
            latestKmByPatent[patent] = km; 
        }
    }
    
    // DYNAMIC COLUMN MAPPING
    const colMap = findColumnIndices(sheet, {
        PATENTE: ['PATENTE', 'ID', 'CODIGO'],
        MARCA: ['MARCA'],
        MODELO: ['MODELO'],
        ANIO: ['AÑO', 'ANIO'],
        TIPO: ['TIPO'],
        ESTADO: ['ESTADO'],
        KILOMETRAJE: ['KILOMETRAJE', 'KM', 'KM_ACTUAL'],
        ULTIMA_MANTENCION: ['ULTIMA', 'ULTIMA_MANTENCION', 'ULTIMA MANTENCION'],
        PROXIMA_MANTENCION: ['PROXIMA', 'PROXIMA_MANTENCION', 'PROXIMA MANTENCION'],
        RESPONSABLE: ['RESPONSABLE', 'ENCARGADO'],
        UBICACION: ['UBICACION']
    });

    if (data.length <= 1) return createResponse(true, []);
    
    const vehiculos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Use mapped columns or fallback to Config
        const patIdx = colMap.PATENTE !== -1 ? colMap.PATENTE : COLUMNS.VEHICULOS.PATENTE;
        
        const patentId = row[patIdx];
        if (!patentId) continue;

        // Dynamic indices for other fields
        const marcaIdx = colMap.MARCA !== -1 ? colMap.MARCA : COLUMNS.VEHICULOS.MARCA;
        const modIdx = colMap.MODELO !== -1 ? colMap.MODELO : COLUMNS.VEHICULOS.MODELO;
        const anioIdx = colMap.ANIO !== -1 ? colMap.ANIO : COLUMNS.VEHICULOS.ANIO;
        const tipoIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.VEHICULOS.TIPO;
        const estIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.VEHICULOS.ESTADO;
        const kmIdx = colMap.KILOMETRAJE !== -1 ? colMap.KILOMETRAJE : COLUMNS.VEHICULOS.KILOMETRAJE;
        const ultIdx = colMap.ULTIMA_MANTENCION !== -1 ? colMap.ULTIMA_MANTENCION : COLUMNS.VEHICULOS.ULTIMA_MANTENCION;
        const proxIdx = colMap.PROXIMA_MANTENCION !== -1 ? colMap.PROXIMA_MANTENCION : COLUMNS.VEHICULOS.PROXIMA_MANTENCION;
        const respIdx = colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.VEHICULOS.RESPONSABLE;
        const ubiIdx = colMap.UBICACION !== -1 ? colMap.UBICACION : COLUMNS.VEHICULOS.UBICACION;

        // Fetch latest KM logic (Simplified for dynamic context, assume priority is Sheet unless logic changes)
        // Original logic merged sheet KM with Consumos. Retaining sheet KM for now.
        const currentKm = latestKmByPatent[String(patentId).trim().toUpperCase()] || row[kmIdx] || 0;

        vehiculos.push({
            id: patentId,
            marca: row[marcaIdx] || '',
            modelo: row[modIdx] || '',
            anio: row[anioIdx] || '',
            tipo: row[tipoIdx] || '',
            estado: row[estIdx] || 'operativo',
            kilometraje: currentKm,
            ultimaMantencion: row[ultIdx] || '',
            proximaMantencion: row[proxIdx] || '',
            responsable: row[respIdx] || '',
            ubicacion: row[ubiIdx] || ''
        });
    }
    return createResponse(true, vehiculos);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function getVehiculoById(id) {
  try {
    if (!id) throw new Error('Patente es requerida');
    const response = getAllVehiculos();
    if (!response.success) return response;
    
    const vehiculos = response.data;
    const vehiculo = vehiculos.find(v => v.id === id);
    
    if (vehiculo) return createResponse(true, vehiculo);
    throw new Error('Vehículo no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createVehiculo(data) {
  try {
    if (!data.id) throw new Error('Patente es requerida');
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const existingData = sheet.getDataRange().getValues();
    
    const cleanId = String(data.id).trim().toUpperCase();

    // Idempotency check: if it already exists, return success to clear sync queue
    const moveData = sheet.getDataRange().getValues();
    for (let i = 1; i < moveData.length; i++) {
      if (String(moveData[i][COLUMNS.VEHICULOS.PATENTE]).trim().toUpperCase() === cleanId) {
        console.warn("Vehicle already exists, returning success for idempotency: " + cleanId);
        return createResponse(true, { id: cleanId, ...data, _isDuplicate: true }, "Este vehículo ya está registrado");
      }
    }
    
    const newRow = Array(11).fill('');
    newRow[COLUMNS.VEHICULOS.PATENTE] = cleanId;
    newRow[COLUMNS.VEHICULOS.MARCA] = data.marca || '';
    newRow[COLUMNS.VEHICULOS.MODELO] = data.modelo || '';
    newRow[COLUMNS.VEHICULOS.ANIO] = data.anio || '';
    newRow[COLUMNS.VEHICULOS.TIPO] = data.tipo || '';
    newRow[COLUMNS.VEHICULOS.ESTADO] = data.estado || 'operativo';
    newRow[COLUMNS.VEHICULOS.KILOMETRAJE] = data.kilometraje || 0;
    newRow[COLUMNS.VEHICULOS.ULTIMA_MANTENCION] = data.ultimaMantencion || '';
    newRow[COLUMNS.VEHICULOS.PROXIMA_MANTENCION] = data.proximaMantencion || '';
    newRow[COLUMNS.VEHICULOS.RESPONSABLE] = data.responsable || '';
    newRow[COLUMNS.VEHICULOS.UBICACION] = data.ubicacion || '';
    
    sheet.appendRow(newRow);
    
    // Audit Log
    registrarAccion('Vehículos', 'crear', `Nuevo vehículo registrado: ${cleanId} (${data.marca} ${data.modelo})`, 'success', data.responsable);
    
    return createResponse(true, { id: cleanId, ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateVehiculo(id, data) {
  try {
    if (!id) throw new Error('Patente es requerida');
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const sheetData = sheet.getDataRange().getValues();
    
    let rowIndex = -1;
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][COLUMNS.VEHICULOS.PATENTE] === id) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) throw new Error('Vehículo no encontrado');
    
    // Support ID change
    if (data.id && data.id !== id) {
        sheet.getRange(rowIndex, COLUMNS.VEHICULOS.PATENTE + 1).setValue(String(data.id).trim().toUpperCase());
        id = String(data.id).trim().toUpperCase(); // Update reference for the final return
    }

    if (data.marca !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.MARCA + 1).setValue(data.marca);
    if (data.modelo !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.MODELO + 1).setValue(data.modelo);
    if (data.anio !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.ANIO + 1).setValue(data.anio);
    if (data.tipo !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.TIPO + 1).setValue(data.tipo);
    if (data.estado !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.ESTADO + 1).setValue(data.estado);
    if (data.kilometraje !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.KILOMETRAJE + 1).setValue(data.kilometraje);
    if (data.ultimaMantencion !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.ULTIMA_MANTENCION + 1).setValue(data.ultimaMantencion);
    if (data.proximaMantencion !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.PROXIMA_MANTENCION + 1).setValue(data.proximaMantencion);
    if (data.responsable !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.RESPONSABLE + 1).setValue(data.responsable);
    if (data.ubicacion !== undefined) sheet.getRange(rowIndex, COLUMNS.VEHICULOS.UBICACION + 1).setValue(data.ubicacion);
    
    // Audit Log
    registrarAccion('Vehículos', 'actualizar', `Vehículo actualizado: ${id}`, 'info', data.responsable);
    
    return getVehiculoById(id);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteVehiculo(id, data) {
  try {
    if (!id) throw new Error('Patente es requerida');
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][COLUMNS.VEHICULOS.PATENTE] === id) {
        sheet.deleteRow(i + 1);
        
        // Audit Log
        registrarAccion('Vehículos', 'eliminar', `Vehículo eliminado: ${id}`, 'warning', null, data ? data.justificacion : null);
        
        return createResponse(true, { message: 'Vehículo eliminado' });
      }
    }
    throw new Error('Vehículo no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

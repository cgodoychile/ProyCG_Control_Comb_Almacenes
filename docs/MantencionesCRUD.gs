/**
 * CRUD OPERATIONS: MANTENCIONES
 */

function handleMantencionesGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllMantenciones();
    case 'getbyid': return getMantencionById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleMantencionesPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createMantencion(data);
    case 'update': return updateMantencion(id, data);
    case 'delete': return deleteMantencion(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function ensureMantencionesHeaders(sheet) {
  const HEADER_ROW = ['ID', 'FECHA_INGRESO', 'VEHICULO', 'TIPO_MANTENCION', 'KM_ACTUAL', 'PROXIMA_MANTENCION_KM', 'PROXIMA_MANTENCION_FECHA', 'TALLER', 'COSTO', 'OBSERVACION', 'ESTADO', 'RESPONSABLE'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  } else {
    // Check if headers match or need update
    const currentHeaders = sheet.getRange(1, 1, 1, HEADER_ROW.length).getValues()[0];
    if (currentHeaders[0] !== 'ID') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
    }
  }
}

function getAllMantenciones() {
  try {
    const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
    ensureMantencionesHeaders(sheet);
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    // Skip header
    const rows = data.slice(1);
    const mantenciones = rows.map((row, index) => {
       // Filter empty rows
       if (!row[COLUMNS.MANTENCIONES.ID]) return null;

       return {
         id: row[COLUMNS.MANTENCIONES.ID],
         fechaIngreso: row[COLUMNS.MANTENCIONES.FECHA_INGRESO],
         vehiculo: row[COLUMNS.MANTENCIONES.VEHICULO],
         tipoMantencion: row[COLUMNS.MANTENCIONES.TIPO_MANTENCION],
         kmActual: row[COLUMNS.MANTENCIONES.KM_ACTUAL],
         proximaMantencionKm: row[COLUMNS.MANTENCIONES.PROXIMA_MANTENCION_KM],
         proximaMantencionFecha: row[COLUMNS.MANTENCIONES.PROXIMA_MANTENCION_FECHA],
         taller: row[COLUMNS.MANTENCIONES.TALLER],
         costo: row[COLUMNS.MANTENCIONES.COSTO],
         observaciones: row[COLUMNS.MANTENCIONES.OBSERVACIONES],
         estado: row[COLUMNS.MANTENCIONES.ESTADO],
         responsable: row[COLUMNS.MANTENCIONES.RESPONSABLE]
       };
    }).filter(m => m !== null);
    
    return createResponse(true, mantenciones);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createMantencion(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
    ensureMantencionesHeaders(sheet);
    
    // Idempotency check
    const duplicateResponse = checkIdempotency(sheet, data.clientRequestId, COLUMNS.MANTENCIONES.ID);
    console.log('Creando mantención con datos:', JSON.stringify(data));
    
    const id = data.clientRequestId || generateId('MANT');
    const newRow = Array(12).fill('');
    
    newRow[COLUMNS.MANTENCIONES.ID] = id;
    newRow[COLUMNS.MANTENCIONES.FECHA_INGRESO] = data.fechaIngreso || '';
    newRow[COLUMNS.MANTENCIONES.VEHICULO] = data.vehiculo || '';
    newRow[COLUMNS.MANTENCIONES.TIPO_MANTENCION] = data.tipoMantencion || '';
    newRow[COLUMNS.MANTENCIONES.KM_ACTUAL] = data.kmActual || 0;
    newRow[COLUMNS.MANTENCIONES.PROXIMA_MANTENCION_KM] = data.proximaMantencionKm || '';
    newRow[COLUMNS.MANTENCIONES.PROXIMA_MANTENCION_FECHA] = data.proximaMantencionFecha || '';
    newRow[COLUMNS.MANTENCIONES.TALLER] = data.taller || '';
    newRow[COLUMNS.MANTENCIONES.COSTO] = data.costo || 0;
    newRow[COLUMNS.MANTENCIONES.OBSERVACION] = data.observaciones || '';
    newRow[COLUMNS.MANTENCIONES.ESTADO] = data.estado || 'Completada';
    newRow[COLUMNS.MANTENCIONES.RESPONSABLE] = data.responsable || '';
    
    sheet.appendRow(newRow);
    
    // Audit Log
    registrarAccion('Mantenciones', 'crear', `Nueva mantención registrada: ${data.tipoMantencion} para vehículo ${data.vehiculo}`, 'success', data.responsable);
    
    // Sync with Vehiculos sheet
    if (data.vehiculo && data.kmActual) {
      updateVehiculoMileage(data.vehiculo, data.kmActual, data.fechaIngreso);
    }

    return createResponse(true, { id, ...data }, "Mantención registrada exitosamente");
  } catch (error) {
    console.error('Error en createMantencion:', error.toString());
    return createResponse(false, null, error.toString());
  }
}

/**
 * Helper to update Vehicle mileage after maintenance
 */
function updateVehiculoMileage(patente, km, fecha) {
  try {
    const vSheet = getSheet(SHEET_NAMES.VEHICULOS);
    const vData = vSheet.getDataRange().getValues();
    const patId = patente.toString().trim().toUpperCase();
    
    for (let i = 1; i < vData.length; i++) {
      if (vData[i][COLUMNS.VEHICULOS.PATENTE].toString().trim().toUpperCase() === patId) {
        const currentKm = Number(vData[i][COLUMNS.VEHICULOS.KILOMETRAJE]) || 0;
        // Only update if reported KM is higher
        if (Number(km) > currentKm) {
          vSheet.getRange(i + 1, COLUMNS.VEHICULOS.KILOMETRAJE + 1).setValue(km);
        }
        // Update last maintenance date
        vSheet.getRange(i + 1, COLUMNS.VEHICULOS.ULTIMA_MANTENCION + 1).setValue(fecha);
        break;
      }
    }
  } catch (e) {
    console.error("Error updating vehicle mileage:", e.toString());
  }
}

function updateMantencion(id, data) {
  try {
     const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
     const dataValues = sheet.getDataRange().getValues();
     
     let rowIndex = -1;
     // Find row by ID (String comparison)
     for (let i = 1; i < dataValues.length; i++) {
        if (dataValues[i][COLUMNS.MANTENCIONES.ID].toString() === id.toString()) {
           rowIndex = i + 1; // 1-based index
           break;
        }
     }
     
     if (rowIndex > 1) {
        const range = sheet.getRange(rowIndex, 1, 1, 12);
        const currentValues = range.getValues()[0];
        const newValues = [...currentValues];
        
        // Update fields if present in data
        if (data.fechaIngreso) newValues[COLUMNS.MANTENCIONES.FECHA_INGRESO] = data.fechaIngreso;
        if (data.vehiculo) newValues[COLUMNS.MANTENCIONES.VEHICULO] = data.vehiculo;
        if (data.tipoMantencion) newValues[COLUMNS.MANTENCIONES.TIPO_MANTENCION] = data.tipoMantencion;
        if (data.kmActual !== undefined) newValues[COLUMNS.MANTENCIONES.KM_ACTUAL] = data.kmActual;
        if (data.proximaMantencionKm !== undefined) newValues[COLUMNS.MANTENCIONES.PROXIMA_MANTENCION_KM] = data.proximaMantencionKm;
        if (data.proximaMantencionFecha) newValues[COLUMNS.MANTENCIONES.PROXIMA_MANTENCION_FECHA] = data.proximaMantencionFecha;
        if (data.taller) newValues[COLUMNS.MANTENCIONES.TALLER] = data.taller;
        if (data.costo !== undefined) newValues[COLUMNS.MANTENCIONES.COSTO] = data.costo;
        if (data.observaciones) newValues[COLUMNS.MANTENCIONES.OBSERVACIONES] = data.observaciones;
        if (data.estado) newValues[COLUMNS.MANTENCIONES.ESTADO] = data.estado;
        if (data.responsable) newValues[COLUMNS.MANTENCIONES.RESPONSABLE] = data.responsable;
        
        range.setValues([newValues]);
        // Audit Log
        registrarAccion('Mantenciones', 'actualizar', `Mantención actualizada: ${id} (Vehículo: ${data.vehiculo || currentValues[COLUMNS.MANTENCIONES.VEHICULO]})`, 'info', data.responsable);

        // Sync with Vehiculos if KM or Vehicle changed
        const vehId = data.vehiculo || currentValues[COLUMNS.MANTENCIONES.VEHICULO];
        const kmVal = data.kmActual !== undefined ? data.kmActual : currentValues[COLUMNS.MANTENCIONES.KM_ACTUAL];
        const fechaVal = data.fechaIngreso || currentValues[COLUMNS.MANTENCIONES.FECHA_INGRESO];
        
        if (vehId && kmVal) {
          updateVehiculoMileage(vehId, kmVal, fechaVal);
        }

        return createResponse(true, { id, ...data }, "Mantención actualizada");
     }
     return createResponse(false, null, "ID no encontrado");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteMantencion(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
    const dataValues = sheet.getDataRange().getValues();
    
    let rowIndex = -1;
    for (let i = 1; i < dataValues.length; i++) {
      if (dataValues[i][COLUMNS.MANTENCIONES.ID].toString() === id.toString()) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex > 1) {
      const vehiculo = dataValues[rowIndex - 1][COLUMNS.MANTENCIONES.VEHICULO];
      sheet.deleteRow(rowIndex);
      
      // Audit Log
      registrarAccion('Mantenciones', 'eliminar', `Mantención eliminada: ${id} (Vehículo: ${vehiculo})`, 'warning', null, data ? data.justificacion : null);
      
      return createResponse(true, null, "Mantención eliminada");
    }
    return createResponse(false, null, "ID no encontrado");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

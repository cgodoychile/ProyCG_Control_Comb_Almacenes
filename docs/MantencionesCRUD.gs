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
    if (!sheet) return createResponse(true, []);
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    // ESTRUCTURA ESTRICTA INDEPENDIENTE DE m (A=0, B=1, ...)
    const mantenciones = data.slice(1).map((row) => {
        if (!row[0]) return null;
        return {
          id: String(row[0]),
          fechaIngreso: row[1],
          vehiculo: row[2],
          tipoMantencion: row[3],
          kmActual: row[4],
          proximaMantencionKm: row[5],
          proximaMantencionFecha: row[6],
          taller: row[7],
          costo: row[8],
          observaciones: row[9],
          estado: row[10],
          responsable: row[11]
        };
    }).filter(m => m !== null);
    
    return createResponse(true, mantenciones);
  } catch (error) {
    console.error('Error en getAllMantenciones v5.1:', error.toString());
    return createResponse(false, null, error.toString());
  }
}

function createMantencion(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
    ensureMantencionesHeaders(sheet);
    
    // Verificación de Idempotencia
    const duplicateResponse = checkIdempotency(sheet, data.clientRequestId, COLUMNS.MANTENCIONES.ID);
    if (duplicateResponse) return duplicateResponse;

    // ALWAYS generate sequential ID: MANT-0001
    const id = generateSequentialId('MANT', SHEET_NAMES.MANTENCIONES, 'ID', 4);
    
    // LITERAL MAPPING (Indestructible)
    const newRow = Array(12).fill('');
    newRow[0] = id;                                       // ID
    newRow[1] = formatDate(data.fechaIngreso || new Date()); // FECHA
    newRow[2] = data.vehiculo || '';                      // VEHICULO
    newRow[3] = data.tipoMantencion || '';                // TIPO
    newRow[4] = parseFloat(data.kmActual) || 0;           // KM_ACTUAL
    newRow[5] = parseFloat(data.proximaMantencionKm) || 0; // PROX_KM
    newRow[6] = data.proximaMantencionFecha ? formatDate(data.proximaMantencionFecha) : ''; // G
    newRow[7] = data.taller || '';                        // TALLER
    newRow[8] = parseFloat(data.costo) || 0;              // COSTO
    newRow[9] = data.observaciones || data.observacion || ''; // OBSERVACION
    newRow[10] = data.estado || 'Completada';             // ESTADO
    newRow[11] = data.responsable || '';                  // RESPONSABLE
    
    console.log("GUARDANDO LITERAL:", newRow);
    sheet.appendRow(newRow);
    
    // Audit Log
    registrarAccion('Mantenciones', 'crear', `Nueva mantención registrada: ${id} para vehículo ${data.vehiculo}`, 'success', data.responsable);
    createAlerta('Mantenciones', 'success', `Nueva mantención: ${id} (${data.vehiculo})`, data.responsable, 'crear');
    
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
    
    // Dynamic Mapping for Vehicles
    const vColInfo = findColumnIndices(vSheet, {
        PATENTE: ['PATENTE', 'ID', 'CODIGO'],
        KILOMETRAJE: ['KILOMETRAJE', 'KM'],
        ULTIMA: ['ULTIMA_MANTENCION', 'ULTIMA']
    });
    
    const vMap = vColInfo;
    const patIdx = (vMap.PATENTE !== undefined && vMap.PATENTE !== -1) ? vMap.PATENTE : 0;
    const kmIdx = (vMap.KILOMETRAJE !== undefined && vMap.KILOMETRAJE !== -1) ? vMap.KILOMETRAJE : 5;
    const ultIdx = (vMap.ULTIMA !== undefined && vMap.ULTIMA !== -1) ? vMap.ULTIMA : 7;
    
    for (let i = 1; i < vData.length; i++) {
      if (String(vData[i][patIdx]).trim().toUpperCase() === patId) {
        const currentKm = Number(vData[i][kmIdx]) || 0;
        // Only update if reported KM is higher
        if (Number(km) > currentKm) {
          vSheet.getRange(i + 1, kmIdx + 1).setValue(km);
        }
        // Update last maintenance date
        vSheet.getRange(i + 1, ultIdx + 1).setValue(fecha);
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
     
     const colInfo = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA_INGRESO', 'FECHA'],
        VEHICULO: ['VEHICULO'],
        KM: ['KM_ACTUAL', 'KM'],
        ESTADO: ['ESTADO']
     });
     const m = colInfo;
     const idIdx = (m.ID !== undefined && m.ID !== -1) ? m.ID : 0;
     
     let rowIndex = -1;
     for (let i = 1; i < dataValues.length; i++) {
        if (String(dataValues[i][idIdx]) === String(id)) {
           rowIndex = i + 1;
           break;
        }
     }
     
     if (rowIndex > 1) {
          // Mapping extendido para actualización literal
          const fullColInfo = findColumnIndices(sheet, {
            ID: ['ID'], FECHA: ['FECHA_INGRESO'], VEHICULO: ['VEHICULO'], TIPO: ['TIPO_MANTENCION'],
            KM: ['KM_ACTUAL'], PROX_KM: ['PROXIMA_MANTENCION_KM'], PROX_DATE: ['PROXIMA_MANTENCION_FECHA'],
            TALLER: ['TALLER'], COSTO: ['COSTO'], OBS: ['OBSERVACION', 'OBSERVACIONES'],
            ESTADO: ['ESTADO'], RESPONSABLE: ['RESPONSABLE']
          });
          const fullMap = fullColInfo;

          const setVal = (key, val) => {
            if (fullMap[key] !== -1 && val !== undefined) {
              sheet.getRange(rowIndex, fullMap[key] + 1).setValue(val);
            }
          };

          if (data.fechaIngreso !== undefined) setVal('FECHA', formatDate(data.fechaIngreso));
          if (data.vehiculo !== undefined) setVal('VEHICULO', data.vehiculo);
          if (data.tipoMantencion !== undefined) setVal('TIPO', data.tipoMantencion);
          if (data.kmActual !== undefined) setVal('KM', data.kmActual);
          if (data.proximaMantencionKm !== undefined) setVal('PROX_KM', data.proximaMantencionKm);
          if (data.proximaMantencionFecha !== undefined) setVal('PROX_DATE', formatDate(data.proximaMantencionFecha));
          if (data.taller !== undefined) setVal('TALLER', data.taller);
          if (data.costo !== undefined) setVal('COSTO', data.costo);
          
          const obs = data.observaciones !== undefined ? data.observaciones : data.observacion;
          if (obs !== undefined) setVal('OBS', obs);
          
          if (data.estado !== undefined) setVal('ESTADO', data.estado);
          if (data.responsable !== undefined) setVal('RESPONSABLE', data.responsable);

        const currentValues = dataValues[rowIndex - 1];
        const vehId = data.vehiculo || currentValues[fullMap.VEHICULO !== -1 ? fullMap.VEHICULO : 2];
        registrarAccion('Mantenciones', 'actualizar', `Mantención actualizada: ${id} (Vehículo: ${vehId})`, 'info', data.responsable);

        const kmVal = data.kmActual !== undefined ? data.kmActual : currentValues[fullMap.KM !== -1 ? fullMap.KM : 4];
        const fechaVal = data.fechaIngreso !== undefined ? data.fechaIngreso : currentValues[fullMap.FECHA !== -1 ? fullMap.FECHA : 1];
        
        if (vehId && kmVal) {
          updateVehiculoMileage(vehId, kmVal, fechaVal);
        }

        return createResponse(true, { id, ...data }, "Mantención actualizada");
     }
     throw new Error("ID no encontrado: " + id);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteMantencion(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
    const dataValues = sheet.getDataRange().getValues();
    
    // BÚSQUEDA ESTRICTA EN COLUMNA A (0)
    for (let i = 1; i < dataValues.length; i++) {
        const rowId = String(dataValues[i][0]);
        if (rowId.trim() === String(id).trim()) {
            const vehiculo = dataValues[i][2] || 'Desconocido';
            sheet.deleteRow(i + 1);
            
            registrarAccion('Mantenciones', 'eliminar', `Mantención eliminada: ${id} (Vehículo: ${vehiculo})`, 'warning', null, data ? data.justificacion : null);
            return createResponse(true, null, "Mantención eliminada exitosamente");
        }
    }
    throw new Error(`ID ${id} no encontrado en la columna A de Mantenciones.`);
  } catch (error) {
    console.error('Error en deleteMantencion v5.1:', error.toString());
    return createResponse(false, null, error.toString());
  }
}

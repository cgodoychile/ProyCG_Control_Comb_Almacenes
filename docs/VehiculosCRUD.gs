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
    const cPrefix = COLUMNS.CONSUMOS || { VEHICULO: 3, KILOMETRAJE: 6 };
    for (let i = 1; i < consumosData.length; i++) {
        if (consumosData[i].length <= Math.max(cPrefix.VEHICULO, cPrefix.KILOMETRAJE)) continue;
        
        const patent = String(consumosData[i][cPrefix.VEHICULO] || '').trim().toUpperCase();
        const km = Number(consumosData[i][cPrefix.KILOMETRAJE]) || 0;
        if (patent) {
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
        UBICACION: ['UBICACION'],
        PROXIMA_MANTENCION_KM: ['PROXIMA_MANTENCION_KM', 'PROXIMA_KM']
    });

    if (data.length <= 1) return createResponse(true, []);
    
    const vehiculos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // DYNAMIC PATENTE/ID LOOKUP
        const patIdx = colMap.PATENTE !== -1 ? colMap.PATENTE : (COLUMNS.VEHICULOS ? COLUMNS.VEHICULOS.PATENTE : 1);
        const internalIdIdx = colMap.ID !== -1 ? colMap.ID : 0;
        
        const patentId = row[patIdx];
        if (!patentId) continue;

        // Dynamic indices for other fields
        const getI = (key, fallback) => colMap[key] !== -1 ? colMap[key] : fallback;

        const currentKm = latestKmByPatent[String(patentId).trim().toUpperCase()] || row[getI('KILOMETRAJE', COLUMNS.VEHICULOS.KILOMETRAJE)] || 0;

        vehiculos.push({
            id: patentId, // SEGURIDAD: La App sigue usando la Patente como ID principal
            internalId: row[internalIdIdx] || '',
            marca: row[getI('MARCA', COLUMNS.VEHICULOS.MARCA)] || '',
            modelo: row[getI('MODELO', COLUMNS.VEHICULOS.MODELO)] || '',
            anio: row[getI('ANIO', COLUMNS.VEHICULOS.ANIO)] || '',
            tipo: row[getI('TIPO', COLUMNS.VEHICULOS.TIPO)] || '',
            estado: row[getI('ESTADO', COLUMNS.VEHICULOS.ESTADO)] || 'operativo',
            kilometraje: currentKm,
            ultimaMantencion: row[getI('ULTIMA_MANTENCION', COLUMNS.VEHICULOS.ULTIMA_MANTENCION)] || '',
            proximaMantencion: row[getI('PROXIMA_MANTENCION', COLUMNS.VEHICULOS.PROXIMA_MANTENCION)] || '',
            proximaMantencionKm: row[getI('PROXIMA_MANTENCION_KM', COLUMNS.VEHICULOS.PROXIMA_MANTENCION_KM)] || 0,
            responsable: row[getI('RESPONSABLE', COLUMNS.VEHICULOS.RESPONSABLE)] || '',
            ubicacion: row[getI('UBICACION', COLUMNS.VEHICULOS.UBICACION)] || ''
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
    
    const cleanId = String(data.id).trim().toUpperCase();

    // 1. Mapeo dinámico completo
    const colMap = findColumnIndices(sheet, {
        ID: ['ID'],
        PATENTE: ['PATENTE', 'ID_PATENTE', 'MATRICULA'],
        MARCA: ['MARCA'],
        MODELO: ['MODELO'],
        ANIO: ['ANIO', 'ANO', 'AÑO'],
        TIPO: ['TIPO'],
        ESTADO: ['ESTADO'],
        KILOMETRAJE: ['KILOMETRAJE', 'KM'],
        ULTIMA: ['ULTIMA_MANTENCION', 'ULTIMA', 'ULTIMA MNATENCION', 'MNATENCION', 'MNTENCION'], // Alias ultra-robusto para el typo
        PROXIMA: ['PROXIMA_MANTENCION', 'PROXIMA'],
        PROXIMA_KM: ['PROXIMA_MANTENCION_KM', 'PROXIMA_KM', 'PROXIMA KM'],
        RESPONSABLE: ['RESPONSABLE'],
        UBICACION: ['UBICACION']
    });
    const patIdx = (colMap.PATENTE !== undefined && colMap.PATENTE !== -1) ? colMap.PATENTE : 1;
    if (colMap.ID === -1 || colMap.ID === undefined) colMap.ID = 0; // Garantiza que ID siempre mapee a la columna A (0)

    // 2. Chequeo de duplicados dinámico
    const moveData = sheet.getDataRange().getValues();
    for (let i = 1; i < moveData.length; i++) {
      if (String(moveData[i][patIdx]).trim().toUpperCase() === cleanId) {
        console.warn("El vehículo ya existe: " + cleanId);
        return createResponse(true, { id: cleanId, ...data, _isDuplicate: true }, "Este vehículo ya está registrado");
      }
    }
    
    const internalId = generateSequentialId('VEH', SHEET_NAMES.VEHICULOS, 'ID', 6);
    
    // 3. Construir fila dinámicamente usando colMap
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = Array(headers.length).fill('');
    
    const set = (key, val) => {
        const idx = colMap[key];
        if (typeof idx === 'number' && idx >= 0) newRow[idx] = val;
    };

    set('ID', internalId);
    set('PATENTE', cleanId);
    set('MARCA', data.marca || '');
    set('MODELO', data.modelo || '');
    set('ANIO', data.anio || '');
    set('TIPO', data.tipo || 'Camioneta');
    set('ESTADO', data.estado || 'operativo');
    set('KILOMETRAJE', data.kilometraje || 0);
    set('ULTIMA', data.ultimaMantencion || '');
    set('PROXIMA', data.proximaMantencion || '');
    set('PROXIMA_KM', data.proximaMantencionKm || 0);
    set('RESPONSABLE', data.responsable || '');
    set('UBICACION', data.ubicacion || '');
    
    sheet.appendRow(newRow);
    
    // Log Auditoria
    registrarAccion('Vehículos', 'crear', `Nuevo vehículo registrado: ${cleanId} (${data.marca} ${data.modelo})`, 'success', data.responsable);
      createAlerta('Vehículos', 'success', `Vehículo registrado: ${cleanId}`, data.responsable || 'Sistema', 'crear');
    
    return createResponse(true, { id: cleanId, ...data });
  } catch (error) {
    console.error('Error en createVehiculo:', error);
    return createResponse(false, null, error.toString());
  }
}

function updateVehiculo(id, data) {
  try {
    if (!id) throw new Error('Patente es requerida');
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const sheetData = sheet.getDataRange().getValues();
    
    // 1. Mapeo dinámico completo primero para saber en qué columna buscar la patente
    const colInfo = findColumnIndices(sheet, {
        PATENTE: ['PATENTE', 'ID', 'CODIGO'],
        MARCA: ['MARCA'],
        MODELO: ['MODELO'],
        ANIO: ['AÑO', 'ANIO'],
        TIPO: ['TIPO'],
        ESTADO: ['ESTADO'],
        KILOMETRAJE: ['KILOMETRAJE', 'KM'],
        ULTIMA: ['ULTIMA_MANTENCION', 'ULTIMA'],
        PROXIMA: ['PROXIMA_MANTENCION', 'PROXIMA'],
        PROXIMA_KM: ['PROXIMA_MANTENCION_KM', 'PROXIMA_KM'],
        RESPONSABLE: ['RESPONSABLE', 'ENCARGADO'],
        UBICACION: ['UBICACION']
    });

    const colMap = colInfo;
    const patIdx = colMap.PATENTE !== -1 ? colMap.PATENTE : 0;
    
    let rowIndex = -1;
    for (let i = 1; i < sheetData.length; i++) {
      if (String(sheetData[i][patIdx]).trim().toUpperCase() === String(id).trim().toUpperCase()) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) throw new Error('Vehículo no encontrado: ' + id);

    const setVal = (key, val) => {
        const idx = colMap[key];
        if (typeof idx === 'number' && idx >= 0 && val !== undefined) {
            sheet.getRange(rowIndex, idx + 1).setValue(val);
        }
    };

    // Soporte cambio de ID (Patente)
    if (data.id && String(data.id).trim().toUpperCase() !== String(id).trim().toUpperCase()) {
        setVal('PATENTE', String(data.id).trim().toUpperCase());
        id = String(data.id).trim().toUpperCase(); 
    }

    setVal('MARCA', data.marca);
    setVal('MODELO', data.modelo);
    setVal('ANIO', data.anio);
    setVal('TIPO', data.tipo);
    setVal('ESTADO', data.estado);
    setVal('KILOMETRAJE', data.kilometraje);
    setVal('ULTIMA', data.ultimaMantencion);
    setVal('PROXIMA', data.proximaMantencion);
    setVal('PROXIMA_KM', data.proximaMantencionKm);
    setVal('RESPONSABLE', data.responsable);
    setVal('UBICACION', data.ubicacion);
    
    // Audit Log
    registrarAccion('Vehículos', 'actualizar', `Vehículo actualizado: ${id}`, 'info', data.responsable);
    
    return getVehiculoById(id);
  } catch (error) {
    console.error('Error en updateVehiculo:', error);
    return createResponse(false, null, error.toString());
  }
}

function deleteVehiculo(id, data) {
  try {
    if (!id) throw new Error('Patente es requerida');
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const sheetData = sheet.getDataRange().getValues();
    
    // MAPEO DINÁMICO TOTAL - NO DEPENDE DE Config.gs
    const colInfo = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO', 'VEH_ID'],
        PATENTE: ['PATENTE', 'ID_PATENTE', 'MATRICULA']
    });
    const colMap = colInfo; // findColumnIndices devuelve el mapa directamente o un objeto con él según la versión
    
    // Detectar los índices reales
    const patIdx = (colMap.PATENTE !== undefined && colMap.PATENTE !== -1) ? colMap.PATENTE : 1; 
    const idIdx = (colMap.ID !== undefined && colMap.ID !== -1) ? colMap.ID : 0;

    for (let i = 1; i < sheetData.length; i++) {
        const rowPat = String(sheetData[i][patIdx] || '').trim().toUpperCase();
        const rowId = String(sheetData[i][idIdx] || '').trim().toUpperCase();
        const target = String(id).trim().toUpperCase();

        if (rowPat === target || rowId === target) {
            sheet.deleteRow(i + 1);
        
            // Limpiar referencias en bodegas (usa la Patente para asegurar historia)
            const deletedInBodega = cleanupWarehouseReferences('Vehiculo', rowPat);
            const syncMsg = deletedInBodega > 0 ? ` (y su registro en bodega eliminado: ${deletedInBodega} ítems)` : '';
            
            // Audit Log
            if (typeof registrarAccion === 'function') {
                registrarAccion('Vehículos', 'eliminar', `Vehículo eliminado: ${rowPat}${syncMsg}`, 'warning', null, data ? data.justificacion : null);
            }
                createAlerta('Vehículos', 'warning', `Vehículo eliminado: ${rowPat}`, 'Sistema', 'eliminar');
            
            SpreadsheetApp.flush();
            return createResponse(true, { message: 'Vehículo eliminado' + syncMsg });
        }
    }
    throw new Error('Vehículo no encontrado: ' + id);
  } catch (error) {
    console.error("Error en deleteVehiculo: " + error.toString());
    return createResponse(false, null, error.toString());
  }
}

/**
 * Script de migración para asignar IDs a vehículos existentes que están vacíos
 */
function syncVehicleIds() {
  try {
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const data = sheet.getDataRange().getValues();
    
    // 1. Mapeo Dinámico
    const colMap = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'] });
    let idIdx = colMap.ID;
    
    // 2. Si no existe la columna ID, insertarla al principio
    if (idIdx === -1) {
       console.log("Insertando columna ID al principio");
       sheet.insertColumnBefore(1);
       sheet.getRange(1, 1).setValue('ID');
       idIdx = 0;
       SpreadsheetApp.flush();
    }
    
    // 3. Obtener datos actualizados tras posible inserción
    const updatedData = sheet.getDataRange().getValues();
    let updatedCount = 0;
    
    // 4. Iterar y llenar vacíos
    for (let i = 1; i < updatedData.length; i++) {
      const currentId = String(updatedData[i][idIdx] || '').trim();
      if (!currentId || currentId === '-') {
        const newId = generateSequentialId('VEH', SHEET_NAMES.VEHICULOS, 'ID', 6);
        sheet.getRange(i + 1, idIdx + 1).setValue(newId);
        // Actualizar el cache local de datos para que generateSequentialId vea el ID anterior
        updatedData[i][idIdx] = newId; 
        updatedCount++;
        SpreadsheetApp.flush(); // Asegura correlación secuencial
      }
    }
    
    const msg = `Migración completada: ${updatedCount} vehículos recibieron un ID técnico.`;
    console.log(msg);
    registrarAccion('Vehículos', 'migracion', msg, 'success', 'Sistema');
    
    return createResponse(true, { updated: updatedCount }, msg);
  } catch (e) {
    console.error("Error en syncVehicleIds: " + e.toString());
    return createResponse(false, null, e.toString());
  }
}

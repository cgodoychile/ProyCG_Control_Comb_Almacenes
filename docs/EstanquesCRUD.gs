/**
 * CRUD OPERATIONS: ESTANQUES
 */

function handleEstanquesGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllEstanques();
    case 'getbyid': return getEstanqueById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleEstanquesPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createEstanque(data);
    case 'update': return updateEstanque(id, data);
    case 'delete': return deleteEstanque(id);
    case 'recalculate': return recalcularTotal();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllEstanques() {
  try {
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    // DYNAMIC COLUMN MAPPING
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO', 'IDENTIFICADOR'],
        NOMBRE: ['NOMBRE', 'ESTANQUE', 'NOMBRE ESTANQUE'],
        UBICACION: ['UBICACION'],
        CAPACIDAD: ['CAPACIDAD', 'CAPACIDAD TOTAL'],
        STOCK: ['STOCK', 'STOCK ACTUAL'],
        MINIMO: ['STOCK MINIMO', 'ALERTA', 'MINIMO'],
        ESTADO: ['ESTADO'],
        TIPO: ['TIPO', 'COMBUSTIBLE'],
        RESPONSABLE: ['RESPONSABLE', 'ENCARGADO']
    });

    const estanques = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Use mapped columns or fallback to Config
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ESTANQUES.ID;
        const nombreIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE;
        const ubicacionIdx = colMap.UBICACION !== -1 ? colMap.UBICACION : COLUMNS.ESTANQUES.UBICACION;
        const capIdx = colMap.CAPACIDAD !== -1 ? colMap.CAPACIDAD : COLUMNS.ESTANQUES.CAPACIDAD_TOTAL;
        const stockIdx = colMap.STOCK !== -1 ? colMap.STOCK : COLUMNS.ESTANQUES.STOCK_ACTUAL;
        const minIdx = colMap.MINIMO !== -1 ? colMap.MINIMO : COLUMNS.ESTANQUES.STOCK_MINIMO;
        const estIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.ESTANQUES.ESTADO;
        const tipoIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.ESTANQUES.TIPO_COMBUSTIBLE;
        const respIdx = colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.ESTANQUES.RESPONSABLE;

        const id = row[idIdx];
        const nombre = row[nombreIdx];
        
        if (!id && !nombre) continue;

        estanques.push({
            id: id || 'TEMP-' + i,
            nombre: nombre || 'Sin Nombre',
            ubicacion: row[ubicacionIdx],
            capacidadTotal: row[capIdx],
            stockActual: row[stockIdx],
            alertaMinima: row[minIdx],
            estado: row[estIdx],
            tipoCombustible: row[tipoIdx],
            responsable: row[respIdx]
        });
    }
    return createResponse(true, estanques);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function getEstanqueById(id) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][COLUMNS.ESTANQUES.ID] == id) {
        const row = data[i];
        return createResponse(true, {
          id: row[COLUMNS.ESTANQUES.ID],
            nombre: row[COLUMNS.ESTANQUES.NOMBRE],
            ubicacion: row[COLUMNS.ESTANQUES.UBICACION],
            capacidadTotal: row[COLUMNS.ESTANQUES.CAPACIDAD_TOTAL],
            stockActual: row[COLUMNS.ESTANQUES.STOCK_ACTUAL],
            estado: row[COLUMNS.ESTANQUES.ESTADO]
        });
      }
    }
    throw new Error('Estanque no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createEstanque(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const id = new Date().getTime().toString();
    
    // DYNAMIC MAP
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO', 'IDENTIFICADOR'],
        NOMBRE: ['NOMBRE', 'ESTANQUE', 'NOMBRE ESTANQUE'],
        UBICACION: ['UBICACION'],
        CAPACIDAD: ['CAPACIDAD', 'CAPACIDAD TOTAL'],
        STOCK: ['STOCK', 'STOCK ACTUAL'],
        MINIMO: ['STOCK MINIMO', 'ALERTA', 'MINIMO'],
        ESTADO: ['ESTADO'],
        TIPO: ['TIPO', 'COMBUSTIBLE'],
        RESPONSABLE: ['RESPONSABLE', 'ENCARGADO']
    });

    const indices = Object.values(colMap).filter(v => v !== -1);
    const maxIdx = Math.max(...indices, 10);
    const newRow = new Array(maxIdx + 1).fill('');
    
    const set = (keyIdx, val) => {
        if (keyIdx !== -1) newRow[keyIdx] = val;
    };
    
    set(colMap.ID !== -1 ? colMap.ID : COLUMNS.ESTANQUES.ID, id);
    set(colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE, data.nombre);
    set(colMap.UBICACION !== -1 ? colMap.UBICACION : COLUMNS.ESTANQUES.UBICACION, data.ubicacion);
    set(colMap.CAPACIDAD !== -1 ? colMap.CAPACIDAD : COLUMNS.ESTANQUES.CAPACIDAD_TOTAL, data.capacidadTotal);
    set(colMap.STOCK !== -1 ? colMap.STOCK : COLUMNS.ESTANQUES.STOCK_ACTUAL, data.stockActual || 0);
    set(colMap.MINIMO !== -1 ? colMap.MINIMO : COLUMNS.ESTANQUES.STOCK_MINIMO, data.alertaMinima || 0);
    set(colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.ESTANQUES.ESTADO, data.estado || 'operativo');
    set(colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.ESTANQUES.TIPO_COMBUSTIBLE, data.tipoCombustible || 'Diesel');
    set(colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.ESTANQUES.RESPONSABLE, data.responsable || '');
    
    sheet.appendRow(newRow);
    
    // Audit Log
    registrarAccion('Estanques', 'crear', `Nuevo estanque registrado: ${data.nombre} (Capacidad: ${data.capacidadTotal}L)`, 'success', data.responsable);
    
    return createResponse(true, { id: id, ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateEstanque(id, data) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const rows = sheet.getDataRange().getValues();
    
    // DYNAMIC MAP
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO', 'IDENTIFICADOR'],
        NOMBRE: ['NOMBRE', 'ESTANQUE', 'NOMBRE ESTANQUE'],
        UBICACION: ['UBICACION'],
        CAPACIDAD: ['CAPACIDAD', 'CAPACIDAD TOTAL'],
        STOCK: ['STOCK', 'STOCK ACTUAL'],
        MINIMO: ['STOCK MINIMO', 'ALERTA', 'MINIMO'],
        ESTADO: ['ESTADO'],
        TIPO: ['TIPO', 'COMBUSTIBLE'],
        RESPONSABLE: ['RESPONSABLE', 'ENCARGADO']
    });

    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ESTANQUES.ID;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] == id) {
        
        const write = (colIdx, val) => {
            if (colIdx !== -1 && val !== undefined) {
                 sheet.getRange(i + 1, colIdx + 1).setValue(val);
            }
        };

        write(colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE, data.nombre);
        write(colMap.UBICACION !== -1 ? colMap.UBICACION : COLUMNS.ESTANQUES.UBICACION, data.ubicacion);
        write(colMap.CAPACIDAD !== -1 ? colMap.CAPACIDAD : COLUMNS.ESTANQUES.CAPACIDAD_TOTAL, data.capacidadTotal);
        write(colMap.STOCK !== -1 ? colMap.STOCK : COLUMNS.ESTANQUES.STOCK_ACTUAL, data.stockActual);
        write(colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.ESTANQUES.ESTADO, data.estado);
        write(colMap.MINIMO !== -1 ? colMap.MINIMO : COLUMNS.ESTANQUES.STOCK_MINIMO, data.alertaMinima);
        write(colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.ESTANQUES.TIPO_COMBUSTIBLE, data.tipoCombustible);
        write(colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.ESTANQUES.RESPONSABLE, data.responsable);
        
        registrarAccion('Estanques', 'actualizar', `Estanque actualizado: ${data.nombre || rows[i][(colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE)]}`, 'info', data.responsable);
        
        return createResponse(true, { id: id, ...data });
      }
    }
    throw new Error('Estanque no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteEstanque(id) {
  try {
    const targetId = String(id || '').trim();
    Logger.log(`[!] ELIMINAR ESTANQUE: targetId='${targetId}'`);
    
    if (!targetId) throw new Error('ID es requerido');
    
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const rows = sheet.getDataRange().getValues();
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        NOMBRE: ['NOMBRE']
    });
    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ESTANQUES.ID;
    const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE;
    
    let found = false;
    
    for (let i = 1; i < rows.length; i++) {
        const rowId = String(rows[i][idIdx] || '').trim();
        
        if (rowId === targetId || (rowId && targetId && rowId == targetId)) {
            const nombreEstanque = rows[i][nmIdx] || 'Sin Nombre';
            Logger.log(`   -> [MATCH] Fila ${i+1}: ${nombreEstanque}`);
            
            sheet.deleteRow(i + 1);
            found = true;
            
            if (typeof registrarAccion === 'function') {
              registrarAccion('Estanques', 'eliminar', `Estanque eliminado: ${nombreEstanque} (ID: ${targetId})`, 'warning', null);
            }
            
            SpreadsheetApp.flush();
            return createResponse(true, { message: 'Estanque eliminado exitosamente' });
        }
    }
    
    if (!found) {
        throw new Error(`Estanque con ID ${targetId} no encontrado`);
    }
  } catch (error) {
    Logger.log(`❌ Error deleteEstanque: ${error.toString()}`);
    return createResponse(false, null, error.toString());
  }
}

function updateEstanqueStock(nombreEstanque, deltaLitros) {
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const data = sheet.getDataRange().getValues();
    
    // Dynamic map for Name/Stock
    const colMap = findColumnIndices(sheet, {
        NOMBRE: ['NOMBRE', 'ESTANQUE'],
        STOCK: ['STOCK', 'STOCK ACTUAL']
    });
    const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE;
    const stkIdx = colMap.STOCK !== -1 ? colMap.STOCK : COLUMNS.ESTANQUES.STOCK_ACTUAL;

    for (let i = 1; i < data.length; i++) {
        if (data[i][nmIdx] === nombreEstanque) { 
            const currentStock = parseFloat(data[i][stkIdx]) || 0;
            const newStock = currentStock + deltaLitros;
            sheet.getRange(i + 1, stkIdx + 1).setValue(newStock);
            return;
        }
    }
}

function recalcularTotal() {
  const sheetEstanques = getSheet(SHEET_NAMES.ESTANQUES);
  const sheetCargas = getSheet(SHEET_NAMES.CARGAS);
  const sheetConsumos = getSheet(SHEET_NAMES.CONSUMOS);
  
  const estanquesData = sheetEstanques.getDataRange().getValues();
  const cargasData = sheetCargas.getDataRange().getValues();
  const consumosData = sheetConsumos.getDataRange().getValues();
  
  // Need dynamic maps for all relevant sheets to ensure calculation is correct
  const estMap = findColumnIndices(sheetEstanques, { NOMBRE: ['NOMBRE'], STOCK: ['STOCK'] });
  const estNmIdx = estMap.NOMBRE !== -1 ? estMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE;
  const estStkIdx = estMap.STOCK !== -1 ? estMap.STOCK : COLUMNS.ESTANQUES.STOCK_ACTUAL;

  const carMap = findColumnIndices(sheetCargas, { ESTANQUE: ['ESTANQUE'], LITROS: ['LITROS'] });
  const carEstIdx = carMap.ESTANQUE !== -1 ? carMap.ESTANQUE : COLUMNS.CARGAS.ESTANQUE;
  const carLitIdx = carMap.LITROS !== -1 ? carMap.LITROS : COLUMNS.CARGAS.LITROS;

  const conMap = findColumnIndices(sheetConsumos, { ESTANQUE: ['ESTANQUE'], LITROS: ['LITROS'] });
  const conEstIdx = conMap.ESTANQUE !== -1 ? conMap.ESTANQUE : COLUMNS.CONSUMOS.ESTANQUE;
  const conLitIdx = conMap.LITROS !== -1 ? conMap.LITROS : COLUMNS.CONSUMOS.LITROS_USADOS;

  const stocks = {}; 

  // Inicializar stocks
  for (let i = 1; i < estanquesData.length; i++) {
    const nombre = estanquesData[i][estNmIdx];
    if (nombre) stocks[nombre] = 0;
  }
  
  // Sumar Cargas
  for (let i = 1; i < cargasData.length; i++) {
    const nombre = cargasData[i][carEstIdx];
    const litros = parseFloat(cargasData[i][carLitIdx]) || 0;
    if (stocks[nombre] !== undefined) stocks[nombre] += litros;
  }
  
  // Restar Consumos
  for (let i = 1; i < consumosData.length; i++) {
    const nombre = consumosData[i][conEstIdx];
    const litros = parseFloat(consumosData[i][conLitIdx]) || 0;
    if (stocks[nombre] !== undefined) stocks[nombre] -= litros;
  }
  
  // Guardar
  for (let i = 1; i < estanquesData.length; i++) {
    const nombre = estanquesData[i][estNmIdx];
    if (stocks[nombre] !== undefined) {
      sheetEstanques.getRange(i + 1, estStkIdx + 1).setValue(stocks[nombre]);
    }
  }
  
  return createResponse(true, { message: "Stocks recalculados exitosamente" });
}

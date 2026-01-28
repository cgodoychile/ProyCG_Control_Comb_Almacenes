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
    case 'delete': return deleteEstanque(id, data);
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
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO', 'IDENTIFICADOR']
    });
    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ESTANQUES.ID;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]).trim() === String(id).trim()) {
        const row = data[i];
        // Retornar objeto completo mapeado
        const fullMap = findColumnIndices(sheet, {
            ID: ['ID'], NOMBRE: ['NOMBRE'], UBICACION: ['UBICACION'], 
            CAPACIDAD: ['CAPACIDAD'], STOCK: ['STOCK'], ESTADO: ['ESTADO'],
            FECHA_ULTIMA_CARGA: ['FECHA_ULTIMA_CARGA', 'FECHA']
        });
        return createResponse(true, {
          id: row[idIdx],
          nombre: row[fullMap.NOMBRE !== -1 ? fullMap.NOMBRE : 1],
          ubicacion: row[fullMap.UBICACION !== -1 ? fullMap.UBICACION : 2],
          capacidadTotal: row[fullMap.CAPACIDAD !== -1 ? fullMap.CAPACIDAD : 3],
          stockActual: row[fullMap.STOCK !== -1 ? fullMap.STOCK : 4],
          estado: row[fullMap.ESTADO !== -1 ? fullMap.ESTADO : 5],
          fechaUltimaCarga: row[fullMap.FECHA_ULTIMA_CARGA !== -1 ? fullMap.FECHA_ULTIMA_CARGA : 6]
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
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO', 'IDENTIFICADOR'],
        NOMBRE: ['NOMBRE', 'ESTANQUE'],
        UBICACION: ['UBICACION'],
        CAPACIDAD: ['CAPACIDAD', 'CAPACIDAD_TOTAL'],
        STOCK: ['STOCK', 'STOCK_ACTUAL'],
        ESTADO: ['ESTADO'],
        FECHA_ULTIMA_CARGA: ['FECHA_ULTIMA_CARGA', 'FECHA']
    });

    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ESTANQUES.ID;
    const id = generateSequentialId('EST', SHEET_NAMES.ESTANQUES, 'ID', 3);

    // Array estricto de 10 columnas para evitar desalineación
    const rowData = new Array(10).fill('');
    
    rowData[idIdx] = id;
    rowData[colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ESTANQUES.NOMBRE] = data.nombre || '';
    rowData[colMap.UBICACION !== -1 ? colMap.UBICACION : COLUMNS.ESTANQUES.UBICACION] = data.ubicacion || '';
    rowData[colMap.CAPACIDAD !== -1 ? colMap.CAPACIDAD : COLUMNS.ESTANQUES.CAPACIDAD_TOTAL] = Number(data.capacidadTotal) || 0;
    rowData[colMap.STOCK !== -1 ? colMap.STOCK : COLUMNS.ESTANQUES.STOCK_ACTUAL] = Number(data.stockActual) || 0;
    rowData[colMap.MINIMO !== -1 ? colMap.MINIMO : COLUMNS.ESTANQUES.STOCK_MINIMO] = Number(data.alertaMinima) || 0;
    rowData[colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.ESTANQUES.ESTADO] = data.estado || 'operativo';
    rowData[colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.ESTANQUES.TIPO_COMBUSTIBLE] = data.tipoCombustible || 'Diesel';
    rowData[colMap.FECHA_ULTIMA_CARGA !== -1 ? colMap.FECHA_ULTIMA_CARGA : COLUMNS.ESTANQUES.FECHA_ULTIMA_CARGA] = data.fechaUltimaCarga || '';
    rowData[colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.ESTANQUES.RESPONSABLE] = data.responsable || '';
    
    sheet.appendRow(rowData);
    
    registrarAccion('Estanques', 'crear', `Nuevo estanque: ${data.nombre} (ID: ${id})`, 'success');
    
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
        write(colMap.MINIMO !== -1 ? colMap.MINIMO : COLUMNS.ESTANQUES.STOCK_MINIMO, data.alertaMinima);
        write(colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.ESTANQUES.ESTADO, data.estado);
        write(colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.ESTANQUES.TIPO_COMBUSTIBLE, data.tipoCombustible);
        write(colMap.FECHA_ULTIMA_CARGA !== -1 ? colMap.FECHA_ULTIMA_CARGA : COLUMNS.ESTANQUES.FECHA_ULTIMA_CARGA, data.fechaUltimaCarga);
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

function deleteEstanque(id, data) {
  try {
    const targetId = String(id || '').trim();
    if (!targetId) throw new Error('ID es requerido');
    
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const rows = sheet.getDataRange().getValues();
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO']
    });
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    
    for (let i = 1; i < rows.length; i++) {
        const rowId = String(rows[i][idIdx] || '').trim();
        
        if (rowId === targetId) {
            sheet.deleteRow(i + 1);
            
            // Limpiar referencias en bodegas
            cleanupWarehouseReferences('Estanque', targetId);
            
            registrarAccion('Estanques', 'eliminar', `Estanque eliminado (ID: ${targetId})`, 'warning');
            
            SpreadsheetApp.flush();
            return createResponse(true, { message: 'Estanque eliminado exitosamente' });
        }
    }
    
    throw new Error(`Estanque con ID ${targetId} no encontrado`);
  } catch (error) {
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

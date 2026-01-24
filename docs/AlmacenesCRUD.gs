/**
 * CRUD OPERATIONS: ALMACENES
 * Refactored to use fully dynamic column mapping.
 */

function handleAlmacenesGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllAlmacenes();
    case 'getbyid': return getAlmacenById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleAlmacenesPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createAlmacen(data);
    case 'update': return updateAlmacen(id, data);
    case 'delete': return deleteAlmacen(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

/**
 * Helper to get column mapping for ALMACENES
 */
function getAlmacenesColMap(sheet) {
  return findColumnIndices(sheet, {
    ID: ['ID', 'ID_ALMACEN', 'ALMACEN_ID'],
    NOMBRE: ['NOMBRE', 'NOMBRE_ALMACEN'],
    UBICACION: ['UBICACION'],
    RESPONSABLE: ['RESPONSABLE', 'ENCARGADO'],
    FECHA_CREACION: ['FECHA_CREACION', 'CREADO'],
    ESTADO: ['ESTADO']
  });
}

function getAllAlmacenes() {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const colMap = getAlmacenesColMap(sheet);

        // Fetch all products once to avoid multiple sheet reads
        const productosSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const productosData = productosSheet.getDataRange().getValues();
        const prodColMap = findColumnIndices(productosSheet, {
           ALMACEN_ID: ['ALMACEN_ID', 'ID_ALMACEN'],
           CANTIDAD: ['CANTIDAD', 'STOCK'],
           EN_USO: ['EN USO', 'CANTIDAD_EN_USO', 'EN_USO'],
           STOCK_MIN: ['STOCK_MINIMO', 'MINIMO'],
           VALOR: ['VALOR_UNITARIO', 'PRECIO']
        });

        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ALMACENES.ID;
        const pAlmIdx = prodColMap.ALMACEN_ID !== -1 ? prodColMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
        const pCantIdx = prodColMap.CANTIDAD !== -1 ? prodColMap.CANTIDAD : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD;
        const pUsoIdx = prodColMap.EN_USO !== -1 ? prodColMap.EN_USO : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO;
        const pMinIdx = prodColMap.STOCK_MIN !== -1 ? prodColMap.STOCK_MIN : COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO;
        const pValIdx = prodColMap.VALOR !== -1 ? prodColMap.VALOR : COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO;

        const parseVal = (val) => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return val;
          const cleaned = String(val).replace(/[^0-9,.]/g, '').replace(',', '.');
          return parseFloat(cleaned) || 0;
        };

        const almacenes = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const almacenId = String(row[idIdx]).trim();
            if (!almacenId) continue;
            
            let totalProductos = 0;
            let alertasStock = 0;
            let valorInventario = 0;
            
            for (let j = 1; j < productosData.length; j++) {
                const prodAlmacenId = String(productosData[j][pAlmIdx] || '').trim();
                if (prodAlmacenId === almacenId) {
                    totalProductos++;
                    const cantidad = parseVal(productosData[j][pCantIdx]);
                    const cantidadEnUso = parseVal(productosData[j][pUsoIdx]);
                    const stockMinimo = parseVal(productosData[j][pMinIdx]);
                    const valorUnitario = parseVal(productosData[j][pValIdx]);
                    
                    valorInventario += ((cantidad + cantidadEnUso) * valorUnitario);
                    if (cantidad < stockMinimo) alertasStock++;
                }
            }
            
            const alm = mapRowToAlmacen(row, colMap);
            alm.totalProductos = totalProductos;
            alm.alertasStock = alertasStock;
            alm.valorInventario = Number(valorInventario.toFixed(2));
            almacenes.push(alm);
        }
        return createResponse(true, almacenes);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function getAlmacenById(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const data = sheet.getDataRange().getValues();
        const colMap = getAlmacenesColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ALMACENES.ID;

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][idIdx]).trim() === String(id).trim()) {
                return createResponse(true, mapRowToAlmacen(data[i], colMap));
            }
        }
        return createErrorResponse("Almacén no encontrado", 404);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function mapRowToAlmacen(row, colMap) {
    const getVal = (key, fallbackIdx) => {
        const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
        return row[idx];
    };

    return {
        id: getVal('ID', COLUMNS.ALMACENES.ID),
        nombre: getVal('NOMBRE', COLUMNS.ALMACENES.NOMBRE),
        ubicacion: getVal('UBICACION', COLUMNS.ALMACENES.UBICACION),
        responsable: getVal('RESPONSABLE', COLUMNS.ALMACENES.RESPONSABLE),
        fechaCreacion: getVal('FECHA_CREACION', COLUMNS.ALMACENES.FECHA_CREACION),
        estado: getVal('ESTADO', COLUMNS.ALMACENES.ESTADO)
    };
}

function createAlmacen(data) {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const colMap = getAlmacenesColMap(sheet);
        
        const maxIdx = Math.max(...Object.values(colMap), 5);
        const newRow = Array(maxIdx + 1).fill('');
        
        const setVal = (key, fallbackIdx, val) => {
            const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
            if (idx !== -1) newRow[idx] = val;
        };

        const almId = data.id || 'ALM-' + new Date().getTime();
        setVal('ID', COLUMNS.ALMACENES.ID, almId);
        setVal('NOMBRE', COLUMNS.ALMACENES.NOMBRE, data.nombre);
        setVal('UBICACION', COLUMNS.ALMACENES.UBICACION, data.ubicacion);
        setVal('RESPONSABLE', COLUMNS.ALMACENES.RESPONSABLE, data.responsable);
        setVal('FECHA_CREACION', COLUMNS.ALMACENES.FECHA_CREACION, data.fechaCreacion || new Date().toISOString());
        setVal('ESTADO', COLUMNS.ALMACENES.ESTADO, data.estado || 'activo');

        sheet.appendRow(newRow);
        registrarAccion('Almacenes', 'crear', `Nuevo almacén: ${data.nombre}`, 'success', data.responsable);
        return createResponse(true, { id: almId, ...data });
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function updateAlmacen(id, data) {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const colMap = getAlmacenesColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ALMACENES.ID;
        const rows = sheet.getDataRange().getValues();
        const targetId = String(id).trim();

        for (let i = 1; i < rows.length; i++) {
            if (String(rows[i][idIdx]).trim() === targetId) {
                const rowNum = i + 1;
                
                const updateField = (key, fallbackIdx, val) => {
                    if (val === undefined || val === null) return;
                    const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
                    if (idx !== -1) sheet.getRange(rowNum, idx + 1).setValue(val);
                };

                updateField('NOMBRE', COLUMNS.ALMACENES.NOMBRE, data.nombre);
                updateField('UBICACION', COLUMNS.ALMACENES.UBICACION, data.ubicacion);
                updateField('RESPONSABLE', COLUMNS.ALMACENES.RESPONSABLE, data.responsable);
                updateField('ESTADO', COLUMNS.ALMACENES.ESTADO, data.estado);
                
                SpreadsheetApp.flush();
                registrarAccion('Almacenes', 'actualizar', `Almacén actualizado: ${targetId}`, 'info', data.responsable);
                return createResponse(true, { id, ...data });
            }
        }
        throw new Error("Almacén no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function deleteAlmacen(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const colMap = getAlmacenesColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ALMACENES.ID;
        const data = sheet.getDataRange().getValues();
        const targetId = String(id).trim();

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][idIdx]).trim() === targetId) {
                const nombreIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ALMACENES.NOMBRE;
                const nombre = data[i][nombreIdx];
                sheet.deleteRow(i + 1);
                registrarAccion('Almacenes', 'eliminar', `Almacén eliminado: ${nombre}`, 'warning', null);
                return createResponse(true, { message: "Almacén eliminado" });
            }
        }
        throw new Error("Almacén no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

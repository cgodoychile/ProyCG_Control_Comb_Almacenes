/**
 * CRUD OPERATIONS: MOVIMIENTOS_ALMACEN
 * Refactored to use fully dynamic column mapping.
 */

function handleMovimientosGet(action, id, almacenId) {
  switch (action.toLowerCase()) {
    case 'getall': return almacenId ? getMovimientosByAlmacen(almacenId) : getAllMovimientos();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleMovimientosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createMovimiento(data);
    case 'delete': return deleteMovimiento(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

/**
 * Helper to get column mapping for MOVIMIENTOS_ALMACEN
 */
function getMovimientosColMap(sheet) {
  return findColumnIndices(sheet, {
    ID: ['ID', 'ID_MOVIMIENTO', 'CODIGO'],
    PROD_ID: ['ID_PRODUCTO', 'PRODUCTO_ID'],
    TIPO: ['TIPO', 'TIPO_MOVIMIENTO'],
    ALM_ORIGEN: ['ID_ALMACEN_ORIGEN', 'ALMACEN_ORIGEN', 'ORIGEN'],
    ALM_DESTINO: ['ID_ALMACEN_DESTINO', 'ALMACEN_DESTINO', 'DESTINO'],
    CANTIDAD: ['CANTIDAD', 'CANT'],
    FECHA: ['FECHA', 'FECHA_MOVIMIENTO'],
    RESPONSABLE: ['RESPONSABLE'],
    GUIA: ['GUIA_REFERENCIA', 'GUIA', 'REFERENCIA'],
    MOTIVO: ['MOTIVO'],
    PROVEEDOR: ['PROVEEDOR_TRANSPORTE', 'TRANSPORTE'],
    OBSERVACIONES: ['OBSERVACIONES'],
    FECHA_DEVOLUCION: ['FECHA_DEVOLUCION', 'DEVOLUCION_ESTIMADA', 'RETORNO_ESTIMADO', 'FECHA_LIMITE']
  });
}

function getAllMovimientos() {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const colMap = getMovimientosColMap(sheet);
        const productMap = fetchProductNamesMap();

        const movimientos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.MOVIMIENTOS_ALMACEN.ID;
            if (!row[idIdx]) continue;
            
            movimientos.push(mapRowToMovimiento(row, colMap, productMap));
        }
        return createResponse(true, movimientos);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function getMovimientosByAlmacen(almacenId) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const colMap = getMovimientosColMap(sheet);
        const productMap = fetchProductNamesMap();

        const movimientos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.MOVIMIENTOS_ALMACEN.ID;
            const orgIdx = colMap.ALM_ORIGEN !== -1 ? colMap.ALM_ORIGEN : COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_ORIGEN;
            const destIdx = colMap.ALM_DESTINO !== -1 ? colMap.ALM_DESTINO : COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_DESTINO;
            
            if (!row[idIdx]) continue;
            
            const isOrigin = String(row[orgIdx]) === String(almacenId);
            const isDestination = String(row[destIdx]) === String(almacenId);
            
            if (isOrigin || isDestination) {
                movimientos.push(mapRowToMovimiento(row, colMap, productMap));
            }
        }
        return createResponse(true, movimientos);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function fetchProductNamesMap() {
    const prodSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const prodData = prodSheet.getDataRange().getValues();
    const prodColMap = findColumnIndices(prodSheet, { 
      ID: ['ID', 'ID_PRODUCTO'], 
      NOMBRE: ['NOMBRE', 'NOMBRE_PRODUCTO'] 
    });
    
    const idIdx = prodColMap.ID !== -1 ? prodColMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
    const nmIdx = prodColMap.NOMBRE !== -1 ? prodColMap.NOMBRE : COLUMNS.PRODUCTOS_ALMACEN.NOMBRE;
    
    const map = {};
    for (let j = 1; j < prodData.length; j++) {
        const pId = String(prodData[j][idIdx] || '').trim();
        if (pId) map[pId] = prodData[j][nmIdx];
    }
    return map;
}

function mapRowToMovimiento(row, colMap, productMap) {
    const getVal = (key, fallbackIdx) => {
        const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
        return row[idx];
    };

    const prodId = String(getVal('PROD_ID', COLUMNS.MOVIMIENTOS_ALMACEN.PRODUCTO_ID) || '').trim();

    return {
        id: getVal('ID', COLUMNS.MOVIMIENTOS_ALMACEN.ID),
        productoId: prodId,
        productoNombre: productMap[prodId] || 'Producto desconocido',
        tipo: getVal('TIPO', COLUMNS.MOVIMIENTOS_ALMACEN.TIPO),
        almacenOrigen: getVal('ALM_ORIGEN', COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_ORIGEN),
        almacenDestino: getVal('ALM_DESTINO', COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_DESTINO),
        cantidad: getVal('CANTIDAD', COLUMNS.MOVIMIENTOS_ALMACEN.CANTIDAD),
        fecha: getVal('FECHA', COLUMNS.MOVIMIENTOS_ALMACEN.FECHA),
        responsable: getVal('RESPONSABLE', COLUMNS.MOVIMIENTOS_ALMACEN.RESPONSABLE),
        guiaReferencia: getVal('GUIA', COLUMNS.MOVIMIENTOS_ALMACEN.GUIA_REFERENCIA),
        motivo: getVal('MOTIVO', COLUMNS.MOVIMIENTOS_ALMACEN.MOTIVO),
        proveedorTransporte: getVal('PROVEEDOR', COLUMNS.MOVIMIENTOS_ALMACEN.PROVEEDOR_TRANSPORTE),
        observaciones: getVal('OBSERVACIONES', COLUMNS.MOVIMIENTOS_ALMACEN.OBSERVACIONES),
        fechaDevolucion: getVal('FECHA_DEVOLUCION', 12)
    };
}

function createMovimiento(data) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const prodSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        
        const colMapMov = getMovimientosColMap(sheet);
        const colMapProd = findColumnIndices(prodSheet, {
          ID: ['ID', 'ID_PRODUCTO'],
          ALMACEN_ID: ['ALMACEN_ID', 'ID_ALMACEN'],
          CANTIDAD: ['CANTIDAD', 'STOCK'],
          EN_USO: ['EN_USO', 'CANTIDAD_EN_USO'],
          RETORNABLE: ['RETORNABLE', 'ES_RETORNABLE'],
          ACTIVO: ['ES_ACTIVO', 'ACTIVO']
        });

        const idIdx_P = colMapProd.ID !== -1 ? colMapProd.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
        const almIdx_P = colMapProd.ALMACEN_ID !== -1 ? colMapProd.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
        const cantIdx_P = colMapProd.CANTIDAD !== -1 ? colMapProd.CANTIDAD : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD;
        const usoIdx_P = colMapProd.EN_USO !== -1 ? colMapProd.EN_USO : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO;
        const retIdx_P = colMapProd.RETORNABLE !== -1 ? colMapProd.RETORNABLE : COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE;

        const prodData = prodSheet.getDataRange().getValues();
        const cantidad = Number(data.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) throw new Error("Cantidad inválida");

        const tipo = String(data.tipo).toLowerCase();
        const targetProdId = String(data.productoId).trim();
        const targetAlmId = String(data.almacenOrigen || data.almacenId).trim();
        const targetAlmDest = String(data.almacenDestino).trim();

        let sourceRow = -1;
        let destRow = -1;

        for (let i = 1; i < prodData.length; i++) {
            const rId = String(prodData[i][idIdx_P]).trim();
            const rAlm = String(prodData[i][almIdx_P]).trim();
            if (rId === targetProdId) {
                if (rAlm === targetAlmId) sourceRow = i + 1;
                if (tipo === 'traslado' && rAlm === targetAlmDest) destRow = i + 1;
            }
        }

        if (sourceRow === -1 && tipo !== 'entrada') throw new Error("Producto no encontrado en almacén de origen");

        const sRowData = sourceRow !== -1 ? prodData[sourceRow - 1] : null;
        const sStock = sRowData ? Number(sRowData[cantIdx_P]) || 0 : 0;
        const sUso = sRowData ? Number(sRowData[usoIdx_P]) || 0 : 0;
        const isRet = sRowData ? checkBoolean(sRowData[retIdx_P]) : false;

        // Apply Stock Changes
        if (tipo === 'entrada') {
            // Find existing or error (unless we want to support creating from scratch here)
            if (sourceRow === -1) throw new Error("Producto no registrado en bodega. Úselo desde la vista de Almacén.");
            prodSheet.getRange(sourceRow, cantIdx_P + 1).setValue(sStock + cantidad);
        } else if (tipo === 'salida') {
            if (sStock < cantidad) throw new Error("Stock insuficiente");
            prodSheet.getRange(sourceRow, cantIdx_P + 1).setValue(sStock - cantidad);
            if (isRet) {
                prodSheet.getRange(sourceRow, usoIdx_P + 1).setValue(sUso + cantidad);
            }
        } else if (tipo === 'retorno') {
            if (!isRet) throw new Error("Este producto no es retornable");
            if (sUso < cantidad) throw new Error("No hay suficientes unidades 'en uso'");
            prodSheet.getRange(sourceRow, cantIdx_P + 1).setValue(sStock + cantidad);
            prodSheet.getRange(sourceRow, usoIdx_P + 1).setValue(sUso - cantidad);
        } else if (tipo === 'baja') {
            if (sStock >= cantidad) {
                prodSheet.getRange(sourceRow, cantIdx_P + 1).setValue(sStock - cantidad);
            } else if (isRet && (sStock + sUso) >= cantidad) {
                const diff = cantidad - sStock;
                prodSheet.getRange(sourceRow, cantIdx_P + 1).setValue(0);
                prodSheet.getRange(sourceRow, usoIdx_P + 1).setValue(sUso - diff);
            } else {
                throw new Error("Existencias insuficientes para baja");
            }
        } else if (tipo === 'traslado') {
            if (sStock < cantidad) throw new Error("Stock insuficiente en origen");
            prodSheet.getRange(sourceRow, cantIdx_P + 1).setValue(sStock - cantidad);
            
            if (destRow === -1) {
                // Duplicate row to new warehouse
                const newRow_P = [...prodData[sourceRow - 1]];
                newRow_P[almIdx_P] = data.almacenDestino;
                newRow_P[cantIdx_P] = cantidad;
                newRow_P[usoIdx_P] = 0;
                // Update Entry Date
                const dateIdx_P = findColumnIndices(prodSheet, { DATE: ['FECHA_INGRESO'] }).DATE;
                if (dateIdx_P !== -1) newRow_P[dateIdx_P] = formatDate(new Date());
                prodSheet.appendRow(newRow_P);
            } else {
                const dStock = Number(prodData[destRow - 1][cantIdx_P]) || 0;
                prodSheet.getRange(destRow, cantIdx_P + 1).setValue(dStock + cantidad);
            }
        }

        // Add Movement Record
        const maxIdxM = Math.max(...Object.values(colMapMov), 12);
        const newRowM = Array(maxIdxM + 1).fill('');
        
        const setValM = (key, fallbackIdx, val) => {
            const idx = colMapMov[key] !== -1 ? colMapMov[key] : fallbackIdx;
            if (idx !== -1) newRowM[idx] = val;
        };

        const movId = 'MOV-' + new Date().getTime();
        setValM('ID', COLUMNS.MOVIMIENTOS_ALMACEN.ID, movId);
        setValM('PROD_ID', COLUMNS.MOVIMIENTOS_ALMACEN.PRODUCTO_ID, targetProdId);
        setValM('TIPO', COLUMNS.MOVIMIENTOS_ALMACEN.TIPO, data.tipo);
        setValM('ALM_ORIGEN', COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_ORIGEN, tipo === 'entrada' ? '' : targetAlmId);
        setValM('ALM_DESTINO', COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_DESTINO, (tipo === 'salida' || tipo === 'baja') ? '' : (data.almacenDestino || targetAlmId));
        setValM('CANTIDAD', COLUMNS.MOVIMIENTOS_ALMACEN.CANTIDAD, cantidad);
        setValM('FECHA', COLUMNS.MOVIMIENTOS_ALMACEN.FECHA, formatDateTime(new Date()));
        setValM('RESPONSABLE', COLUMNS.MOVIMIENTOS_ALMACEN.RESPONSABLE, data.responsable);
        setValM('GUIA', COLUMNS.MOVIMIENTOS_ALMACEN.GUIA_REFERENCIA, data.guiaReferencia || '');
        setValM('MOTIVO', COLUMNS.MOVIMIENTOS_ALMACEN.MOTIVO, data.motivo || '');
        setValM('PROVEEDOR', COLUMNS.MOVIMIENTOS_ALMACEN.PROVEEDOR_TRANSPORTE, data.proveedorTransporte || data.proveedor || '');
        setValM('OBSERVACIONES', COLUMNS.MOVIMIENTOS_ALMACEN.OBSERVACIONES, data.observaciones || '');
        setValM('FECHA_DEVOLUCION', 12, data.fechaDevolucion ? formatDate(data.fechaDevolucion) : '');

        sheet.appendRow(newRowM);
        const actionMsg = `Movimiento de ${tipo.toUpperCase()}: ${cantidad} ${data.unidad || ''} de ${data.productoNombre || targetProdId}`;
        registrarAccion('Almacenes', 'movimiento', actionMsg, 'info', data.responsable);
        return createResponse(true, { id: movId, ...data });
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function deleteMovimiento(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const colMap = getMovimientosColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.MOVIMIENTOS_ALMACEN.ID;
        const data = sheet.getDataRange().getValues();
        const targetId = String(id).trim();

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][idIdx]).trim() === targetId) {
                sheet.deleteRow(i + 1);
                return createResponse(true, { message: "Movimiento eliminado" });
            }
        }
        throw new Error("Movimiento no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

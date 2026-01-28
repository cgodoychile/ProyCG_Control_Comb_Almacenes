/**
 * CRUD OPERATIONS: MOVIMIENTOS_ALMACEN
 * Refactored to use corrected column mapping (L=11, M=12).
 */

function handleMovimientosGet(action, id, almacenId) {
  switch (action.toLowerCase()) {
    case 'getall': return almacenId ? getMovimientosByAlmacen(almacenId) : getAllMovimientos();
    case 'getbyid': return getMovimientoById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleMovimientosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createMovimiento(data);
    case 'delete': return deleteMovimiento(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllMovimientos() {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const col = COLUMNS.MOVIMIENTOS_ALMACEN;
        const productMap = fetchProductNamesMap();

        const movimientos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row[col.ID]) continue;
            movimientos.push(mapRowToMovimiento(row, col, productMap));
        }
        return createResponse(true, movimientos);
    } catch (error) {
        return createErrorResponse(error.toString());
    }
}

function getMovimientosByAlmacen(almacenId) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const col = COLUMNS.MOVIMIENTOS_ALMACEN;
        const productMap = fetchProductNamesMap();
        const targetId = String(almacenId).trim();

        const movimientos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row[col.ID]) continue;
            
            const isOrigin = String(row[col.ALMACEN_ORIGEN]).trim() === targetId;
            const isDestination = String(row[col.ALMACEN_DESTINO]).trim() === targetId;
            
            if (isOrigin || isDestination) {
                movimientos.push(mapRowToMovimiento(row, col, productMap));
            }
        }
        return createResponse(true, movimientos);
    } catch (error) {
        return createErrorResponse(error.toString());
    }
}

function getMovimientoById(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        const col = COLUMNS.MOVIMIENTOS_ALMACEN;
        const targetId = String(id).trim();
        
        const row = data.find(r => String(r[col.ID]).trim() === targetId);
        if (!row) return createErrorResponse("Movimiento no encontrado", 404);
        
        const productMap = fetchProductNamesMap();
        return createResponse(true, mapRowToMovimiento(row, col, productMap));
    } catch (error) {
        return createErrorResponse(error.toString());
    }
}

function mapRowToMovimiento(row, col, productMap) {
    const prodId = String(row[col.PRODUCTO_ID] || '').trim();
    return {
        id: row[col.ID],
        productoId: prodId,
        productoNombre: productMap[prodId] || 'Producto desconocido',
        tipo: row[col.TIPO],
        almacenOrigen: row[col.ALMACEN_ORIGEN],
        almacenDestino: row[col.ALMACEN_DESTINO],
        cantidad: row[col.CANTIDAD],
        fecha: formatDate(row[col.FECHA]),
        responsable: row[col.RESPONSABLE],
        guiaReferencia: row[col.GUIA_REFERENCIA],
        motivo: row[col.MOTIVO],
        proveedorTransporte: row[col.PROVEEDOR_TRANSPORTE],
        observaciones: row[col.OBSERVACIONES],
        fechaDevolucion: row[col.FECHA_DEVOLUCION] ? formatDate(row[col.FECHA_DEVOLUCION]) : ''
    };
}

function createMovimiento(data) {
    try {
        const sheetM = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const sheetP = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const colM = COLUMNS.MOVIMIENTOS_ALMACEN;
        const colP = COLUMNS.PRODUCTOS_ALMACEN;

        const prodData = sheetP.getDataRange().getValues();
        const tipo = String(data.tipo).toLowerCase();
        const cantidad = Number(data.cantidad) || 0;
        const tProdId = String(data.productoId).trim();
        const tAlmOrg = String(data.almacenOrigen || data.almacenId || '').trim();
        const tAlmDst = String(data.almacenDestino || '').trim();

        if (cantidad <= 0) throw new Error("Cantidad inválida");

        let sRow = -1, dRow = -1;

        // Localizar filas
        for (let i = 1; i < prodData.length; i++) {
            if (String(prodData[i][colP.ID]).trim() === tProdId) {
                if (String(prodData[i][colP.ALMACEN_ID]).trim() === tAlmOrg) sRow = i + 1;
                if (String(prodData[i][colP.ALMACEN_ID]).trim() === tAlmDst) dRow = i + 1;
            }
        }

        // LÓGICA DE ACTUALIZACIÓN DE STOCK
        if (tipo === 'entrada') {
            const targetRow = dRow !== -1 ? dRow : sRow;
            if (targetRow === -1) throw new Error("Producto no encontrado en bodega. Debe crearlo primero.");
            const sStock = Number(prodData[targetRow-1][colP.CANTIDAD]) || 0;
            sheetP.getRange(targetRow, colP.CANTIDAD + 1).setValue(sStock + cantidad);
        } 
        else if (tipo === 'salida') {
            if (sRow === -1) throw new Error("Stock insuficiente en la bodega de origen.");
            const sStock = Number(prodData[sRow-1][colP.CANTIDAD]) || 0;
            const sUso = Number(prodData[sRow-1][colP.EN_USO]) || 0;
            if (sStock < cantidad) throw new Error("Stock disponible insuficiente.");
            
            sheetP.getRange(sRow, colP.CANTIDAD + 1).setValue(sStock - cantidad);
            
            const isTracked = checkBoolean(prodData[sRow-1][colP.ES_RETORNABLE]) || checkBoolean(prodData[sRow-1][colP.ES_ACTIVO]) || !!data.fechaDevolucion;
            if (isTracked) sheetP.getRange(sRow, colP.EN_USO + 1).setValue(sUso + cantidad);
        } 
        else if (tipo === 'retorno') {
            if (sRow === -1) throw new Error("Producto no encontrado.");
            const sStock = Number(prodData[sRow-1][colP.CANTIDAD]) || 0;
            const sUso = Number(prodData[sRow-1][colP.EN_USO]) || 0;
            sheetP.getRange(sRow, colP.CANTIDAD + 1).setValue(sStock + cantidad);
            sheetP.getRange(sRow, colP.EN_USO + 1).setValue(Math.max(0, sUso - cantidad));
        } 
        else if (tipo === 'traslado') {
            if (sRow === -1) throw new Error("Sin existencias en la bodega de origen.");
            const sStock = Number(prodData[sRow-1][colP.CANTIDAD]) || 0;
            if (sStock < cantidad) throw new Error("Stock insuficiente en origen.");
            
            sheetP.getRange(sRow, colP.CANTIDAD + 1).setValue(sStock - cantidad);
            
            if (dRow !== -1) {
                const dStock = Number(prodData[dRow-1][colP.CANTIDAD]) || 0;
                sheetP.getRange(dRow, colP.CANTIDAD + 1).setValue(dStock + cantidad);
            } else {
                let newRP = [...prodData[sRow-1]];
                newRP[colP.ALMACEN_ID] = tAlmDst;
                newRP[colP.CANTIDAD] = cantidad;
                newRP[colP.EN_USO] = 0;
                sheetP.appendRow(newRP);
            }
        }

        // GUARDAR MOVIMIENTO
        const movId = generateSequentialId('MOV', SHEET_NAMES.MOVIMIENTOS_ALMACEN, 'ID', 8);
        const rowM = Array(15).fill('');
        rowM[colM.ID] = movId;
        rowM[colM.PRODUCTO_ID] = tProdId;
        rowM[colM.TIPO] = data.tipo;
        rowM[colM.ALMACEN_ORIGEN] = tAlmOrg;
        rowM[colM.ALMACEN_DESTINO] = tAlmDst;
        rowM[colM.CANTIDAD] = cantidad;
        rowM[colM.FECHA] = new Date();
        rowM[colM.RESPONSABLE] = data.responsable;
        rowM[colM.GUIA_REFERENCIA] = data.guiaReferencia || '';
        rowM[colM.MOTIVO] = data.motivo || '';
        rowM[colM.PROVEEDOR_TRANSPORTE] = data.proveedorTransporte || '';
        rowM[colM.OBSERVACIONES] = data.observaciones || '';
        rowM[colM.FECHA_DEVOLUCION] = data.fechaDevolucion ? formatDate(data.fechaDevolucion) : '';

        sheetM.appendRow(rowM);
        
        registrarAccion('Almacenes', 'movimiento', `Registro de ${tipo}: ${cantidad} de ${tProdId}`, 'info', data.responsable, data.motivo);
        
        return createResponse(true, { id: movId });
    } catch (e) {
        return createErrorResponse(e.toString());
    }
}

function deleteMovimiento(id, data) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const dataRows = sheet.getDataRange().getValues();
        const col = COLUMNS.MOVIMIENTOS_ALMACEN;
        const targetId = String(id).trim();

        for (let i = 1; i < dataRows.length; i++) {
            if (String(dataRows[i][col.ID]).trim() === targetId) {
                sheet.deleteRow(i + 1);
                registrarAccion('Almacenes', 'eliminar_movimiento', `Movimiento ${id} eliminado`, 'warning', null, data ? data.justificacion : null);
                return createResponse(true, { message: "Movimiento eliminado" });
            }
        }
        throw new Error("Movimiento no encontrado");
    } catch (e) {
        return createErrorResponse(e.toString());
    }
}

function fetchProductNamesMap() {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        const col = COLUMNS.PRODUCTOS_ALMACEN;
        const map = {};
        for (let i = 1; i < data.length; i++) {
            const id = String(data[i][col.ID]).trim();
            if (id) map[id] = data[i][col.NOMBRE];
        }
        return map;
    } catch (e) { return {}; }
}

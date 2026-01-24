/**
 * CRUD OPERATIONS: PRODUCTOS_ALMACEN
 * Refactored to use fully dynamic column mapping.
 */

function handleProductosGet(action, id, almacenId) {
  switch (action.toLowerCase()) {
    case 'getall': return almacenId ? getAllProductosByAlmacen(almacenId) : getAllProductos();
    case 'getbyid': return getProductoById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleProductosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createProducto(data);
    case 'update': return updateProducto(id, data);
    case 'delete': return deleteProducto(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

/**
 * Helper to get column mapping for PRODUCTOS_ALMACEN
 */
function getProductosColMap(sheet) {
  return findColumnIndices(sheet, {
    ID: ['ID', 'ID_PRODUCTO', 'CODIGO'],
    ALMACEN_ID: ['ALMACEN_ID', 'ID_ALMACEN'],
    NOMBRE: ['NOMBRE', 'NOMBRE_PRODUCTO'],
    CATEGORIA: ['CATEGORIA'],
    CANTIDAD: ['CANTIDAD', 'STOCK'],
    UNIDAD: ['UNIDAD', 'MEDIDA'],
    STOCK_MIN: ['STOCK_MINIMO', 'MINIMO'],
    VALOR: ['VALOR_UNITARIO', 'PRECIO', 'VALOR'],
    FECHA: ['FECHA_INGRESO', 'FECHA'],
    PROVEEDOR: ['PROVEEDOR_PRINCIPAL', 'PROVEEDOR'],
    ESTADO: ['ESTADO'],
    RETORNABLE: ['RETORNABLE', 'ES_RETORNABLE'],
    EN_USO: ['EN_USO', 'CANTIDAD_EN_USO', 'EN USO'],
    ACTIVO: ['ES_ACTIVO', 'ACTIVO'],
    DESCRIPCION: ['DESCRIPCION', 'DETALLE']
  });
}

function getAllProductosByAlmacen(almacenId) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const colMap = getProductosColMap(sheet);

        const productos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const almIdx = colMap.ALMACEN_ID !== -1 ? colMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
            
            if (!row[idIdx]) continue;
            if (almacenId && String(row[almIdx]).trim() !== String(almacenId).trim()) continue;
            
            productos.push(mapRowToProducto(row, colMap));
        }
        return createResponse(true, productos);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function getAllProductos() {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return createResponse(true, []);
        
        const colMap = getProductosColMap(sheet);

        const productos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
            if (!row[idIdx]) continue;
            
            productos.push(mapRowToProducto(row, colMap));
        }
        return createResponse(true, productos);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function getProductoById(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        const colMap = getProductosColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][idIdx]).trim() === String(id).trim()) {
                return createResponse(true, mapRowToProducto(data[i], colMap));
            }
        }
        return createErrorResponse("Producto no encontrado", 404);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function mapRowToProducto(row, colMap) {
    const getVal = (key, fallbackIdx) => {
        const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
        return row[idx];
    };

    return {
        id: getVal('ID', COLUMNS.PRODUCTOS_ALMACEN.ID),
        almacenId: getVal('ALMACEN_ID', COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID),
        nombre: getVal('NOMBRE', COLUMNS.PRODUCTOS_ALMACEN.NOMBRE),
        categoria: getVal('CATEGORIA', COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA),
        cantidad: Number(String(getVal('CANTIDAD', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD) || '0').replace(/[^0-9.]/g, '')) || 0,
        unidad: String(getVal('UNIDAD', COLUMNS.PRODUCTOS_ALMACEN.UNIDAD) || ''),
        stockMinimo: Number(String(getVal('STOCK_MIN', COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO) || '0').replace(/[^0-9.]/g, '')) || 0,
        valorUnitario: Number(String(getVal('VALOR', COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO) || '0').replace(/[^0-9.]/g, '')) || 0,
        fechaIngreso: getVal('FECHA', COLUMNS.PRODUCTOS_ALMACEN.FECHA_INGRESO),
        proveedorPrincipal: getVal('PROVEEDOR', COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL),
        estado: getVal('ESTADO', COLUMNS.PRODUCTOS_ALMACEN.ESTADO),
        esRetornable: checkBoolean(getVal('RETORNABLE', COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE)),
        cantidadEnUso: Number(getVal('EN_USO', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO) || 0),
        esActivo: checkBoolean(getVal('ACTIVO', COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO)),
        descripcion: String(getVal('DESCRIPCION', COLUMNS.PRODUCTOS_ALMACEN.DESCRIPCION) || '')
    };
}

function createProducto(data) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const colMap = getProductosColMap(sheet);
        
        if (!data.id && data.categoria) {
            data.id = generateProductCode(data.categoria);
        } else if (!data.id) {
            data.id = 'PRD-' + new Date().getTime();
        }

        // Determinar longitud necesaria (al menos el indice más alto en colMap + 1)
        const maxIdx = Math.max(...Object.values(colMap), 14);
        const newRow = Array(maxIdx + 1).fill('');
        
        const setVal = (key, fallbackIdx, val) => {
            const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
            if (idx !== -1) newRow[idx] = val;
        };

        setVal('ID', COLUMNS.PRODUCTOS_ALMACEN.ID, data.id);
        setVal('ALMACEN_ID', COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID, data.almacenId);
        setVal('NOMBRE', COLUMNS.PRODUCTOS_ALMACEN.NOMBRE, data.nombre);
        setVal('CATEGORIA', COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA, data.categoria);
        setVal('CANTIDAD', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD, Number(data.cantidad) || 0);
        setVal('UNIDAD', COLUMNS.PRODUCTOS_ALMACEN.UNIDAD, String(data.unidad || '').trim());
        setVal('STOCK_MIN', COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO, Number(data.stockMinimo) || 0);
        setVal('VALOR', COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO, Number(data.valorUnitario) || 0);
        setVal('FECHA', COLUMNS.PRODUCTOS_ALMACEN.FECHA_INGRESO, formatDate(new Date()));
        setVal('PROVEEDOR', COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL, String(data.proveedorPrincipal || '').trim());
        setVal('ESTADO', COLUMNS.PRODUCTOS_ALMACEN.ESTADO, data.estado || 'Activo');
        
        const isRet = checkBoolean(data.esRetornable);
        setVal('RETORNABLE', COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE, isRet ? 'TRUE' : 'FALSE');
        
        const isAct = checkBoolean(data.esActivo);
        setVal('ACTIVO', COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO, isAct ? 'TRUE' : 'FALSE');
        
        setVal('DESCRIPCION', COLUMNS.PRODUCTOS_ALMACEN.DESCRIPCION, String(data.descripcion || '').trim());
        setVal('EN_USO', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO, 0);

        sheet.appendRow(newRow);
        
        // Audit
        registrarAccion('Almacenes', 'crear', `Nuevo producto: ${data.nombre} (ID: ${data.id})`, 'success', data.responsable);
        return createResponse(true, { id: data.id, ...data });
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function updateProducto(id, data) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const colMap = getProductosColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
        const almIdx = colMap.ALMACEN_ID !== -1 ? colMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
        
        const rows = sheet.getDataRange().getValues();
        const targetId = String(id).trim();
        const targetAlm = data.almacenId ? String(data.almacenId).trim() : null;

        for (let i = 1; i < rows.length; i++) {
            const rowId = String(rows[i][idIdx]).trim();
            const rowAlm = String(rows[i][almIdx]).trim();

            if (rowId === targetId && (!targetAlm || rowAlm === targetAlm)) {
                const rowNum = i + 1;
                
                const updateField = (key, fallbackIdx, val) => {
                    if (val === undefined || val === null) return;
                    const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
                    if (idx !== -1) sheet.getRange(rowNum, idx + 1).setValue(val);
                };

                updateField('NOMBRE', COLUMNS.PRODUCTOS_ALMACEN.NOMBRE, data.nombre);
                updateField('CATEGORIA', COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA, data.categoria);
                updateField('CANTIDAD', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD, data.cantidad !== undefined ? Number(data.cantidad) : undefined);
                updateField('UNIDAD', COLUMNS.PRODUCTOS_ALMACEN.UNIDAD, data.unidad);
                updateField('STOCK_MIN', COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO, data.stockMinimo !== undefined ? Number(data.stockMinimo) : undefined);
                updateField('VALOR', COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO, data.valorUnitario !== undefined ? Number(data.valorUnitario) : undefined);
                updateField('PROVEEDOR', COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL, data.proveedorPrincipal);
                updateField('ESTADO', COLUMNS.PRODUCTOS_ALMACEN.ESTADO, data.estado);
                
                if (data.esRetornable !== undefined) {
                    updateField('RETORNABLE', COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE, checkBoolean(data.esRetornable) ? 'TRUE' : 'FALSE');
                }
                updateField('EN_USO', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO, data.cantidadEnUso !== undefined ? Number(data.cantidadEnUso) : undefined);
                
                if (data.esActivo !== undefined) {
                    updateField('ACTIVO', COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO, checkBoolean(data.esActivo) ? 'TRUE' : 'FALSE');
                }
                updateField('DESCRIPCION', COLUMNS.PRODUCTOS_ALMACEN.DESCRIPCION, data.descripcion);

                SpreadsheetApp.flush();
                registrarAccion('Almacenes', 'actualizar', `Producto actualizado: ${data.nombre || targetId} (ID: ${targetId})`, 'info', data.responsable);
                return createResponse(true, { id, ...data });
            }
        }
        throw new Error("Producto no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function deleteProducto(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const colMap = getProductosColMap(sheet);
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
        const data = sheet.getDataRange().getValues();
        const targetId = String(id).trim();

        for (let i = 1; i < data.length; i++) {
            if (String(data[i][idIdx]).trim() === targetId) {
                const nombreIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.PRODUCTOS_ALMACEN.NOMBRE;
                const nombre = data[i][nombreIdx];
                sheet.deleteRow(i + 1);
                
                registrarAccion('Almacenes', 'eliminar', `Producto eliminado: ${nombre} (${id})`, 'warning', null);
                createAlerta('warning', `Producto eliminado: ${nombre}`, 'Almacenes', 'eliminar');
                return createResponse(true, { message: "Producto eliminado" });
            }
        }
        throw new Error("Producto no encontrado (ID: " + id + ")");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

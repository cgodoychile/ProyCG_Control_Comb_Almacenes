/**
 * CRUD OPERATIONS: ALMACENES
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

function getAllAlmacenes() {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const data = sheet.getDataRange().getValues();
        
        if (data.length <= 1) return createResponse(true, []);
        
        // Fetch all products once to avoid multiple sheet reads
        const productosSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const productosData = productosSheet.getDataRange().getValues();
        
        // DYNAMIC COLUMN MAPPING
        const colMap = findColumnIndices(sheet, {
            ID: ['ID', 'ID_ALMACEN', 'ALMACEN_ID'],
            NOMBRE: ['NOMBRE', 'NOMBRE_ALMACEN'],
            UBICACION: ['UBICACION'],
            RESPONSABLE: ['RESPONSABLE', 'ENCARGADO'],
            FECHA_CREACION: ['FECHA_CREACION', 'CREADO'],
            ESTADO: ['ESTADO']
        });

        // Also map products sheet dynamically just in case
        const prodColMap = findColumnIndices(productosSheet, {
           ALMACEN_ID: ['ALMACEN_ID', 'ID_ALMACEN'],
           CANTIDAD: ['CANTIDAD', 'STOCK'],
           EN_USO: ['EN USO', 'CANTIDAD_EN_USO', 'EN_USO'],
           STOCK_MIN: ['STOCK_MINIMO', 'MINIMO'],
           VALOR: ['VALOR_UNITARIO', 'PRECIO']
        });

        const almacenes = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ALMACENES.ID;
            const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.ALMACENES.NOMBRE;
            const ubIdx = colMap.UBICACION !== -1 ? colMap.UBICACION : COLUMNS.ALMACENES.UBICACION;
            const rspIdx = colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.ALMACENES.RESPONSABLE;
            const fcIdx = colMap.FECHA_CREACION !== -1 ? colMap.FECHA_CREACION : COLUMNS.ALMACENES.FECHA_CREACION;
            const estIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.ALMACENES.ESTADO;

            const almacenId = row[idIdx];
            if (!almacenId) continue;
            
            let totalProductos = 0;
            let alertasStock = 0;
            let valorInventario = 0;
            
            // Dynamic indices for Products
            const pAlmIdx = prodColMap.ALMACEN_ID !== -1 ? prodColMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
            const pCantIdx = prodColMap.CANTIDAD !== -1 ? prodColMap.CANTIDAD : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD;
            const pUsoIdx = prodColMap.EN_USO !== -1 ? prodColMap.EN_USO : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO;
            const pMinIdx = prodColMap.STOCK_MIN !== -1 ? prodColMap.STOCK_MIN : COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO;
            const pValIdx = prodColMap.VALOR !== -1 ? prodColMap.VALOR : COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO;

            for (let j = 1; j < productosData.length; j++) {
                const prodAlmacenId = String(productosData[j][pAlmIdx] || '').trim();
                const currentAlmacenId = String(almacenId).trim();
                
                if (prodAlmacenId === currentAlmacenId) {
                    totalProductos++;
                    let cantidadRaw = productosData[j][pCantIdx];
                    
                    const parseVal = (val) => {
                      if (val === undefined || val === null || val === '') return 0;
                      if (typeof val === 'number') return val;
                      const cleaned = String(val).replace(/[^0-9,]/g, '').replace(',', '.');
                      return parseFloat(cleaned) || 0;
                    };

                    const cantidad = parseVal(cantidadRaw);
                    const cantidadEnUso = parseVal(productosData[j][pUsoIdx]);
                    const stockMinimo = parseVal(productosData[j][pMinIdx]);
                    const valorUnitario = parseVal(productosData[j][pValIdx]);
                    
                    valorInventario += ((cantidad + cantidadEnUso) * valorUnitario);
                    
                    if (cantidad < stockMinimo) {
                        alertasStock++;
                    }
                }
            }
            
            almacenes.push({
                id: almacenId,
                nombre: row[nmIdx],
                ubicacion: row[ubIdx],
                responsable: row[rspIdx],
                fechaCreacion: row[fcIdx],
                estado: row[estIdx],
                totalProductos: totalProductos,
                alertasStock: alertasStock,
                valorInventario: Number(valorInventario.toFixed(2))
            });
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
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][COLUMNS.ALMACENES.ID] == id) {
                const row = data[i];
                return createResponse(true, {
                    id: row[COLUMNS.ALMACENES.ID],
                    nombre: row[COLUMNS.ALMACENES.NOMBRE],
                    ubicacion: row[COLUMNS.ALMACENES.UBICACION],
                    responsable: row[COLUMNS.ALMACENES.RESPONSABLE],
                    fechaCreacion: row[COLUMNS.ALMACENES.FECHA_CREACION],
                    estado: row[COLUMNS.ALMACENES.ESTADO]
                });
            }
        }
        return createErrorResponse("Almacén no encontrado", 404);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function createAlmacen(data) {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        
        const newRow = Array(6).fill('');
        newRow[COLUMNS.ALMACENES.ID] = data.id || 'ALM-' + new Date().getTime();
        newRow[COLUMNS.ALMACENES.NOMBRE] = data.nombre;
        newRow[COLUMNS.ALMACENES.UBICACION] = data.ubicacion;
        newRow[COLUMNS.ALMACENES.RESPONSABLE] = data.responsable;
        newRow[COLUMNS.ALMACENES.FECHA_CREACION] = data.fechaCreacion || new Date().toISOString();
        newRow[COLUMNS.ALMACENES.ESTADO] = data.estado || 'activo';
        
        sheet.appendRow(newRow);
        
        // Audit Log
        registrarAccion('Almacenes', 'crear', `Nuevo almacén creado: ${data.nombre} (${data.ubicacion})`, 'success', data.responsable);
        
        return createResponse(true, { id: newRow[COLUMNS.ALMACENES.ID], ...data });
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function updateAlmacen(id, data) {
    try {
        const sheet = getSheet(SHEET_NAMES.ALMACENES);
        const values = sheet.getDataRange().getValues();
        
        for (let i = 1; i < values.length; i++) {
            if (values[i][COLUMNS.ALMACENES.ID] == id) {
                const row = i + 1;
                if (data.nombre !== undefined) sheet.getRange(row, COLUMNS.ALMACENES.NOMBRE + 1).setValue(data.nombre);
                if (data.ubicacion !== undefined) sheet.getRange(row, COLUMNS.ALMACENES.UBICACION + 1).setValue(data.ubicacion);
                if (data.responsable !== undefined) sheet.getRange(row, COLUMNS.ALMACENES.RESPONSABLE + 1).setValue(data.responsable);
                if (data.estado !== undefined) sheet.getRange(row, COLUMNS.ALMACENES.ESTADO + 1).setValue(data.estado);
                
                // Audit Log
                registrarAccion('Almacenes', 'actualizar', `Almacén actualizado: ${id} (${data.nombre || values[i][COLUMNS.ALMACENES.NOMBRE]})`, 'info', data.responsable);
                
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
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
            const rowId = String(data[i][COLUMNS.ALMACENES.ID]).trim();
            const targetId = String(id).trim();
            
            if (rowId === targetId) {
                const nombreAlmacen = data[i][COLUMNS.ALMACENES.NOMBRE];
                sheet.deleteRow(i + 1);
                
                // Audit Log
                registrarAccion('Almacenes', 'eliminar', `Almacén eliminado: ${nombreAlmacen} (${id})`, 'warning', null);
                
                return createResponse(true, { message: "Almacén eliminado" });
            }
        }
        throw new Error("Almacén no encontrado (ID: " + id + ")");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

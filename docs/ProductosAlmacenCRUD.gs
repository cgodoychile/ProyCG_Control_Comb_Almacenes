/**
 * CRUD OPERATIONS: PRODUCTOS_ALMACEN
 */

function handleProductosGet(action, id, almacenId) {
  switch (action.toLowerCase()) {
    case 'getall': return almacenId ? getAllProductosByAlmacen(almacenId) : createErrorResponse('almacenId requerido', 400);
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

function getAllProductosByAlmacen(almacenId) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        
        if (data.length <= 1) return createResponse(true, []);
        
        // DYNAMIC COLUMN MAPPING
        const colMap = findColumnIndices(sheet, {
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
            ACTIVO: ['ES_ACTIVO', 'ACTIVO']
        });

        const productos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;
            const almIdx = colMap.ALMACEN_ID !== -1 ? colMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
            
            if (!row[idIdx]) continue;
            // Check Warehouse ID Filter
            if (almacenId && row[almIdx] != almacenId) continue;
            
            const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : COLUMNS.PRODUCTOS_ALMACEN.NOMBRE;
            const catIdx = colMap.CATEGORIA !== -1 ? colMap.CATEGORIA : COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA;
            const cantIdx = colMap.CANTIDAD !== -1 ? colMap.CANTIDAD : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD;
            const unIdx = colMap.UNIDAD !== -1 ? colMap.UNIDAD : COLUMNS.PRODUCTOS_ALMACEN.UNIDAD;
            const minIdx = colMap.STOCK_MIN !== -1 ? colMap.STOCK_MIN : COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO;
            const valIdx = colMap.VALOR !== -1 ? colMap.VALOR : COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO;
            const fecIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.PRODUCTOS_ALMACEN.FECHA_INGRESO;
            const prvIdx = colMap.PROVEEDOR !== -1 ? colMap.PROVEEDOR : COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL;
            const estIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : COLUMNS.PRODUCTOS_ALMACEN.ESTADO;
            const retIdx = colMap.RETORNABLE !== -1 ? colMap.RETORNABLE : COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE;
            const usoIdx = colMap.EN_USO !== -1 ? colMap.EN_USO : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO;
            const actIdx = colMap.ACTIVO !== -1 ? colMap.ACTIVO : COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO;

            productos.push({
                id: row[idIdx],
                almacenId: row[almIdx],
                nombre: row[nmIdx],
                categoria: row[catIdx],
                cantidad: Number(String(row[cantIdx] || '0').replace(/[^0-9.]/g, '')) || 0,
                unidad: String(row[unIdx] || ''),
                stockMinimo: Number(String(row[minIdx] || '0').replace(/[^0-9.]/g, '')) || 0,
                valorUnitario: Number(String(row[valIdx] || '0').replace(/[^0-9.]/g, '')) || 0,
                fechaIngreso: row[fecIdx],
                proveedorPrincipal: row[prvIdx],
                estado: row[estIdx],
                esRetornable: checkBoolean(row[retIdx]),
                cantidadEnUso: Number(row[usoIdx] || 0),
                esActivo: checkBoolean(row[actIdx])
            });
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
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][COLUMNS.PRODUCTOS_ALMACEN.ID] == id) {
                const row = data[i];
                return createResponse(true, {
                    id: row[COLUMNS.PRODUCTOS_ALMACEN.ID],
                    almacenId: row[COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID],
                    nombre: row[COLUMNS.PRODUCTOS_ALMACEN.NOMBRE],
                    categoria: row[COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA],
                    cantidad: row[COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD],
                    unidad: row[COLUMNS.PRODUCTOS_ALMACEN.UNIDAD],
                    stockMinimo: row[COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO],
                    valorUnitario: row[COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO],
                    fechaIngreso: row[COLUMNS.PRODUCTOS_ALMACEN.FECHA_INGRESO],
                    proveedorPrincipal: row[COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL],
                    estado: row[COLUMNS.PRODUCTOS_ALMACEN.ESTADO],
                    esRetornable: checkBoolean(row[COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE]),
                    cantidadEnUso: Number(row[COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO] || 0),
                    esActivo: checkBoolean(row[COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO])
                });
            }
        }
        return createErrorResponse("Producto no encontrado", 404);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function generateProductCode(categoria) {
  const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
  const data = sheet.getDataRange().getValues();
  
  const prefixMap = {
    'Herramientas': 'HER',
    'Repuestos': 'REP',
    'EPP': 'EPP',
    'Lubricantes': 'LUB',
    'Consumibles': 'CON',
    'Ferretería': 'FER',
    'Otros': 'OTR'
  };
  
  const prefix = prefixMap[categoria] || 'PRD';
  
  let maxNumber = 0;
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][COLUMNS.PRODUCTOS_ALMACEN.ID] || '');
    if (id.startsWith('PRD-' + prefix + '-')) {
      const parts = id.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2]);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  
  const newNumber = String(maxNumber + 1).padStart(3, '0');
  return 'PRD-' + prefix + '-' + newNumber;
}

function createProducto(data) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        
        if (!data.id && data.categoria) {
            data.id = generateProductCode(data.categoria);
        } else if (!data.id) {
            data.id = 'PRD-' + new Date().getTime();
        }

        const newRow = Array(14).fill(''); 
        newRow[COLUMNS.PRODUCTOS_ALMACEN.ID] = data.id;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID] = data.almacenId;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.NOMBRE] = data.nombre;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA] = data.categoria;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD] = Number(data.cantidad) || 0;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.UNIDAD] = String(data.unidad || '').trim();
        newRow[COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO] = Number(data.stockMinimo) || 0;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO] = Number(data.valorUnitario) || 0;
        newRow[COLUMNS.PRODUCTOS_ALMACEN.FECHA_INGRESO] = formatDate(new Date());
        newRow[COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL] = String(data.proveedorPrincipal || data.proveedor || data.proveedorNombre || '').trim();
        newRow[COLUMNS.PRODUCTOS_ALMACEN.ESTADO] = data.estado || 'Activo';
        // Mapeo explicito de booleanos
        const rawRetornable = String(data.esRetornable || '').toUpperCase();
        newRow[COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE] = (rawRetornable === 'TRUE' || rawRetornable === 'ON' || data.esRetornable === true) ? 'TRUE' : 'FALSE';
        
        const rawActivo = String(data.esActivo || '').toUpperCase();
        newRow[COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO] = (rawActivo === 'TRUE' || rawActivo === 'ON' || data.esActivo === true) ? 'TRUE' : 'FALSE';
        
        sheet.appendRow(newRow);
        
        // Audit Log & Alerts - SAFE GUARD
        const msg = `Nuevo producto registrado: ${data.nombre} (ID: ${newRow[COLUMNS.PRODUCTOS_ALMACEN.ID]}, Cantidad: ${data.cantidad})`;
        try {
            if (typeof registrarAccion !== 'undefined') {
                registrarAccion('Almacenes', 'crear', msg, 'success', data.responsable || null);
            } else {
                Logger.log('ADVERTENCIA: registrarAccion no está definido en el contexto global.');
            }
        } catch (e) {
            Logger.log('Error al intentar registrar acción: ' + e.toString());
        }
        
        try {
             if (typeof createAlerta !== 'undefined') {
                createAlerta('success', `Nuevo producto registrado: ${data.nombre}`, 'Almacenes', 'crear');
             }
        } catch (e) {
             Logger.log('Error al crear alerta: ' + e.toString());
        }

        return createResponse(true, { id: newRow[COLUMNS.PRODUCTOS_ALMACEN.ID], ...data });
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function updateProducto(id, data) {
    try {
        const targetId = String(id || data.id || '').trim();
        const almId = String(data.almacenId || '').trim();
        Logger.log(`[!] ACTUALIZAR PRODUCTO: targetId='${targetId}' (len=${targetId.length}, codes=${Array.from(targetId).map(c => c.charCodeAt(0))}), almacen='${almId}'`);
        
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const rows = sheet.getDataRange().getValues();
        let found = false;
        
        for (let i = 1; i < rows.length; i++) {
            const rawId = rows[i][COLUMNS.PRODUCTOS_ALMACEN.ID];
            const rowId = String(rawId || '').trim();
            const rowAlm = String(rows[i][COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID] || '').trim();
            
            // Log de depuración para cada fila
            if (i < 5 || rowId === targetId) { // Log first 5 and the match
              Logger.log(`   [FILA ${i+1}] ID='${rowId}' (len=${rowId.length}, codes=${Array.from(rowId).map(c => c.charCodeAt(0))}), Alm='${rowAlm}'`);
              if (rowId === targetId) Logger.log(`   >> COINCIDENCIA DE ID ENCONTRADA!`);
            }
            
            // Match por ID. Si viene almacenId, validamos que coincida para evitar errores cruzados.
            if (rowId === targetId && (almId === "" || rowAlm === almId)) {
                const row = i + 1;
                found = true;
                Logger.log(`   -> [MATCH ENCONTRADO] Fila=${row}`);
                
                // Mapeo seguro de campos con validación de columna
                const updates = [
                  { col: COLUMNS.PRODUCTOS_ALMACEN.NOMBRE, val: data.nombre },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA, val: data.categoria },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD, val: data.cantidad !== undefined ? Number(data.cantidad) : undefined },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.UNIDAD, val: data.unidad },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO, val: data.stockMinimo !== undefined ? Number(data.stockMinimo) : undefined },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO, val: data.valorUnitario !== undefined ? Number(data.valorUnitario) : undefined },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL, val: data.proveedorPrincipal || data.proveedor },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.ESTADO, val: data.estado },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE, val: data.esRetornable !== undefined ? (checkBoolean(data.esRetornable) ? 'TRUE' : 'FALSE') : undefined },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO, val: data.cantidadEnUso !== undefined ? Number(data.cantidadEnUso) : undefined },
                  { col: COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO, val: data.esActivo !== undefined ? (checkBoolean(data.esActivo) ? 'TRUE' : 'FALSE') : undefined }
                ];

                updates.forEach(upd => {
                  const keyName = Object.keys(COLUMNS.PRODUCTOS_ALMACEN).find(k => COLUMNS.PRODUCTOS_ALMACEN[k] === upd.col) || 'DESCONOCIDA';
                  
                  if (upd.val !== undefined && upd.val !== null) {
                    if (typeof upd.col === 'number' && !isNaN(upd.col) && upd.col >= 0) {
                      const colIdx = upd.col + 1;
                      try {
                        sheet.getRange(row, colIdx).setValue(upd.val);
                      } catch (err) {
                        Logger.log(`   ❌ [ERROR ESCRITURA] Col=${colIdx} (${keyName}). Error: ${err.toString()}`);
                        throw new Error(`Fallo writing Col ${colIdx} (${keyName}): ${err.toString()}`);
                      }
                    }
                  }
                });
                
                SpreadsheetApp.flush();
                
                const logMsg = `Producto actualizado: ${data.nombre || rows[i][COLUMNS.PRODUCTOS_ALMACEN.NOMBRE]} (ID: ${targetId})`;
                if (typeof registrarAccion === 'function') {
                  registrarAccion('Almacenes', 'actualizar', logMsg, 'info', null);
                }
                
                return createResponse(true, { id: targetId, ...data });
            }
        }
        
        if (!found) {
            throw new Error(`Producto no encontrado (ID: ${targetId} en Almacén: ${almId || 'Cualquiera'})`);
        }
    } catch (error) {
        Logger.log(`❌ Error updateProducto: ${error.toString()}`);
        return createResponse(false, null, error.toString());
    }
}

function deleteProducto(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][COLUMNS.PRODUCTOS_ALMACEN.ID] == id) {
                const nombre = data[i][COLUMNS.PRODUCTOS_ALMACEN.NOMBRE];
                sheet.deleteRow(i + 1);
                
                // Audit Log
                registrarAccion('Almacenes', 'eliminar', `Producto eliminado: ${nombre} (${id})`, 'warning', null);
                
                createAlerta('warning', `Producto eliminado: ${nombre}`, 'Almacenes', 'eliminar');
                return createResponse(true, { message: "Producto eliminado" });
            }
        }
        throw new Error("Producto no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

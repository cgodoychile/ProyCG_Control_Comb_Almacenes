/**
 * CRUD OPERATIONS: MOVIMIENTOS_ALMACEN
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

function getAllMovimientos() {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        
        if (data.length <= 1) return createResponse(true, []);
        
        const movimientos = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            // DYNAMIC COLUMN MAPPING
            const colMap = findColumnIndices(sheet, {
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

            // Fallback indices
            const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.MOVIMIENTOS_ALMACEN.ID;
            const pIdIdx = colMap.PROD_ID !== -1 ? colMap.PROD_ID : COLUMNS.MOVIMIENTOS_ALMACEN.PRODUCTO_ID;
            const tipoIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.MOVIMIENTOS_ALMACEN.TIPO;
            const orgIdx = colMap.ALM_ORIGEN !== -1 ? colMap.ALM_ORIGEN : COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_ORIGEN;
            const destIdx = colMap.ALM_DESTINO !== -1 ? colMap.ALM_DESTINO : COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_DESTINO;
            const cantIdx = colMap.CANTIDAD !== -1 ? colMap.CANTIDAD : COLUMNS.MOVIMIENTOS_ALMACEN.CANTIDAD;
            const fecIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.MOVIMIENTOS_ALMACEN.FECHA;
            const rspIdx = colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.MOVIMIENTOS_ALMACEN.RESPONSABLE;
            const guiaIdx = colMap.GUIA !== -1 ? colMap.GUIA : COLUMNS.MOVIMIENTOS_ALMACEN.GUIA_REFERENCIA;
            const motIdx = colMap.MOTIVO !== -1 ? colMap.MOTIVO : COLUMNS.MOVIMIENTOS_ALMACEN.MOTIVO;
            const prvIdx = colMap.PROVEEDOR !== -1 ? colMap.PROVEEDOR : COLUMNS.MOVIMIENTOS_ALMACEN.PROVEEDOR_TRANSPORTE;
            const obsIdx = colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : COLUMNS.MOVIMIENTOS_ALMACEN.OBSERVACIONES;
            const fdevIdx = colMap.FECHA_DEVOLUCION !== -1 ? colMap.FECHA_DEVOLUCION : (COLUMNS.MOVIMIENTOS_ALMACEN.FECHA_DEVOLUCION || 12);

            const id = row[idIdx];
            if (!id) continue;
            
            // FILTRO DE SEGURIDAD
            const prodId = String(row[pIdIdx] || '');
            if (prodId.includes('T') && prodId.includes('Z') && prodId.length > 20) {
                Logger.log(`Omitiendo registro corrupto en fila ${i+1}: ProductoID parece una fecha.`);
                continue;
            }

            movimientos.push({
                id: id,
                productoId: prodId,
                tipo: row[tipoIdx],
                almacenOrigen: row[orgIdx],
                almacenDestino: row[destIdx],
                cantidad: row[cantIdx],
                fecha: row[fecIdx],
                responsable: row[rspIdx],
                guiaReferencia: row[guiaIdx],
                motivo: row[motIdx],
                proveedorTransporte: row[prvIdx],
                proveedorTransporte: row[prvIdx],
                observaciones: row[obsIdx],
                fechaDevolucion: row[fdevIdx]
            });
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
        
        const movimientos = [];
        const colMap = findColumnIndices(sheet, {
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
            FECHA_DEVOLUCION: ['FECHA_DEVOLUCION', 'DEVOLUCION_ESTIMADA']
        });

        // Fallback indices
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.MOVIMIENTOS_ALMACEN.ID;
        const pIdIdx = colMap.PROD_ID !== -1 ? colMap.PROD_ID : COLUMNS.MOVIMIENTOS_ALMACEN.PRODUCTO_ID;
        const tipoIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.MOVIMIENTOS_ALMACEN.TIPO;
        const orgIdx = colMap.ALM_ORIGEN !== -1 ? colMap.ALM_ORIGEN : COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_ORIGEN;
        const destIdx = colMap.ALM_DESTINO !== -1 ? colMap.ALM_DESTINO : COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_DESTINO;
        const cantIdx = colMap.CANTIDAD !== -1 ? colMap.CANTIDAD : COLUMNS.MOVIMIENTOS_ALMACEN.CANTIDAD;
        const fecIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.MOVIMIENTOS_ALMACEN.FECHA;
        const rspIdx = colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : COLUMNS.MOVIMIENTOS_ALMACEN.RESPONSABLE;
        const guiaIdx = colMap.GUIA !== -1 ? colMap.GUIA : COLUMNS.MOVIMIENTOS_ALMACEN.GUIA_REFERENCIA;
        const motIdx = colMap.MOTIVO !== -1 ? colMap.MOTIVO : COLUMNS.MOVIMIENTOS_ALMACEN.MOTIVO;
        const prvIdx = colMap.PROVEEDOR !== -1 ? colMap.PROVEEDOR : COLUMNS.MOVIMIENTOS_ALMACEN.PROVEEDOR_TRANSPORTE;
        const obsIdx = colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : COLUMNS.MOVIMIENTOS_ALMACEN.OBSERVACIONES;

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const id = row[idIdx];
            if (!id) continue;
            
            // FILTRO DE SEGURIDAD
            const prodId = String(row[pIdIdx] || '');
            if (prodId.includes('T') && prodId.includes('Z') && prodId.length > 20) continue;
            
            // Check if it involved the warehouse either as origin or destination
            const isOrigin = String(row[orgIdx]) === String(almacenId);
            const isDestination = String(row[destIdx]) === String(almacenId);
            
            if (isOrigin || isDestination) {
                movimientos.push({
                    id: id,
                    productoId: prodId,
                    tipo: row[tipoIdx],
                    almacenOrigen: row[orgIdx],
                    almacenDestino: row[destIdx],
                    cantidad: row[cantIdx],
                    fecha: row[fecIdx],
                    responsable: row[rspIdx],
                    guiaReferencia: row[guiaIdx],
                    motivo: row[motIdx],
                    proveedorTransporte: row[prvIdx],
                    observaciones: row[obsIdx],
                    fechaDevolucion: row[colMap.FECHA_DEVOLUCION !== -1 ? colMap.FECHA_DEVOLUCION : (COLUMNS.MOVIMIENTOS_ALMACEN.FECHA_DEVOLUCION || 12)]
                });
            }
        }
        return createResponse(true, movimientos);
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function createMovimiento(data) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const productosSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const productosData = productosSheet.getDataRange().getValues();
        
        // Validate and convert cantidad to number
        const cantidad = Number(data.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
            throw new Error("Datos de cantidad no válidos");
        }
        
        const tipo = String(data.tipo).toLowerCase();
        Logger.log(`Procesando Movimiento: ${tipo} de ${cantidad} unidades`);
        
        let sourceRow = -1;
        let destRow = -1;
        let sourceStock = 0;
        let destStock = 0;

        // Find rows in Productos sheet
        const prodIdTarget = String(data.productoId || '').trim();
        const almOrigenTarget = String(data.almacenOrigen || data.almacenId || '').trim();
        const almDestinoTarget = String(data.almacenDestino || '').trim();

        for (let i = 1; i < productosData.length; i++) {
            const rowIdValue = String(productosData[i][COLUMNS.PRODUCTOS_ALMACEN.ID] || '').trim();
            const rowAlmacenValue = String(productosData[i][COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID] || '').trim();
            
            if (rowIdValue === prodIdTarget) {
                // For normal entry/exit
                if (tipo !== 'traslado' && rowAlmacenValue === almOrigenTarget) {
                    sourceRow = i + 1;
                    sourceStock = Number(String(productosData[i][COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD]).replace(/[^0-9.]/g, '')) || 0;
                }
                // For transfers
                if (tipo === 'traslado') {
                    if (rowAlmacenValue === almOrigenTarget) {
                        sourceRow = i + 1;
                        sourceStock = Number(String(productosData[i][COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD]).replace(/[^0-9.]/g, '')) || 0;
                    } else if (rowAlmacenValue === almDestinoTarget) {
                        destRow = i + 1;
                        destStock = Number(String(productosData[i][COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD]).replace(/[^0-9.]/g, '')) || 0;
                    }
                }
            }
        }

        // Get extra product info safely
        const rowToUse = sourceRow === -1 ? (destRow === -1 ? -1 : destRow) : sourceRow;
        const rowData = rowToUse !== -1 ? productosData[rowToUse - 1] : null;
        
        const isRetornable = rowData ? checkBoolean(rowData[COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE]) : false;
        const inUseStockRaw = rowData ? rowData[COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO] : 0;
        const inUseStock = Number(String(inUseStockRaw || '0').replace(/[^0-9.]/g, '')) || 0;
        const isActivoAsset = rowData ? checkBoolean(rowData[COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO]) : false;

        Logger.log(`LOG DIAGNÓSTICO: ProductoId=${prodIdTarget}, isRetornable=${isRetornable}, stock=${sourceStock}, enUso=${inUseStock}, tipo=${tipo}`);

        // Apply Logic
        if (tipo === 'entrada') {
            if (sourceRow === -1) throw new Error("Producto no encontrado en almacén");
            productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(sourceStock + cantidad);
        } else if (tipo === 'salida') {
            if (sourceRow === -1) throw new Error("Producto no encontrado en almacén");
            if (sourceStock < cantidad) throw new Error("Stock insuficiente");
            
            // If it's a tool, move to 'In Use'
            if (isRetornable) {
                Logger.log(`Procesando SALIDA como HERRAMIENTA RETORNABLE: Aumentando 'En Uso' en ${cantidad}`);
                productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(sourceStock - cantidad);
                productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO + 1).setValue(inUseStock + cantidad);
            } else {
                Logger.log(`Procesando SALIDA como CONSUMIBLE: Solo reduciendo stock`);
                // Consumable: just decrease stock
                productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(sourceStock - cantidad);
            }
        } else if (tipo === 'retorno') {
            if (sourceRow === -1) throw new Error("Producto no encontrado en almacén");
            if (!isRetornable) throw new Error("Este producto no está marcado como retornable en la base de datos");
            if (inUseStock < cantidad) throw new Error(`No hay suficientes unidades en uso (${inUseStock} < ${cantidad})`);
            
            productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(sourceStock + cantidad);
            productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO + 1).setValue(inUseStock - cantidad);
        } else if (tipo === 'baja') {
            if (sourceRow === -1) throw new Error("Producto no encontrado en almacén");
            
            // Decrement from stock first, if not enough, from inUse (or based on business rules)
            // For now, let's assume baja happens from stock unless user specifies (can improve later)
            if (sourceStock >= cantidad) {
                productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(sourceStock - cantidad);
            } else if (isRetornable && (sourceStock + inUseStock) >= cantidad) {
                const remaining = cantidad - sourceStock;
                productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(0);
                productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO + 1).setValue(inUseStock - remaining);
            } else {
                throw new Error("No hay existencias suficientes para dar de baja");
            }
        } else if (tipo === 'traslado') {
            if (sourceRow === -1) throw new Error(`Producto ${prodIdTarget} no encontrado en almacén de origen ${almOrigenTarget}`);
            if (sourceStock < cantidad) throw new Error(`Stock insuficiente en origen (${sourceStock} < ${cantidad})`);
            
            // 1. Reducir stock en ORIGEN
            const newSourceStock = sourceStock - cantidad;
            productosSheet.getRange(sourceRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(newSourceStock);
            
            // Si el stock llega a 0 y NO es retornable ni tiene unidades en uso, se podría eliminar, 
            // pero para mantener coherencia en el historial sugerimos mantenerlo en 0.
            
            // 2. Aumentar stock en DESTINO
            if (destRow === -1) {
                // Si no existe en destino, copiar datos del origen
                const sourceProductData = productosData[sourceRow - 1];
                const newProductRow = Array(14).fill('');
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.ID] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.ID];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID] = data.almacenDestino;
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.NOMBRE] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.NOMBRE];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.CATEGORIA];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD] = cantidad;
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.UNIDAD] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.UNIDAD];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.FECHA_INGRESO] = formatDate(new Date());
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL] = sourceProductData[COLUMNS.PRODUCTOS_ALMACEN.PROVEEDOR_PRINCIPAL];
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.ESTADO] = 'activo';
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.ES_RETORNABLE] = String(isRetornable === true).toUpperCase();
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD_EN_USO] = 0;
                newProductRow[COLUMNS.PRODUCTOS_ALMACEN.ES_ACTIVO] = String(isActivoAsset === true).toUpperCase();
                productosSheet.appendRow(newProductRow);
                Logger.log(`   -> [TRASLADO] Nuevo producto creado en destino: ${data.almacenDestino}`);
            } else {
                productosSheet.getRange(destRow, COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD + 1).setValue(destStock + cantidad);
                Logger.log(`   -> [TRASLADO] Stock actualizado en destino: ${destStock + cantidad}`);
            }
        }

        // Save Movement Record
        const newRow = Array(13).fill('');
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.ID] = 'MOV-' + new Date().getTime();
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.PRODUCTO_ID] = data.productoId;
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.TIPO] = data.tipo;
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_ORIGEN] = tipo === 'entrada' ? '' : (data.almacenOrigen || data.almacenId);
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.ALMACEN_DESTINO] = tipo === 'salida' ? '' : (data.almacenDestino || data.almacenId);
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.CANTIDAD] = cantidad;
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.FECHA] = formatDateTime(data.fecha || new Date());
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.RESPONSABLE] = data.responsable;
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.GUIA_REFERENCIA] = data.guiaReferencia || data.referencia || '';
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.MOTIVO] = data.motivo || '';
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.PROVEEDOR_TRANSPORTE] = data.proveedorTransporte || data.proveedor || '';
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.PROVEEDOR_TRANSPORTE] = data.proveedorTransporte || data.proveedor || '';
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.OBSERVACIONES] = data.observaciones || '';
        newRow[COLUMNS.MOVIMIENTOS_ALMACEN.FECHA_DEVOLUCION || 12] = data.fechaDevolucion ? formatDate(data.fechaDevolucion) : '';
        
        
        sheet.appendRow(newRow);
        createAlerta('success', `Nuevo movimiento (${data.tipo}): ${data.cantidad} unidades del producto ${data.productoId}`, 'Almacenes', 'crear');
        return createResponse(true, { id: newRow[COLUMNS.MOVIMIENTOS_ALMACEN.ID], ...data });
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function deleteMovimiento(id) {
    try {
        const sheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][COLUMNS.MOVIMIENTOS_ALMACEN.ID] == id) {
                const tipoMov = data[i][COLUMNS.MOVIMIENTOS_ALMACEN.TIPO];
                sheet.deleteRow(i + 1);
                createAlerta('warning', `Movimiento eliminado (${tipoMov}): ID ${id}`, 'Almacenes', 'eliminar');
                return createResponse(true, { message: "Movimiento eliminado" });
            }
        }
        throw new Error("Movimiento no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

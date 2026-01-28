function handleAlmacenesGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllAlmacenes();
    case 'getbyid': return getAlmacenById(id);
    default: return createErrorResponse('Acción no válida');
  }
}

function handleAlmacenesPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createAlmacen(data);
    case 'update': return updateAlmacen(id, data);
    case 'delete': return deleteAlmacen(id, data);
    default: return createErrorResponse('Acción no válida');
  }
}

function getAllAlmacenes() {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    // Get products to calculate stats
    const prodSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const prodData = prodSheet.getDataRange().getValues();
    const prodColMap = getProductosColMap(prodSheet);
    
    const almacenes = data.slice(1).map(row => {
      const id = String(row[COLUMNS.ALMACENES.ID] || '').trim();
      const name = String(row[COLUMNS.ALMACENES.NOMBRE] || '').trim();
      
      let totalProductos = 0;
      let alertasStock = 0;
      let valorInventario = 0;
      
      const getIdx = (key, fallback) => (prodColMap && prodColMap[key] !== undefined && prodColMap[key] !== -1) ? prodColMap[key] : fallback;
      const almIdx = getIdx('ALMACEN_ID', COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID);
      const cantIdx = getIdx('CANTIDAD', COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD);
      const usoIdx = getIdx('EN_USO', COLUMNS.PRODUCTOS_ALMACEN.EN_USO);
      const valIdx = getIdx('VALOR', COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO);
      const minIdx = getIdx('STOCK_MIN', COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO);
      const idProdIdx = getIdx('ID', COLUMNS.PRODUCTOS_ALMACEN.ID);

      for (let i = 1; i < prodData.length; i++) {
        const pRow = prodData[i];
        if (!pRow[idProdIdx]) continue;

        const pAlmId = String(pRow[almIdx] || '').trim();
        if (pAlmId === id || pAlmId === name) {
          totalProductos++;
          const qty = Number(pRow[cantIdx]) || 0;
          const enUso = Number(pRow[usoIdx]) || 0;
          const val = Number(pRow[valIdx]) || 0;
          const min = Number(pRow[minIdx]) || 0;
          
          valorInventario += ((qty + enUso) * val);
          if (qty <= min) alertasStock++; 
        }
      }

      return {
        id: id,
        nombre: name,
        ubicacion: row[COLUMNS.ALMACENES.UBICACION] || '',
        responsable: row[COLUMNS.ALMACENES.RESPONSABLE] || '',
        fechaCreacion: formatDate(row[COLUMNS.ALMACENES.FECHA_CREACION]),
        estado: row[COLUMNS.ALMACENES.ESTADO] || 'Activo',
        totalProductos,
        alertasStock,
        valorInventario
      };
    });
    return createResponse(true, almacenes);
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

function getAlmacenById(id) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const data = sheet.getDataRange().getValues();
    const row = data.find(r => r[COLUMNS.ALMACENES.ID] == id);
    if (!row) return createErrorResponse('Almacén no encontrado');
    
    return createResponse(true, {
      id: row[COLUMNS.ALMACENES.ID],
      nombre: row[COLUMNS.ALMACENES.NOMBRE],
      ubicacion: row[COLUMNS.ALMACENES.UBICACION],
      responsable: row[COLUMNS.ALMACENES.RESPONSABLE],
      fechaCreacion: formatDate(row[COLUMNS.ALMACENES.FECHA_CREACION]),
      estado: row[COLUMNS.ALMACENES.ESTADO]
    });
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

function createAlmacen(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const id = generateAutoId('ALM');
    const newRow = Array(6).fill('');
    newRow[COLUMNS.ALMACENES.ID] = id;
    newRow[COLUMNS.ALMACENES.NOMBRE] = data.nombre;
    newRow[COLUMNS.ALMACENES.UBICACION] = data.ubicacion;
    newRow[COLUMNS.ALMACENES.RESPONSABLE] = data.responsable;
    newRow[COLUMNS.ALMACENES.FECHA_CREACION] = new Date();
    newRow[COLUMNS.ALMACENES.ESTADO] = data.estado || 'Activo';
    
    sheet.appendRow(newRow);
    registrarAccion('Almacenes', 'Creación', `Nuevo almacén creado: ${data.nombre} (ID: ${id})`, 'success', data.responsable);
    return createResponse(true, { id, ...data });
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

function updateAlmacen(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][COLUMNS.ALMACENES.ID] == id) {
            rowIndex = i + 1;
            break;
        }
    }
    if (rowIndex == -1) return createErrorResponse('Almacén no encontrado');
    
    const range = sheet.getRange(rowIndex, 1, 1, 6);
    const rowData = range.getValues()[0];
    if (data.nombre) rowData[COLUMNS.ALMACENES.NOMBRE] = data.nombre;
    if (data.ubicacion) rowData[COLUMNS.ALMACENES.UBICACION] = data.ubicacion;
    if (data.responsable) rowData[COLUMNS.ALMACENES.RESPONSABLE] = data.responsable;
    if (data.estado) rowData[COLUMNS.ALMACENES.ESTADO] = data.estado;
    
    range.setValues([rowData]);
    registrarAccion('Almacenes', 'Update', `Almacén ${id} actualizado`, 'info', data.responsable);
    return createResponse(true, data);
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

function deleteAlmacen(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const rows = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][COLUMNS.ALMACENES.ID] == id) {
            rowIndex = i + 1;
            break;
        }
    }
    if (rowIndex == -1) return createErrorResponse('Almacén no encontrado');
    
    sheet.deleteRow(rowIndex);

    // 2. Clean up products in PRODUCTOS_ALMACEN for this warehouse
    try {
      const prodSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
      const prodData = prodSheet.getDataRange().getValues();
      const prodColMap = getProductosColMap(prodSheet);
      const almIdx = prodColMap.ALMACEN_ID !== -1 ? prodColMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
      
      let deletedProds = 0;
      for (let i = prodData.length - 1; i >= 1; i--) {
        if (String(prodData[i][almIdx]).trim() === String(id).trim()) {
          prodSheet.deleteRow(i + 1);
          deletedProds++;
        }
      }
      if (deletedProds > 0) {
        SpreadsheetApp.flush();
      }
      Logger.log(`Almacén ${id} eliminado con ${deletedProds} productos.`);
    } catch (err) {
      console.error("Error limpiando productos al eliminar almacén:", err);
    }

    registrarAccion('Almacenes', 'Delete', `Almacén ${id} eliminado`, 'warning', null, data ? data.justificacion : null);
    return createResponse(true, { message: 'Almacén eliminado exitosamente' });
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

/**
 * Auxiliar para obtener el nombre de una bodega por su ID
 */
function getAlmacenName(id) {
  try {
    if (!id) return "";
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const data = sheet.getDataRange().getValues();
    const idIdx = COLUMNS.ALMACENES.ID;
    const nameIdx = COLUMNS.ALMACENES.NOMBRE;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]).trim() === String(id).trim()) {
        return String(data[i][nameIdx]).trim();
      }
    }
  } catch (e) { console.error("Error getAlmacenName: " + e.toString()); }
  return "";
}

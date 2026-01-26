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
      const id = row[COLUMNS.ALMACENES.ID];
      
      // Calculate Stats for this warehouse
      let totalProductos = 0;
      let alertasStock = 0;
      let valorInventario = 0;
      
      const almIdx = prodColMap.ALMACEN_ID !== -1 ? prodColMap.ALMACEN_ID : COLUMNS.PRODUCTOS_ALMACEN.ALMACEN_ID;
      const cantIdx = prodColMap.CANTIDAD !== -1 ? prodColMap.CANTIDAD : COLUMNS.PRODUCTOS_ALMACEN.CANTIDAD;
      const valIdx = prodColMap.VALOR !== -1 ? prodColMap.VALOR : COLUMNS.PRODUCTOS_ALMACEN.VALOR_UNITARIO;
      const minIdx = prodColMap.STOCK_MIN !== -1 ? prodColMap.STOCK_MIN : COLUMNS.PRODUCTOS_ALMACEN.STOCK_MINIMO;
      const idProdIdx = prodColMap.ID !== -1 ? prodColMap.ID : COLUMNS.PRODUCTOS_ALMACEN.ID;

      for (let i = 1; i < prodData.length; i++) {
        const pRow = prodData[i];
        if (String(pRow[almIdx]).trim() === String(id).trim() && pRow[idProdIdx]) {
          const qty = Number(pRow[cantIdx]) || 0;
          const val = Number(pRow[valIdx]) || 0;
          const min = Number(pRow[minIdx]) || 0;
          
          totalProductos++;
          valorInventario += (qty * val);
          if (qty <= min && qty > 0) alertasStock++;
          else if (qty === 0) alertasStock++; // Consider out of stock as alert too
        }
      }

      return {
        id: id,
        nombre: row[COLUMNS.ALMACENES.NOMBRE],
        ubicacion: row[COLUMNS.ALMACENES.UBICACION],
        responsable: row[COLUMNS.ALMACENES.RESPONSABLE],
        fechaCreacion: formatDate(row[COLUMNS.ALMACENES.FECHA_CREACION]),
        estado: row[COLUMNS.ALMACENES.ESTADO],
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
    const id = generateId('ALM');
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
    registrarAccion('Almacenes', 'Delete', `Almacén ${id} eliminado`, 'warning', null, data ? data.justificacion : null);
    return createResponse(true, null, 'Almacén eliminado exitosamente');
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

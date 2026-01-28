function handleCargasGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllCargas();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleCargasPost(action, id, data) {
  const cleanAction = String(action || '').toLowerCase().trim();
  switch (cleanAction) {
    case 'create': return createCarga(data);
    case 'update': return updateCarga(id, data);
    case 'delete':
    case 'remove': return deleteCarga(id, data);
    default: return createErrorResponse('Acción no válida en Cargas: ' + cleanAction, 400);
  }
}

function updateCarga(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    const rows = sheet.getDataRange().getValues();
    const colMap = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'] });
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    
    for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][idIdx]).trim().toUpperCase() === String(id).trim().toUpperCase()) {
            const fullMap = findColumnIndices(sheet, {
                FECHA: ['FECHA'],
                GUIA: ['NUMERO_GUIA', 'GUIA', 'FACTURA'],
                ESTANQUE: ['ESTANQUE'],
                PROVEEDOR: ['PROVEEDOR'],
                LITROS: ['LITROS'],
                RESPONSABLE: ['RESPONSABLE'],
                OBSERVACIONES: ['OBSERVACIONES'],
                PATENTE: ['PATENTE_CAMION', 'PATENTE'],
                TIPO_COMB: ['TIPO_COMBUSTIBLE', 'COMBUSTIBLE'],
                CONDUCTOR: ['CONDUCTOR']
            });

            const setVal = (key, val) => {
                const idx = fullMap[key];
                if (idx !== -1 && val !== undefined) sheet.getRange(i + 1, idx + 1).setValue(val);
            };

            if (data.fecha) setVal('FECHA', formatDate(data.fecha));
            if (data.numeroGuia) setVal('GUIA', data.numeroGuia);
            if (data.estanque) setVal('ESTANQUE', data.estanque);
            if (data.proveedor) setVal('PROVEEDOR', data.proveedor);
            if (data.litros) setVal('LITROS', parseFloat(data.litros));
            if (data.responsable) setVal('RESPONSABLE', data.responsable);
            if (data.observaciones) setVal('OBSERVACIONES', data.observaciones);
            if (data.patenteCamion) setVal('PATENTE', data.patenteCamion);
            if (data.tipoCombustible) setVal('TIPO_COMB', data.tipoCombustible);
            if (data.conductor) setVal('CONDUCTOR', data.conductor);

            return createResponse(true, { id, ...data }, "Carga actualizada");
        }
    }
    return createResponse(false, null, "ID no encontrado para actualizar: " + id);
  } catch (e) { return createResponse(false, null, e.toString()); }
}

function deleteCarga(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    const rows = sheet.getDataRange().getValues();
    const colMap = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'] });
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    
    const targetId = String(id).trim().toUpperCase();

    for (let i = 1; i < rows.length; i++) {
        const rowId = String(rows[i][idIdx]).trim().toUpperCase();
        if (rowId === targetId) {
            // Get data before deleting to restore stock
            const fullMap = findColumnIndices(sheet, {
                ESTANQUE: ['ESTANQUE'],
                LITROS: ['LITROS']
            });
            const estanque = fullMap.ESTANQUE !== -1 ? rows[i][fullMap.ESTANQUE] : '';
            const litros = parseFloat(rows[i][fullMap.LITROS !== -1 ? fullMap.LITROS : 7]) || 0;

            sheet.deleteRow(i + 1);
            
            // Restore stock
            if (estanque && litros > 0) {
                updateEstanqueStock(estanque, -litros);
            }

            registrarAccion('Cargas', 'eliminar', `Carga eliminada ID: ${id} (${litros}L devueltos a ${estanque})`, 'warning', null, data?.justificacion);
            createAlerta('warning', `Carga eliminada ID: ${id}`, 'Cargas', 'eliminar');
            return createResponse(true, null, "Carga eliminada y stock restaurado");
        }
    }
    return createResponse(false, null, "ID no encontrado para eliminar: " + id);
  } catch (e) { return createResponse(false, null, e.toString()); }
}

function getAllCargas() {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA', 'FECHA_INGRESO', 'FECHA INGRESO'],
        TIPO: ['TIPO'],
        FECHA_PROG: ['FECHA_PROGRAMADA', 'PROGRAMADA'],
        GUIA: ['NUMERO_GUIA', 'GUIA', 'N° GUÍA', 'FACTURA', 'N° GUÍA/FACTURA'],
        ESTANQUE: ['ESTANQUE'],
        PROVEEDOR: ['PROVEEDOR'],
        LITROS: ['LITROS'],
        RESPONSABLE: ['RESPONSABLE'],
        OBSERVACIONES: ['OBSERVACIONES'],
        PATENTE: ['PATENTE_CAMION', 'PATENTE'],
        TIPO_COMB: ['TIPO_COMBUSTIBLE', 'COMBUSTIBLE'],
        CONDUCTOR: ['CONDUCTOR']
    });

    const cargas = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
        const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : 1;
        const ltIdx = colMap.LITROS !== -1 ? colMap.LITROS : 7;
        
        const rowId = String(row[idIdx] || '').trim().toUpperCase();
        const rowFechaStr = String(row[fcIdx] || '').trim();
        
        // Skip header
        if (rowId === 'ID' || rowFechaStr.toUpperCase() === 'FECHA') continue;
        if (!rowId && !rowFechaStr) continue; // Skip truly empty

        cargas.push({
            id: rowId || (i + 1).toString(),
            fecha: formatDate(row[fcIdx]),
            tipo: row[colMap.TIPO !== -1 ? colMap.TIPO : 2] || 'real',
            fechaProgramada: formatDate(colMap.FECHA_PROG !== -1 ? row[colMap.FECHA_PROG] : ''),
            numeroGuia: colMap.GUIA !== -1 ? row[colMap.GUIA] : '',
            estanque: colMap.ESTANQUE !== -1 ? row[colMap.ESTANQUE] : '',
            proveedor: colMap.PROVEEDOR !== -1 ? row[colMap.PROVEEDOR] : '',
            litros: parseFloat(row[ltIdx]) || 0,
            responsable: colMap.RESPONSABLE !== -1 ? row[colMap.RESPONSABLE] : '',
            observaciones: colMap.OBSERVACIONES !== -1 ? row[colMap.OBSERVACIONES] : '',
            patenteCamion: colMap.PATENTE !== -1 ? row[colMap.PATENTE] : '',
            tipoCombustible: colMap.TIPO_COMB !== -1 ? row[colMap.TIPO_COMB] : '',
            conductor: colMap.CONDUCTOR !== -1 ? row[colMap.CONDUCTOR] : ''
        });
    }
  return createResponse(true, cargas);
} catch (error) {
  return createResponse(false, null, error.toString());
}
}

function createCarga(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    
    // Dynamic Mapping for Insertion
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA', 'FECHA_INGRESO', 'FECHA INGRESO'],
        TIPO: ['TIPO'],
        FECHA_PROG: ['FECHA_PROGRAMADA', 'PROGRAMADA'],
        GUIA: ['NUMERO_GUIA', 'GUIA', 'N° GUÍA/FACTURA', 'FACTURA'],
        ESTANQUE: ['ESTANQUE'],
        PROVEEDOR: ['PROVEEDOR'],
        LITROS: ['LITROS'],
        RESPONSABLE: ['RESPONSABLE'],
        OBSERVACIONES: ['OBSERVACIONES'],
        PATENTE: ['PATENTE_CAMION', 'PATENTE'],
        TIPO_COMB: ['TIPO_COMBUSTIBLE', 'COMBUSTIBLE'],
        CONDUCTOR: ['CONDUCTOR']
    });

    // Generate ID
    const id = generateSequentialId('CARG', SHEET_NAMES.CARGAS, 'ID', 7);
    
    // Determine max column index to size the array correctly
    const maxIdx = Math.max(...Object.values(colMap), 12);
    const newRow = Array(maxIdx + 1).fill('');

    const set = (keyIdx, val) => {
        if (keyIdx !== -1) newRow[keyIdx] = val;
    };

    set(colMap.ID !== -1 ? colMap.ID : 0, id);
    set(colMap.FECHA !== -1 ? colMap.FECHA : 1, formatDate(data.fecha || new Date()));
    set(colMap.TIPO !== -1 ? colMap.TIPO : 2, data.tipo || 'real');
    set(colMap.FECHA_PROG !== -1 ? colMap.FECHA_PROG : 3, data.fechaProgramada ? formatDate(data.fechaProgramada) : '');
    set(colMap.GUIA !== -1 ? colMap.GUIA : 4, data.numeroGuia || '');
    set(colMap.ESTANQUE !== -1 ? colMap.ESTANQUE : 5, data.estanque || '');
    set(colMap.PROVEEDOR !== -1 ? colMap.PROVEEDOR : 6, data.proveedor || '');
    set(colMap.LITROS !== -1 ? colMap.LITROS : 7, parseFloat(data.litros) || 0);
    set(colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : 8, data.responsable || 'Admin');
    set(colMap.OBSERVACIONES !== -1 ? colMap.OBSERVACIONES : 9, data.observaciones || '');
    set(colMap.PATENTE !== -1 ? colMap.PATENTE : 10, data.patenteCamion || '');
    set(colMap.TIPO_COMB !== -1 ? colMap.TIPO_COMB : 11, data.tipoCombustible || '');
    set(colMap.CONDUCTOR !== -1 ? colMap.CONDUCTOR : 12, data.conductor || '');
    
    sheet.appendRow(newRow);
    
    // Audit Log
    registrarAccion('Cargas', 'crear', `Nueva carga (${data.tipo}): ${data.litros}L en ${data.estanque} (ID: ${id})`, 'success', data.responsable);
    
    createAlerta('success', `Nueva carga (${data.tipo}): ${data.litros}L en ${data.estanque}`, 'Cargas', 'crear');
    
    // Update Stock Estanque ONLY IF REAL
    if (data.tipo !== 'programada' && data.estanque && data.litros) {
        updateEstanqueStock(data.estanque, parseFloat(data.litros));
    }
    
    return createResponse(true, { id: id, ...data }, "Carga creada");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateEstanqueStock(nombre, litros) {
    try {
        const sheet = getSheet(SHEET_NAMES.ESTANQUES);
        const data = sheet.getDataRange().getValues();
        
        const colMap = findColumnIndices(sheet, {
            NOMBRE: ['NOMBRE', 'ESTANQUE'],
            STOCK: ['STOCK', 'STOCK ACTUAL'],
            FECHA: ['FECHA_ULTIMA_CARGA', 'ULTIMA_CARGA']
        });

        const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : 1;
        const stkIdx = colMap.STOCK !== -1 ? colMap.STOCK : 4;
        const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : 8;

        let rowIndex = -1;
        for (let i = 1; i < data.length; i++) {
            if (String(data[i][nmIdx]).trim() === String(nombre).trim()) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex !== -1) {
            const currentStock = parseFloat(data[rowIndex-1][stkIdx]) || 0;
            sheet.getRange(rowIndex, stkIdx + 1).setValue(currentStock + litros);
            if (fcIdx !== -1) sheet.getRange(rowIndex, fcIdx + 1).setValue(new Date());
            return true;
        }
        return false;
    } catch (error) {
        Logger.log('Error updating estanque stock: ' + error.toString());
        return false;
    }
}

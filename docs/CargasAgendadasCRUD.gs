/**
 * CRUD OPERATIONS: CARGAS AGENDADAS/PROGRAMADAS
 */

function handleAgendamientosGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllAgendamientos();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleAgendamientosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createAgendamiento(data);
    case 'update': return updateAgendamiento(id, data);
    case 'delete': return deleteAgendamiento(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllAgendamientos() {
  try {
    const sheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
    ensureAgendamientosHeaders(sheet); // Fix headers if missing
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA'],
        TIPO: ['TIPO'],
        FECHA_PROG: ['FECHA_PROGRAMADA', 'PROGRAMADA'],
        GUIA: ['NUMERO_GUIA', 'GUIA'],
        ESTANQUE: ['ESTANQUE'],
        PROVEEDOR: ['PROVEEDOR'],
        LITROS: ['LITROS'],
        RESPONSABLE: ['RESPONSABLE'],
        OBSERVACIONES: ['OBSERVACIONES'],
        PATENTE: ['PATENTE_CAMION', 'PATENTE'],
        TIPO_COMB: ['TIPO_COMBUSTIBLE', 'COMBUSTIBLE'],
        CONDUCTOR: ['CONDUCTOR']
    });

    const agendamientos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
        const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : 1;
        
        // CLEANUP: If the row contains system keywords or is empty, skip it
        const rowString = row.join(' ').toUpperCase();
        if (rowString.includes('ID') && rowString.includes('FECHA')) continue;
        if (!row[idIdx] && !row[fcIdx]) continue;
        if (String(row[idIdx]).toUpperCase().includes('AGEN-')) { /* OK */ }
        else if (String(row[idIdx]).length < 4) { /* Skip likely header or empty */ }

        agendamientos.push({
            id: row[idIdx] || (i + 1).toString(),
            fecha: formatDate(row[colMap.FECHA !== -1 ? colMap.FECHA : 1]),
            tipo: row[colMap.TIPO !== -1 ? colMap.TIPO : 2] || 'programada',
            fechaProgramada: formatDate(colMap.FECHA_PROG !== -1 ? row[colMap.FECHA_PROG] : ''),
            numeroGuia: colMap.GUIA !== -1 ? row[colMap.GUIA] : '',
            estanque: colMap.ESTANQUE !== -1 ? row[colMap.ESTANQUE] : '',
            proveedor: colMap.PROVEEDOR !== -1 ? row[colMap.PROVEEDOR] : '',
            litros: colMap.LITROS !== -1 ? row[colMap.LITROS] : 0,
            responsable: colMap.RESPONSABLE !== -1 ? row[colMap.RESPONSABLE] : '',
            observaciones: colMap.OBSERVACIONES !== -1 ? row[colMap.OBSERVACIONES] : '',
            patenteCamion: colMap.PATENTE !== -1 ? row[colMap.PATENTE] : '',
            tipoCombustible: colMap.TIPO_COMB !== -1 ? row[colMap.TIPO_COMB] : '',
            conductor: colMap.CONDUCTOR !== -1 ? row[colMap.CONDUCTOR] : ''
        });
    }
    return createResponse(true, agendamientos);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createAgendamiento(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
    ensureAgendamientosHeaders(sheet); // Sincronizar cabeceras seriamente
    
    // Dynamic Mapping for Insertion
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA'],
        TIPO: ['TIPO'],
        FECHA_PROG: ['FECHA_PROGRAMADA', 'PROGRAMADA'],
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

    // Generate ID: Especialmente importante para Agendamientos
    const id = generateSequentialId('AGEN', SHEET_NAMES.AGENDAMIENTOS, 'ID', 5);
    
    // Asegurar que el array tenga al menos 13 elementos (según Config)
    const newRow = Array(13).fill('');

    const set = (mappingKey, val) => {
        const idx = colMap[mappingKey];
        if (idx !== undefined && idx !== -1) {
            newRow[idx] = val;
        } else {
            // Fallback a posiciones fijas de Config si el mapeo dinámico falla o es primera vez
            const fallbackIdx = COLUMNS.AGENDAMIENTOS[mappingKey];
            if (fallbackIdx !== undefined) newRow[fallbackIdx] = val;
        }
    };

    set('ID', id);
    set('FECHA', formatDate(data.fecha || new Date()));
    set('TIPO', 'programada');
    set('FECHA_PROG', data.fechaProgramada ? formatDate(data.fechaProgramada) : '');
    set('GUIA', data.numeroGuia || '');
    set('ESTANQUE', data.estanque || '');
    set('PROVEEDOR', data.proveedor || '');
    set('LITROS', parseFloat(data.litros) || 0);
    set('RESPONSABLE', data.responsable || 'Admin');
    set('OBSERVACIONES', data.observaciones || '');
    set('PATENTE', data.patenteCamion || '');
    set('TIPO_COMB', data.tipoCombustible || '');
    set('CONDUCTOR', data.conductor || '');
    
    sheet.appendRow(newRow);
    
    return createResponse(true, { id: id, ...data }, "Agendamiento creado correctamente (ID: " + id + ")");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

// ... updateAgendamiento code stays same ...

function ensureAgendamientosHeaders(sheet) {
  const HEADER_ROW = ['ID', 'FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    return;
  }
  
  // Si ya tiene datos, verificar si la primera fila son realmente las cabeceras correctas
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const normalizedCurrent = currentHeaders.map(h => normalizeHeader(h));
  
  // Si falta la cabecera ID (un problema común reportado), forzar reset de cabeceras
  if (!normalizedCurrent.includes('ID')) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
  }
}

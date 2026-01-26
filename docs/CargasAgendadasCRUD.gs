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
    
    const agendamientos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[COLUMNS.AGENDAMIENTOS.FECHA]) continue;

        agendamientos.push({
            id: (i + 1).toString(),
            fecha: row[COLUMNS.AGENDAMIENTOS.FECHA],
            tipo: row[COLUMNS.AGENDAMIENTOS.TIPO] || 'programada',
            fechaProgramada: row[COLUMNS.AGENDAMIENTOS.FECHA_PROGRAMADA],
            numeroGuia: row[COLUMNS.AGENDAMIENTOS.NUMERO_GUIA],
            estanque: row[COLUMNS.AGENDAMIENTOS.ESTANQUE],
            proveedor: row[COLUMNS.AGENDAMIENTOS.PROVEEDOR],
            litros: row[COLUMNS.AGENDAMIENTOS.LITROS],
            responsable: row[COLUMNS.AGENDAMIENTOS.RESPONSABLE],
            observaciones: row[COLUMNS.AGENDAMIENTOS.OBSERVACIONES],
            patenteCamion: row[COLUMNS.AGENDAMIENTOS.PATENTE_CAMION],
            tipoCombustible: row[COLUMNS.AGENDAMIENTOS.TIPO_COMBUSTIBLE],
            conductor: row[COLUMNS.AGENDAMIENTOS.CONDUCTOR]
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
    ensureAgendamientosHeaders(sheet); // Fix headers if missing
    
    const newRow = Array(12).fill('');
    newRow[COLUMNS.AGENDAMIENTOS.FECHA] = data.fecha;
    newRow[COLUMNS.AGENDAMIENTOS.TIPO] = 'programada';
    newRow[COLUMNS.AGENDAMIENTOS.FECHA_PROGRAMADA] = data.fechaProgramada || '';
    newRow[COLUMNS.AGENDAMIENTOS.NUMERO_GUIA] = data.numeroGuia || '';
    newRow[COLUMNS.AGENDAMIENTOS.ESTANQUE] = data.estanque;
    newRow[COLUMNS.AGENDAMIENTOS.PROVEEDOR] = data.proveedor;
    newRow[COLUMNS.AGENDAMIENTOS.LITROS] = data.litros;
    newRow[COLUMNS.AGENDAMIENTOS.RESPONSABLE] = data.responsable;
    newRow[COLUMNS.AGENDAMIENTOS.OBSERVACIONES] = data.observaciones;
    newRow[COLUMNS.AGENDAMIENTOS.PATENTE_CAMION] = data.patenteCamion || '';
    newRow[COLUMNS.AGENDAMIENTOS.TIPO_COMBUSTIBLE] = data.tipoCombustible || '';
    newRow[COLUMNS.AGENDAMIENTOS.CONDUCTOR] = data.conductor || '';
    
    sheet.appendRow(newRow);
    
    return createResponse(true, { ...data }, "Agendamiento creado");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateAgendamiento(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
    const rowIndex = parseInt(id);
    
    if (rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
      const range = sheet.getRange(rowIndex, 1, 1, 12);
      const currentValues = range.getValues()[0];
      
      const newValues = [...currentValues];
      
      if (data.fecha) newValues[COLUMNS.AGENDAMIENTOS.FECHA] = data.fecha;
      if (data.fechaProgramada) newValues[COLUMNS.AGENDAMIENTOS.FECHA_PROGRAMADA] = data.fechaProgramada;
      if (data.numeroGuia) newValues[COLUMNS.AGENDAMIENTOS.NUMERO_GUIA] = data.numeroGuia;
      if (data.estanque) newValues[COLUMNS.AGENDAMIENTOS.ESTANQUE] = data.estanque;
      if (data.proveedor) newValues[COLUMNS.AGENDAMIENTOS.PROVEEDOR] = data.proveedor;
      if (data.litros) newValues[COLUMNS.AGENDAMIENTOS.LITROS] = data.litros;
      if (data.responsable) newValues[COLUMNS.AGENDAMIENTOS.RESPONSABLE] = data.responsable;
      if (data.observaciones) newValues[COLUMNS.AGENDAMIENTOS.OBSERVACIONES] = data.observaciones;
      if (data.patenteCamion) newValues[COLUMNS.AGENDAMIENTOS.PATENTE_CAMION] = data.patenteCamion;
      if (data.tipoCombustible) newValues[COLUMNS.AGENDAMIENTOS.TIPO_COMBUSTIBLE] = data.tipoCombustible;
      if (data.conductor) newValues[COLUMNS.AGENDAMIENTOS.CONDUCTOR] = data.conductor;
      
      range.setValues([newValues]);
      return createResponse(true, { id, ...data }, "Agendamiento actualizado");
    }
    return createResponse(false, null, "ID de agendamiento no válido: " + id);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteAgendamiento(id) {
  try {
    const sheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
    const rowIndex = parseInt(id);
    
    if (rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
      sheet.deleteRow(rowIndex);
      return createResponse(true, null, "Agendamiento eliminado");
    }
    return createResponse(false, null, "ID de agendamiento no válido: " + id);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function ensureAgendamientosHeaders(sheet) {
  const HEADER_ROW = ['FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  }
}

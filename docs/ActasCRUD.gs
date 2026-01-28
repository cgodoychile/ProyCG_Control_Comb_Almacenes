/**
 * GENERADOR DE ACTAS DE CARGO
 * Proporciona funcionalidad para generar documentos de entrega de equipos.
 */

function handleActasGet(action, id) {
  switch (action.toLowerCase()) {
    case 'get_all': return getAllActas();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleActasPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'generate_cargo': return generateCargoDocument(data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllActas() {
  return handleGetAll('ACTAS');
}

function generateCargoDocument(data) {
  try {
    const { activoId, responsable, fecha, cargo, equipo, marca, modelo, serie, patente, observaciones } = data;
    
    // Hardened sheet name reference
    const sheetName = SHEET_NAMES.ACTAS || 'Actas';
    console.log(`[ActasCRUD] generateCargoDocument - Attempting to get sheet: "${sheetName}"`);
    
    const sheet = getSheet(sheetName);
    const docId = 'ACTA-' + (activoId || 'GEN') + '-' + Date.now();
    
    const mapping = COLUMNS.ACTAS || {
      ID: 0, FECHA: 1, RESPONSABLE: 2, CARGO: 3, EQUIPO: 4, MARCA: 5, MODELO: 6, 
      SERIE_PATENTE: 7, OBSERVACIONES: 8, DOCUMENTO_ID: 9
    };

    const newRow = [];
    newRow[mapping.ID] = generateSequentialId('ACT', sheetName || 'Actas', 'ID');
    newRow[mapping.FECHA] = fecha || new Date().toLocaleDateString('es-CL');
    newRow[mapping.RESPONSABLE] = responsable;
    newRow[mapping.CARGO] = cargo || 'Operario / Responsable';
    newRow[mapping.EQUIPO] = equipo || 'Equipo General';
    newRow[mapping.MARCA] = marca || '-';
    newRow[mapping.MODELO] = modelo || '-';
    newRow[mapping.SERIE_PATENTE] = patente || serie || activoId || '-';
    newRow[mapping.OBSERVACIONES] = observaciones || '-';
    newRow[mapping.DOCUMENTO_ID] = docId;

    sheet.appendRow(newRow);
    
    registrarAccion('Actas', 'generar', `Acta de Cargo generada: ${docId}`, 'success');
    
    return createResponse(true, { 
      message: 'Acta generada y guardada exitosamente',
      documentId: docId,
      details: {
        titulo: "ACTA DE ASIGNACIÓN Y CARGO DE EQUIPO",
        empresa: "ENEL - OPERACIONES CHILE",
        fecha: newRow[mapping.FECHA],
        responsable,
        cargo: newRow[mapping.CARGO],
        equipo: newRow[mapping.EQUIPO],
        marca: newRow[mapping.MARCA],
        modelo: newRow[mapping.MODELO],
        serie: newRow[mapping.SERIE_PATENTE]
      }
    });
  } catch (error) {
    console.error(`[ActasCRUD] Error in generateCargoDocument: ${error.toString()}`);
    return createResponse(false, null, error.toString());
  }
}

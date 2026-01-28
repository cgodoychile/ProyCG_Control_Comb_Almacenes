/**
 * GESTIÓN CENTRALIZADA DE ALERTAS
 */

function createAlerta(modulo, tipo, descripcion, responsable) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALERTAS);
    const mapping = COLUMNS.ALERTAS || { ID: 0, FECHA: 1, MODULO: 4, TIPO: 2, DESCRIPCION: 3, RESPONSABLE: 5, ESTADO: 6 };
    const id = "ALR-" + new Date().getTime();
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = Array(headers.length || 7).fill('');
    
    newRow[mapping.ID || 0] = id;
    newRow[mapping.FECHA !== undefined ? mapping.FECHA : 1] = new Date();
    newRow[mapping.MODULO !== undefined ? mapping.MODULO : 4] = modulo;
    newRow[mapping.TIPO !== undefined ? mapping.TIPO : 2] = tipo;
    newRow[mapping.DESCRIPCION !== undefined ? mapping.DESCRIPCION : 3] = descripcion;
    newRow[mapping.RESPONSABLE !== undefined ? mapping.RESPONSABLE : 5] = responsable || 'Sistema';
    newRow[mapping.ESTADO !== undefined ? mapping.ESTADO : 6] = 'PENDIENTE';
    
    sheet.appendRow(newRow);
    return id;
  } catch (e) {
    console.error("Error creando alerta: " + e.toString());
    return null;
  }
}

function markAlertaAsSeen(id) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALERTAS);
    const data = sheet.getDataRange().getValues();
    const mapping = COLUMNS.ALERTAS;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][mapping.ID] === id) {
        sheet.getRange(i + 1, mapping.ESTADO + 1).setValue('VISTO');
        return createResponse(true, null, "Alerta marcada como vista");
      }
    }
    return createErrorResponse("Alerta no encontrada");
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function getActiveAlertas() {
  try {
    const sheet = getSheet(SHEET_NAMES.ALERTAS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    const mapping = COLUMNS.ALERTAS;
    const alertas = data.slice(1)
      .filter(row => row[mapping.ESTADO] === 'PENDIENTE')
      .map(row => ({
        id: row[mapping.ID],
        fecha: formatDate(row[mapping.FECHA]),
        modulo: row[mapping.MODULO],
        tipo: row[mapping.TIPO],
        descripcion: row[mapping.DESCRIPCION],
        responsable: row[mapping.RESPONSABLE],
        estado: row[mapping.ESTADO]
      }))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
    return createResponse(true, alertas);
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

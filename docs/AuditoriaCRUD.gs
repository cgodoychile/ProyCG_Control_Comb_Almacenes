/**
 * CRUD Operations for Audit Logs
 */

function handleAuditoriaGet(action) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllAuditoria();
    case 'setup': return setupAuditoria();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

/**
 * Creates the Auditoria sheet if it doesn't exist
 */
function setupAuditoria() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAMES.AUDITORIA);
      // Create Headers
      const headers = ['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      
      return createResponse(true, { message: 'Hoja Auditoria creada correctamente' });
    }
    
    return createResponse(true, { message: 'La hoja Auditoria ya existe' });
  } catch (error) {
    return createErrorResponse('Error creando hoja Auditoria: ' + error.toString());
  }
}

/**
 * Registers a new action in the audit log
 * @param {string} modulo - Module where the action occurred
 * @param {string} accion - Action performed (crear, actualizar, eliminar, etc.)
 * @param {string} mensaje - Detailed description
 * @param {string} tipo - type (info, warning, critical, success)
 * @param {string} usuario - User who performed the action (defaults to current user)
 */
function registrarAccion(modulo, accion, mensaje, tipo, usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA);
    
    // Auto-create if missing during registration to prevent crashes
    if (!sheet) {
        setupAuditoria();
        sheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA);
    }
    
    const id = generateId('LOG');
    const fecha = new Date();
    const userEmail = usuario || 'Sistema'; 
    
    const row = [];
    row[COLUMNS.AUDITORIA.ID] = id;
    row[COLUMNS.AUDITORIA.FECHA] = fecha;
    row[COLUMNS.AUDITORIA.USUARIO] = userEmail;
    row[COLUMNS.AUDITORIA.MODULO] = modulo;
    row[COLUMNS.AUDITORIA.ACCION] = accion;
    row[COLUMNS.AUDITORIA.MENSAJE] = mensaje;
    row[COLUMNS.AUDITORIA.TIPO] = tipo || 'info';
    
    sheet.appendRow(row);
    return true;
  } catch (error) {
    Logger.log('Error en registrarAccion: ' + error.toString());
    return false;
  }
}

/**
 * Gets all audit logs
 * @returns {Object} Standardized response with logs
 */
function getAllAuditoria() {
  try {
    const sheet = getSheet(SHEET_NAMES.AUDITORIA); // This might throw if missing, user should hit setup first or let auto-create handle it
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    // DYNAMIC COLUMN MAPPING
    const colMap = findColumnIndices(sheet, {
        ID: ['ID'],
        FECHA: ['FECHA', 'TIMESTAMP'],
        USUARIO: ['USUARIO', 'USER'],
        MODULO: ['MODULO'],
        ACCION: ['ACCION'],
        MENSAJE: ['MENSAJE', 'DESCRIPCION'],
        TIPO: ['TIPO', 'LEVEL']
    });

    const logs = [];
    // Skip header and iterate backwards to get most recent first
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      
      const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.AUDITORIA.ID;
      const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.AUDITORIA.FECHA;
      const usrIdx = colMap.USUARIO !== -1 ? colMap.USUARIO : COLUMNS.AUDITORIA.USUARIO;
      const modIdx = colMap.MODULO !== -1 ? colMap.MODULO : COLUMNS.AUDITORIA.MODULO;
      const actIdx = colMap.ACCION !== -1 ? colMap.ACCION : COLUMNS.AUDITORIA.ACCION;
      const msgIdx = colMap.MENSAJE !== -1 ? colMap.MENSAJE : COLUMNS.AUDITORIA.MENSAJE;
      const tipIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.AUDITORIA.TIPO;

      logs.push({
        id: row[idIdx],
        fecha: row[fcIdx],
        usuario: row[usrIdx],
        modulo: row[modIdx],
        accionRealizada: row[actIdx],
        mensaje: row[msgIdx],
        tipo: row[tipIdx]
      });
    }
    
    return createResponse(true, logs);
  } catch (error) {
    if (error.toString().includes('no encontrada')) {
        return createResponse(true, []); // Return empty list instead of error if sheet missing
    }
    return createErrorResponse('Error al obtener auditoría: ' + error.toString());
  }
}

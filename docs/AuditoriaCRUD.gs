/**
 * CRUD Operations for Audit Logs / Alerts
 * Refactored to use fully dynamic column mapping.
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
    let sheetName = SHEET_NAMES.AUDITORIA || 'Auditoria';
    let sheet = ss.getSheetByName(sheetName);
    
    // Fallback check for 'Alertas' if the user named it that way
    if (!sheet && sheetName !== 'Alertas') {
      const altSheet = ss.getSheetByName('Alertas');
      if (altSheet) {
        sheet = altSheet;
        sheetName = 'Alertas';
      }
    }

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Create Headers
      const headers = ['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      
      return createResponse(true, { message: 'Hoja ' + sheetName + ' creada correctamente' });
    }
    
    return createResponse(true, { message: 'La hoja ' + sheetName + ' ya existe' });
  } catch (error) {
    return createErrorResponse('Error creando hoja de logs: ' + error.toString());
  }
}

/**
 * Registers a new action in the audit log or alerts system
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
    
    // Fallback check
    if (!sheet) {
        sheet = ss.getSheetByName('Alertas');
    }

    // Auto-create if missing during registration to prevent crashes
    if (!sheet) {
        setupAuditoria();
        sheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA) || ss.getSheetByName('Alertas');
    }
    
    if (!sheet) {
        Logger.log('Error: No se encontró la hoja de Auditoría o Alertas.');
        return false;
    }

    // Dynamic Column Mapping
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA', 'TIMESTAMP', 'FECHA'],
        USUARIO: ['USUARIO', 'USER', 'RESPONSABLE'],
        MODULO: ['MODULO', 'DOMINIO'],
        ACCION: ['ACCION', 'OPERACION'],
        MENSAJE: ['MENSAJE', 'DESCRIPCION', 'DETALLE'],
        TIPO: ['TIPO', 'LEVEL', 'CATEGORIA']
    });

    const maxIdx = Math.max(...Object.values(colMap), 6);
    const newRow = Array(maxIdx + 1).fill('');
    
    const setVal = (key, fallbackIdx, val) => {
        const idx = colMap[key] !== -1 ? colMap[key] : fallbackIdx;
        if (idx !== -1) newRow[idx] = val;
    };

    setVal('ID', COLUMNS.AUDITORIA.ID, generateId('LOG'));
    setVal('FECHA', COLUMNS.AUDITORIA.FECHA, formatDateTime(new Date()));
    setVal('USUARIO', COLUMNS.AUDITORIA.USUARIO, usuario || 'Sistema');
    setVal('MODULO', COLUMNS.AUDITORIA.MODULO, modulo);
    setVal('ACCION', COLUMNS.AUDITORIA.ACCION, accion);
    setVal('MENSAJE', COLUMNS.AUDITORIA.MENSAJE, mensaje);
    setVal('TIPO', COLUMNS.AUDITORIA.TIPO, tipo || 'info');
    
    sheet.appendRow(newRow);
    return true;
  } catch (error) {
    Logger.log('Error en registrarAccion: ' + error.toString());
    return false;
  }
}

/**
 * Gets all audit logs / alerts
 * @returns {Object} Standardized response with logs
 */
function getAllAuditoria() {
  try {
    let sheet = ss_safe_getSheet(SHEET_NAMES.AUDITORIA);
    if (!sheet) sheet = ss_safe_getSheet('Alertas');

    if (!sheet) return createResponse(true, []);

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

    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.AUDITORIA.ID;
    const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.AUDITORIA.FECHA;
    const usrIdx = colMap.USUARIO !== -1 ? colMap.USUARIO : COLUMNS.AUDITORIA.USUARIO;
    const modIdx = colMap.MODULO !== -1 ? colMap.MODULO : COLUMNS.AUDITORIA.MODULO;
    const actIdx = colMap.ACCION !== -1 ? colMap.ACCION : COLUMNS.AUDITORIA.ACCION;
    const msgIdx = colMap.MENSAJE !== -1 ? colMap.MENSAJE : COLUMNS.AUDITORIA.MENSAJE;
    const tipIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.AUDITORIA.TIPO;

    const logs = [];
    // Skip header and iterate backwards to get most recent first
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[idIdx]) continue;

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
        return createResponse(true, []); 
    }
    return createErrorResponse('Error al obtener auditoría: ' + error.toString());
  }
}

/**
 * Safe version of getSheet that doesn't throw
 */
function ss_safe_getSheet(name) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        return ss.getSheetByName(name);
    } catch (e) {
        return null;
    }
}

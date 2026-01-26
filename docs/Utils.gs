/**
 * UTILITY FUNCTIONS
 * Helper functions used across all CRUD modules
 */

function createResponse(success, data, message) {
  return {
    success: success,
    data: data,
    message: message || (success ? 'Operación exitosa' : 'Error en la operación')
  };
}

function createErrorResponse(message, code) {
  return {
    success: false,
    data: null,
    message: message,
    code: code || 500
  };
}

/**
 * Centralized function to get the spreadsheet.
 * This helps diagnose ReferenceErrors with SPREADSHEETID.
 */
function getSS() {
  try {
    if (typeof SPREADSHEETID === 'undefined') {
      throw new Error("La constante SPREADSHEETID no está definida en Config.gs o el archivo no se ha cargado.");
    }
    return SpreadsheetApp.openById(SPREADSHEETID);
  } catch (e) {
    throw new Error("Error accediendo a la base de datos: " + e.toString());
  }
}

function getSheet(sheetName) {
  const ss = getSS();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada`);
  return sheet;
}

function formatDate(date) {
  if (!date) return '';
  let d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  
  // Offset correction: subtract 5 hours to align server with Chile
  const adjustedTime = d.getTime() - (5 * 60 * 60 * 1000);
  const adjustedDate = new Date(adjustedTime);

  try {
    return Utilities.formatDate(adjustedDate, "GMT", "dd-MM-yyyy");
  } catch (e) {
    return String(date);
  }
}

function formatDateTime(date) {
  if (!date) return '';
  let d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  
  // Offset correction: subtract 5 hours to align server with Chile
  const adjustedTime = d.getTime() - (5 * 60 * 60 * 1000);
  const adjustedDate = new Date(adjustedTime);

  try {
    return Utilities.formatDate(adjustedDate, "GMT", "dd-MM-yyyy, HH:mm");
  } catch (e) {
    return String(date);
  }
}

function generateId(prefix) {
  // Pattern: PREFIX-TIMESTAMP
  const timestamp = new Date().getTime();
  return (prefix || 'ID') + '-' + timestamp;
}

/**
 * Generates a sequential and categorized PRODUCT code
 * Pattern: PRD-[CAT_PREFIX]-[SEQ] (e.g., PRD-EPP-001)
 */
function generateProductCode(categoria) {
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const data = sheet.getDataRange().getValues();
    const colMap = findColumnIndices(sheet, { ID: ['ID'] });
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    
    const catPrefix = (categoria || 'GEN').substring(0, 3).toUpperCase();
    const fullPrefix = `PRD-${catPrefix}-`;
    
    let maxSeq = 0;
    for (let i = 1; i < data.length; i++) {
      const id = String(data[i][idIdx]);
      if (id.startsWith(fullPrefix)) {
        const seqStr = id.replace(fullPrefix, '');
        const seq = parseInt(seqStr);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    }
    
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${fullPrefix}${nextSeq}`;
  } catch (e) {
    // Fallback to timestamp if something fails during sequential check
    return 'PRD-' + new Date().getTime();
  }
}

/**
 * Helpers for human-readable audit logs
 */
function fetchProductNamesMap() {
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const data = sheet.getDataRange().getValues();
    const colMap = findColumnIndices(sheet, { ID: ['ID'], NOMBRE: ['NOMBRE'] });
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : 2;
    const map = {};
    for (let i = 1; i < data.length; i++) {
      const id = String(data[i][idIdx]).trim();
      if (id) map[id] = data[i][nmIdx];
    }
    return map;
  } catch(e) { return {}; }
}

function fetchAlmacenNamesMap() {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const data = sheet.getDataRange().getValues();
    const colMap = findColumnIndices(sheet, { ID: ['ID'], NOMBRE: ['NOMBRE'] });
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    const nmIdx = colMap.NOMBRE !== -1 ? colMap.NOMBRE : 1;
    const map = {};
    for (let i = 1; i < data.length; i++) {
        const id = String(data[i][idIdx]).trim();
        if (id) map[id] = data[i][nmIdx];
    }
    return map;
  } catch(e) { return {}; }
}

/**
 * Dynamic Column Finder
 */
function findColumnIndices(sheet, mapping) {
  try {
    const headers = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn() || 1, 30)).getValues()[0];
    const result = {};
    Object.keys(mapping).forEach(key => {
      const possibleHeaders = mapping[key].map(h => h.toUpperCase());
      const foundIdx = headers.findIndex(h => possibleHeaders.includes(String(h).toUpperCase().trim()));
      result[key] = foundIdx;
    });
    return result;
  } catch (e) {
    return {};
  }
}

/**
 * Registers a new action in the audit log
 */
function registrarAccion(modulo, accion, mensaje, tipo, usuario, justificacion) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA);
    if (!sheet) sheet = ss.getSheetByName(SHEET_NAMES.ALERTA);
    if (!sheet) return false;

    const colMap = findColumnIndices(sheet, {
      ID: ['ID', 'CODIGO'],
      FECHA: ['FECHA', 'TIMESTAMP'],
      USUARIO: ['USUARIO', 'USER', 'RESPONSABLE'],
      MODULO: ['MODULO', 'DOMINIO'],
      ACCION: ['ACCION', 'OPERACION'],
      MENSAJE: ['MENSAJE', 'DESCRIPCION'],
      TIPO: ['TIPO', 'LEVEL']
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
    
    let fullMsg = mensaje;
    
    // Auto-translate JSON to Human Readable
    if (typeof mensaje === 'string' && mensaje.trim().startsWith('{')) {
      try {
        const metadata = JSON.parse(mensaje);
        if (metadata.name && metadata.entity) {
           const entityMap = { 'activos': 'Activo', 'vehiculos': 'Vehículo', 'consumos': 'Consumo', 'estanques': 'Estanque', 'almacenes': 'Bodega' };
           const friendlyEntity = entityMap[metadata.entity.toLowerCase()] || metadata.entity;
           fullMsg = `Solicitud de eliminación: ${friendlyEntity} - ${metadata.name}`;
           if (metadata.justification) fullMsg += ` (Motivo: ${metadata.justification})`;
        }
      } catch (e) { /* keep original if not valid JSON */ }
    }

    if (justificacion) fullMsg += ` | Justificación: ${justificacion}`;
    setVal('MENSAJE', COLUMNS.AUDITORIA.MENSAJE, fullMsg);
    setVal('TIPO', COLUMNS.AUDITORIA.TIPO, tipo || 'info');
    
    sheet.appendRow(newRow);
    return true;
  } catch (error) {
    console.error('Error en registrarAccion:', error);
    return false;
  }
}

const SHEET_NAMES_AL = typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : { ALERTA: 'Alerta' };

function createAlerta(arg1, arg2, arg3, arg4) {
  try {
    // 1. Normalize Arguments (Handle Object vs Positional)
    let tipo, mensaje, modulo, accion;
    
    if (typeof arg1 === 'object' && arg1 !== null) {
      // Called with object: { modulo, tipo, descripcion, responsable }
      tipo = arg1.tipo || 'info';
      mensaje = arg1.descripcion || arg1.mensaje || '';
      modulo = arg1.modulo || 'Sistema'; // Default Module
      accion = arg1.accion || 'registro';
    } else {
      // Called with positional: (tipo, mensaje, modulo, accion)
      tipo = arg1 || 'info';
      mensaje = arg2 || '';
      modulo = arg3 || 'Sistema';
      accion = arg4 || 'registro';
    }

    // 2. Prepare Data
    const ss = getSS();
    const sheetName = SHEET_NAMES.ALERTA || 'Alertas';
    let sheet = ss.getSheetByName(sheetName);

    // 3. Auto-create sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['ID', 'TIPO', 'MENSAJE', 'MODULO', 'FECHA', 'LEIDA', 'ACCION']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
    }

    // 4. Append Row
    const newRow = [
      'ALR-' + Math.random().toString(36).substr(2, 9).toUpperCase(), // ID
      tipo,                                                           // TIPO
      mensaje,                                                        // MENSAJE
      modulo,                                                         // MODULO
      formatDateTime(new Date()),                                     // FECHA (Local)
      'FALSE',                                                        // LEIDA
      accion                                                          // ACCION
    ];
    
    sheet.appendRow(newRow);
    Logger.log(`ALERTA REGISTRADA: ${mensaje}`);
    return true;

  } catch (e) {
    console.error(`ERROR createAlerta: ${e.toString()}`);
    return false; // Fail silently to not block main flow
  }
}

function checkBoolean(val) {
  if (val === true || val === 'TRUE' || val === 'true' || val === 'Verdadero' || val === 'VERDADERO' || val === 'SI' || val === 'SÍ' || val === 1 || val === '1') {
    return true;
  }
  return false;
}

function checkIdempotency(sheet, requestId, idColIdx) {
  if (!requestId) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]).trim() === String(requestId).trim()) {
      return createResponse(true, { id: requestId }, "Registro ya existe (idempotencia)");
    }
  }
  return null;
}



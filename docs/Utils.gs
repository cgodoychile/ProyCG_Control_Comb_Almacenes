/**
 * UTILIDADES GLOBALES
 */

function getSheet(sheetName) {
  // Ultra-defensive check with hardcoded fallback
  const finalSheetName = sheetName || "Actas"; 
  console.log(`[Utils] getSheet - Input: "${sheetName}", Using: "${finalSheetName}"`);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETID);
    let sheet = ss.getSheetByName(finalSheetName);
    
    if (!sheet) {
      console.warn(`[Utils] Sheet "${finalSheetName}" not found. Trying case-insensitive search.`);
      const allSheets = ss.getSheets();
      sheet = allSheets.find(s => s.getName().toLowerCase() === String(finalSheetName).toLowerCase());
    }
    
    if (!sheet) {
      console.error(`[Utils] CRITICAL: Sheet "${finalSheetName}" not found. Falling back to FIRST sheet.`);
      sheet = ss.getSheets()[0];
    }
    
    return sheet;
  } catch (e) {
    console.error(`[Utils] Fatal error in getSheet: ${e.toString()}`);
    throw e;
  }
}

function createResponse(success, data, message = "", statusCode = 200) {
  return {
    success: success,
    data: data,
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
}

function createErrorResponse(message, statusCode = 400) {
  return createResponse(false, null, message, statusCode);
}

// La función formatDate ahora se maneja al final del archivo para usar parseDate de forma segura.

/**
 * Limpia referencias de entidades eliminadas en otras hojas (ej: Bodega)
 * @param {string} tipo 'Vehiculo' o 'Estanque'
 * @param {string} id El identificador (Patente o ID)
 */
function cleanupWarehouseReferences(tipo, id) {
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    if (!sheet) return 0;
    
    const data = sheet.getDataRange().getValues();
    const colMap = findColumnIndices(sheet, {
        DESCRIPCION: ['DESCRIPCION', 'DETALLE']
    });
    const descIdx = colMap.DESCRIPCION !== -1 ? colMap.DESCRIPCION : 14;
    
    let count = 0;
    const searchStr = String(id).trim().toUpperCase();
    
    for (let i = data.length - 1; i >= 1; i--) {
      const desc = String(data[i][descIdx] || '').toUpperCase();
      if (desc.includes(searchStr)) {
        sheet.deleteRow(i + 1);
        count++;
      }
    }
    
    if (count > 0) SpreadsheetApp.flush();
    return count;
  } catch (e) {
    console.error("Error en cleanupWarehouseReferences: " + e.toString());
    return 0;
  }
}

function generateAutoId(prefix) {
  return prefix + "-" + Math.random().toString(36).substr(2, 5).toUpperCase() + "-" + new Date().getTime().toString().substr(-4);
}

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEETID);
}

function normalizeHeader(header) {
  if (!header) return '';
  return String(header)
    .toUpperCase()
    .trim()
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_');
}

function findColumnIndices(sheet, mapping) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const normalizedHeaders = headers.map(h => normalizeHeader(h));
  
  const result = {};
  
  for (const [key, aliases] of Object.entries(mapping)) {
    let foundIdx = -1;
    
    // 1. Try exact normalized match
    const normalizedKey = normalizeHeader(key);
    foundIdx = normalizedHeaders.indexOf(normalizedKey);
    
    // 2. Try aliases
    if (foundIdx === -1 && Array.isArray(aliases)) {
      for (const alias of aliases) {
        const normalizedAlias = normalizeHeader(alias);
        foundIdx = normalizedHeaders.indexOf(normalizedAlias);
        if (foundIdx !== -1) break;
      }
    }
    
    result[key] = foundIdx;
  }
  
  return result;
}

function generateSequentialId(prefix, sheetName, idHeaderName, padding = 4) {
  // Ultra-defensive fallback
  const finalSheetName = sheetName || (prefix === 'ACT' ? 'Activos' : 'Actas');
  if (!sheetName) {
    console.warn(`[Utils] generateSequentialId called with undefined sheetName. Using fallback: ${finalSheetName}. Prefix: ${prefix}`);
  }
  
  const sheet = getSheet(finalSheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return prefix + "-" + "1".padStart(padding, '0');
  
  const headers = data[0];
  const idIdx = headers.findIndex(h => normalizeHeader(h) === normalizeHeader(idHeaderName));
  
  if (idIdx === -1) return prefix + "-" + (data.length).toString().padStart(padding, '0');
  
  let maxNum = 0;
  for (let i = 1; i < data.length; i++) {
    const val = String(data[i][idIdx]);
    const match = val.match(/\d+$/);
    if (match) {
      const num = parseInt(match[0]);
      if (num > maxNum) maxNum = num;
    }
  }
  
  return prefix + "-" + (maxNum + 1).toString().padStart(padding, '0');
}

/**
 * Checks if a request with the same clientRequestId has already been processed
 */
function checkIdempotency(sheet, clientRequestId, idIdx) {
  if (!clientRequestId) return null;
  
  // We'll use a hidden column or metadata in a real app, 
  // but here we can check if it's already in the logs or just skip for now 
  // to avoid blocking the user.
  console.log(`Checking idempotency for: ${clientRequestId}`);
  return null; 
}

function registrarAccion(modulo, accion, mensaje, tipo, usuario, justificacion) {
  try {
    const sheetName = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.AUDITORIA) ? SHEET_NAMES.AUDITORIA : 'Auditoria';
    const sheet = getSheet(sheetName);
    const mapping = (typeof COLUMNS !== 'undefined') ? COLUMNS.AUDITORIA : null;
    
    // Si mapping no existe (Config desactualizada), prevenimos el crash
    if (!mapping) {
      console.warn("COLUMNS.AUDITORIA no definido. Usando mapeo por defecto.");
    }
    
    const id = generateSequentialId('LOG', sheetName, 'ID', 6);
    
    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 7)).getValues()[0];
    const newRow = Array(headers.length || 7).fill('');
    const idIdx = (mapping && mapping.ID !== undefined) ? mapping.ID : 0;
    
    newRow[idIdx] = id;
    newRow[(mapping && mapping.FECHA !== undefined) ? mapping.FECHA : 1] = new Date();
    newRow[(mapping && mapping.USUARIO !== undefined) ? mapping.USUARIO : 2] = usuario || 'Sistema';
    newRow[(mapping && mapping.ACCION !== undefined) ? mapping.ACCION : 3] = accion;
    newRow[(mapping && mapping.DETALLE !== undefined) ? mapping.DETALLE : 5] = mensaje + (justificacion ? ' | Justificación: ' + justificacion : '');
    newRow[(mapping && mapping.ENTIDAD !== undefined) ? mapping.ENTIDAD : 4] = modulo;
    newRow[(mapping && mapping.ESTADO !== undefined) ? mapping.ESTADO : 6] = tipo || 'info';
    
    sheet.appendRow(newRow);
    return true;
  } catch (e) {
    console.error("Error en registrarAccion: " + e.toString());
    return false;
  }
}

function checkBoolean(val) {
  if (val === true || val === 'true' || val === 'TRUE' || val === 1 || val === '1') return true;
  return false;
}

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  
  // Serial number from Excel/Sheets (approx)
  if (typeof val === 'number' || (typeof val === 'string' && val.length > 5 && !isNaN(val))) {
    const num = parseFloat(val);
    if (num > 30000) { // Likely a serial date
      return new Date((num - 25569) * 86400 * 1000);
    }
  }

  const s = String(val).trim();
  if (s === '-' || s === '') return null;
  
  // Standard format ISO YYYY-MM-DD
  if (s.match(/^\d{4}[-/]\d{2}[-/]\d{2}/)) return new Date(s.replace(/\//g, '-'));
  
  // DD/MM/YYYY
  const parts = s.split(/[-/ ]/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0]);
    const p1 = parseInt(parts[1]);
    const p2 = parseInt(parts[2]);
    if (p2 > 1000) return new Date(p2, p1 - 1, p0); // DD/MM/YYYY
    if (p0 > 1000) return new Date(p0, p1 - 1, p2); // YYYY/MM/DD
  }
  
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(date) {
  const d = parseDate(date);
  if (!d) return '-';
  try {
     return d.toISOString();
  } catch (e) {
     return String(date);
  }
}

function generateId(prefix) {
  return generateAutoId(prefix);
}

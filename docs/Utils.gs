/**
 * UTILITY FUNCTIONS
 * Helper functions used across all CRUD modules
 */

/**
 * Creates a standardized response object
 * @param {boolean} success - Whether the operation was successful
 * @param {*} data - The data to return (can be object, array, etc.)
 * @param {string} message - Optional error message
 * @returns {Object} Standardized response object
 */
function createResponse(success, data, message) {
  return {
    success: success,
    data: data,
    message: message || (success ? 'Operación exitosa' : 'Error en la operación')
  };
}

/**
 * Creates an error response object
 * @param {string} message - Error message
 * @param {number} code - Optional error code
 * @returns {Object} Error response object
 */
function createErrorResponse(message, code) {
  return {
    success: false,
    data: null,
    message: message,
    code: code || 500
  };
}

/**
 * Gets a sheet by name from the active spreadsheet
 * @param {string} sheetName - Name of the sheet to get
 * @returns {Sheet} The requested sheet
 * @throws {Error} If sheet is not found
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Hoja "${sheetName}" no encontrada`);
  }
  
  return sheet;
}

/**
 * Validates required fields in data object
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {Error} If any required field is missing
 */
function validateRequiredFields(data, requiredFields) {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }
}

/**
 * Generates a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
function generateId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Formats a date to dd-mm-aaaa format
 * @param {Date} date - Date to format
 * @returns {string} Date in dd-mm-aaaa format
 */
/**
 * Formats a date to dd-mm-aaaa format
 * @param {Date} date - Date to format
 * @returns {string} Date in dd-mm-aaaa format
 */
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  return Utilities.formatDate(d, "America/Santiago", "dd-MM-yyyy");
}

/**
 * Formats a date to dd-mm-aaaa HH:mm format
 * @param {Date} date - Date to format
 * @returns {string} Date and time
 */
function formatDateTime(date) {
  const d = date ? new Date(date) : new Date();
  return Utilities.formatDate(d, "America/Santiago", "dd-MM-yyyy HH:mm");
}

/**
 * Safely gets a value from an object with a default fallback
 * @param {Object} obj - Object to get value from
 * @param {string} key - Key to look for
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} The value or default
 */
function safeGet(obj, key, defaultValue) {
  return obj && obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Checks if a value represents a boolean TRUE, supporting Spanish "VERDADERO"
 * @param {*} val - Value to check
 * @returns {boolean}
 */
function checkBoolean(val) {
  if (val === true || val === 'true') return true;
  if (val === false || val === 'false') return false;
  if (typeof val === 'string') {
    const s = val.toUpperCase();
    return s === 'TRUE' || s === 'VERDADERO' || s === 'SÍ' || s === 'SI';
  }
  return !!val;
}
/**
 * Crea una alerta en el sistema
 * @param {string} tipo - success, info, warning, error
 * @param {string} mensaje - Descripción de la alerta
 * @param {string} modulo - Módulo origen
 * @param {string} accion - Acción realizada
 */
/**
 * Crea una alerta en el sistema y la registra en la hoja de Auditoría/Alertas
 * @param {string} tipo - success, info, warning, critical
 * @param {string} mensaje - Descripción de la alerta
 * @param {string} modulo - Módulo origen
 * @param {string} accion - Acción realizada
 */
function createAlerta(tipo, mensaje, modulo, accion) {
  try {
    Logger.log(`ALERTA: [${tipo}] ${modulo} - ${mensaje}`);
    // Vinculamos con registrarAccion para persistencia en Google Sheets
    if (typeof registrarAccion === 'function') {
      registrarAccion(modulo, accion, mensaje, tipo);
    } else {
      Logger.log('ADVERTENCIA: registrarAccion no está disponible. No se pudo persistir la alerta.');
    }
  } catch (e) {
    Logger.log('Error creando alerta: ' + e.toString());
  }
}

/**
 * Busca dinámicamente los índices de columnas basados en los nombres de cabecera (Fila 1)
 * @param {Sheet} sheet - La hoja de cálculo
 * @param {Object} columnMap - Mapeo de CLAVE_CONFIG a Array de posibles nombres. Ej: { ID: ['id', 'sku'], NOMBRE: ['nombre', 'name'] }
 * @returns {Object} Objeto con las mismas claves pero valores numéricos (índices 0-based)
 */
function findColumnIndices(sheet, columnMap) {
  // Leer cabeceras (Fila 1)
  const lastCol = Math.max(sheet.getLastColumn(), 20); // Leer al menos 20 por si acaso
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).toUpperCase().trim());
  
  const result = {};
  
  Object.keys(columnMap).forEach(key => {
    const possibleNames = columnMap[key].map(n => n.toUpperCase().trim());
    let foundIndex = -1;
    
    // Buscar coincidencia exacta o parcial
    for (const name of possibleNames) {
      foundIndex = headers.findIndex(h => h === name);
      if (foundIndex !== -1) break;
    }
    
    // Si no encuentra exacta, busca includes
    if (foundIndex === -1) {
      for (const name of possibleNames) {
         foundIndex = headers.findIndex(h => h.includes(name));
         if (foundIndex !== -1) break;
      }
    }
    
    result[key] = foundIndex;
  });
  
  return result;
}

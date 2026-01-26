function handleDebugGet(action) {
  switch (action.toLowerCase()) {
    case 'headers': return getAllSheetHeaders();
    case 'test': return testConnection();
    case 'getid': return getMySpreadsheetId();
    case 'info': return getSpreadsheetInfo();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

/**
 * Run this function manually in the script editor to see the ID of the current sheet
 */
function getMySpreadsheetId() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const id = ss.getId();
    console.log("TU SPREADSHEET_ID REAL ES: " + id);
    console.log("Asegúrate de que este ID coincida con el de Config.gs");
    return createResponse(true, { id: id }, "ID obtenido con éxito");
  } catch (e) {
    console.error("Error obteniendo ID: " + e.toString());
    return createErrorResponse("Error. ¿El script está vinculado a la hoja? " + e.toString());
  }
}

/**
 * Run this function manually in the script editor to authorize the script
 */
function testConnection() {
  try {
    const ss = getSS();
    return createResponse(true, { 
      name: ss.getName(), 
      id: ss.getId(),
      url: ss.getUrl()
    }, "Conexión exitosa");
  } catch (e) {
    return createErrorResponse("Error de conexión: " + e.toString());
  }
}

function getAllSheetHeaders() {
  try {
    const ss = getSS();
    const sheets = ss.getSheets();
    const result = {};
    
    sheets.forEach(sheet => {
      const name = sheet.getName();
      const lastCol = sheet.getLastColumn();
      if (lastCol > 0) {
        const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        // Convert to object mapping name -> index
        const headerMap = {};
        headers.forEach((h, i) => {
          headerMap[h] = i;
        });
        result[name] = {
          headers: headers,
          map: headerMap
        };
      } else {
        result[name] = { headers: [], map: {} };
      }
    });
    
    return createResponse(true, result);
  } catch (e) {
    return createErrorResponse("Error obteniendo cabeceras: " + e.toString());
  }
}

function getSpreadsheetInfo() {
  try {
    const ss = getSS();
    const now = new Date();
    return createResponse(true, {
      spreadsheetTimeZone: ss.getSpreadsheetTimeZone(),
      spreadsheetLocale: ss.getSpreadsheetLocale(),
      scriptTimeZone: Session.getScriptTimeZone(),
      currentTime: now.toString(),
      currentTimeISO: now.toISOString(),
      formattedGMT3: Utilities.formatDate(now, "GMT-3", "yyyy-MM-dd HH:mm:ss"),
      formattedSantiago: Utilities.formatDate(now, "America/Santiago", "yyyy-MM-dd HH:mm:ss")
    }, "Información de configuración obtenida");
  } catch (e) {
    return createErrorResponse("Error obteniendo info: " + e.toString());
  }
}

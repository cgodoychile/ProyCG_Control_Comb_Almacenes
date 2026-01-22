function handleDebugGet(action) {
  switch (action.toLowerCase()) {
    case 'headers': return getAllSheetHeaders();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllSheetHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
}

/**
 * Debug tool to check headers and data mapping
 */
function debugConsumosMapping() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAMES.CONSUMOS);
    
    if (!sheet) return "Hoja no encontrada: " + SHEET_NAMES.CONSUMOS;
    
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const normalizedHeaders = headers.map(h => normalizeHeader(h));
    
    const mapping = {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA'],
        EMPRESA: ['EMPRESA/USUARIO', 'EMPRESA', 'USER', 'USUARIO'],
        VEHICULO: ['VEHICULO', 'PATENTE', 'ACTIVO'],
        ESTANQUE: ['ESTANQUE'],
        LITROS: ['LITROS USADOS', 'LITROS'],
        KM: ['KILOMETRAJE', 'KM'],
        INI: ['CONTADOR INICIAL', 'INICIAL', 'CONTADOR_INICIAL'],
        FIN: ['CONTADOR FINAL', 'FINAL', 'CONTADOR_FINAL'],
        RESPONSABLE: ['PERSONAL RESPONSABLE', 'RESPONSABLE', 'ENCARGADO'],
        JUSTIFICACION: ['JUSTIFICACION', 'OBSERVACIONES', 'MOTIVO'],
        RENDIMIENTO: ['RENDIMIENTO']
    };
    
    const colMap = findColumnIndices(sheet, mapping);
    
    const report = {
      sheetName: sheet.getName(),
      lastColumn: lastCol,
      actualHeaders: headers,
      normalizedHeaders: normalizedHeaders,
      colMap: colMap,
      sampleRow: sheet.getRange(2, 1, 1, lastCol).getValues()[0]
    };
    
    return JSON.stringify(report, null, 2);
  } catch (e) {
    return "Error: " + e.toString();
  }
}

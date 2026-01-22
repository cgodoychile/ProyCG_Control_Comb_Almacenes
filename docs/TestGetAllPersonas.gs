/**
 * TEST FUNCTION: Debug getAllPersonas
 * Run this function in Google Apps Script to see what's happening
 */
function testGetAllPersonas() {
  try {
    Logger.log('=== TESTING getAllPersonas ===');
    
    // Test 1: Check if sheet exists
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.PERSONAS);
    
    if (!sheet) {
      Logger.log('ERROR: Sheet "' + SHEET_NAMES.PERSONAS + '" not found!');
      Logger.log('Available sheets: ' + ss.getSheets().map(s => s.getName()).join(', '));
      return;
    }
    
    Logger.log('✓ Sheet found: ' + sheet.getName());
    
    // Test 2: Get all data
    const data = sheet.getDataRange().getValues();
    Logger.log('Total rows: ' + data.length);
    
    if (data.length <= 1) {
      Logger.log('WARNING: Sheet has only headers or is empty');
      return;
    }
    
    // Test 3: Show headers
    Logger.log('Headers: ' + JSON.stringify(data[0]));
    
    // Test 4: Show column configuration
    Logger.log('Column Config: ' + JSON.stringify(COLUMNS.PERSONAS));
    
    // Test 5: Show first data row
    if (data.length > 1) {
      Logger.log('First data row: ' + JSON.stringify(data[1]));
      Logger.log('ID from first row: ' + data[1][COLUMNS.PERSONAS.ID]);
      Logger.log('Nombre from first row: ' + data[1][COLUMNS.PERSONAS.NOMBRE_COMPLETO]);
    }
    
    // Test 6: Call the actual function
    const result = getAllPersonas();
    Logger.log('getAllPersonas result: ' + JSON.stringify(result));
    
    return result;
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
  }
}

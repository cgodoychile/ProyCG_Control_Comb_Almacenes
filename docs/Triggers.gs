/**
 * GOOGLE APPS SCRIPT TRIGGERS
 * Handles automatic updates when the spreadsheet is edited manually.
 */

function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  const numRows = range.getNumRows();
  
  // 1. Alert for Massive Data Load
  if (numRows > 10) {
    // We can't show a browser alert from a server-side trigger easily without a client open,
    // but we can log it or create a "Notification" in a hidden sheet that the app polls.
    // For now, let's log it.
    console.log("Massive load detected: " + numRows + " rows edited in " + sheetName);
  }

  // 2. Sync Consumos with Estanques (Deduct stock)
  // If editing the 'EnelComb' sheet
  if (sheetName === SHEET_NAMES.CONSUMOS) {
    handleConsumoStockSync(e);
  }
}

/**
 * When a consumption is recorded manually in Google Sheets, 
 * deduct the liters from the corresponding tank.
 */
function handleConsumoStockSync(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const row = range.getRow();
  
  // Skip header
  if (row <= 1) return;
  
  // Get data from the edited row
  const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const estanqueNombre = rowValues[COLUMNS.CONSUMOS.ESTANQUE];
  const litrosUsados = rowValues[COLUMNS.CONSUMOS.LITROS_USADOS];
  
  if (!estanqueNombre || !litrosUsados || isNaN(litrosUsados)) return;
  
  // Update the tank stock
  updateEstanqueStock(estanqueNombre, -litrosUsados);
}

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

  // 2. Sync Consumos with Estanques (Deduct stock) & Auto-ID
  // If editing the 'EnelComb' sheet
  if (sheetName === SHEET_NAMES.CONSUMOS) {
    handleConsumoAutoId(e);
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

/**
 * Automatically generates an ID for new rows added manually to the Consumos sheet.
 */
function handleConsumoAutoId(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const row = range.getRow();
  
  if (row <= 1) return; // Header

  // Check if ID is present
  // We use findColumnIndices to be safe, or fallback to Config
  // Since we are inside a trigger, let's try to be lightweight but robust enough.
  // We'll trust column 1 (index 0) is ID as per standard, but let's check header if possible.
  // To avoid overhead, we'll check the value at Column 1 of the current row.
  
  // We need to know which column is ID. 
  // Config.gs says COLUMNS.CONSUMOS.ID = 0 (Column A).
  // Let's assume Column 1 is ID.
  const idCell = sheet.getRange(row, 1);
  const idValue = idCell.getValue();
  
  if (!idValue || String(idValue).trim() === '') {
    // Generate new ID
    const newId = generateSequentialId('CONS', SHEET_NAMES.CONSUMOS, 'ID', 7);
    idCell.setValue(newId);
    console.log(`Generated Auto ID for row ${row}: ${newId}`);
  }
}

/**
 * FUNCIÓN MAESTRA: Ejecute esta función para arreglar TODO de una vez.
 */
function RUN_COMPLETE_REPAIR() {
  Logger.log("--- INICIANDO REPARACIÓN ESTRUCTURAL ---");
  
  Logger.log("Paso 1: Normalizando cabeceras (Normalizando ID en Columna A)...");
  Logger.log(repairWarehouseStructures());
  
  Logger.log("Paso 2: Corrigiendo desplazamientos en CargasEstanques...");
  Logger.log(fixShiftedCargas());
  
  Logger.log("Paso 3: Corrigiendo desplazamientos e IDs en Agendamientos...");
  Logger.log(fixShiftedAgendamientos());
  
  Logger.log("--- PROCESO FINALIZADO CON ÉXITO ---");
  return "Reparación finalizada. Verifique sus hojas CargasEstanques y Agendamientos.";
}

function fixShiftedCargas() {
  const sheet = getSheet(SHEET_NAMES.CARGAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  if (headers[0].toUpperCase() !== 'ID') {
    return "Error: Primero ejecute 'repairWarehouseStructures' para normalizar las cabeceras.";
  }

  let fixedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // CASO 1: A vacío, B tiene ID
    if (!row[0] && String(row[1]).includes('CAR')) {
      const newRow = [...row];
      const idVal = row[1];
      newRow.splice(1, 1); // Quita el ID de Col B
      newRow[0] = idVal; // Lo pone en Col A
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      fixedCount++;
    }
    // CASO 2: A tiene la fecha y B tiene ID (desfase total)
    else if (String(row[0]).includes('-') && String(row[1]).includes('CAR')) {
      const newRow = Array(headers.length).fill('');
      newRow[0] = row[1]; // ID
      newRow[1] = row[0]; // FECHA
      // Intentar recuperar el resto desplazado
      for(let j=2; j<row.length; j++) {
        if(j < headers.length) newRow[j] = row[j];
      }
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      fixedCount++;
    }
  }
  return `Se corrigieron ${fixedCount} filas en Cargas.`;
}

function fixShiftedAgendamientos() {
  const sheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  if (headers[0].toUpperCase() !== 'ID') {
    return "Error: Primero ejecute 'repairWarehouseStructures' para normalizar las cabeceras.";
  }

  let fixedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Detectar si el ID está desplazado (B tiene el ID)
    if (!row[0] && String(row[1]).includes('AGE')) {
       const newRow = [...row];
       const idVal = row[1];
       newRow.splice(1, 1);
       newRow[0] = idVal;
       sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
       fixedCount++;
    }
    // Si no tiene ID en absoluto (A vacío y B tiene fecha)
    else if (!row[0] && (String(row[1]).includes('/') || String(row[1]).includes('-'))) {
       const idVal = generateSequentialId('AGEN', SHEET_NAMES.AGENDAMIENTOS, 'ID', 7);
       sheet.getRange(i + 1, 1).setValue(idVal);
       fixedCount++;
    }
  }
  return `Se corrigieron ${fixedCount} filas en Agendamientos.`;
}

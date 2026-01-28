/**
 * SCRIPT DE REPARACIÓN: AGENDAMIENTOS
 * Ejecutar esta función desde el editor de Google Apps Script para normalizar la hoja.
 */
function repairAgendamientosSheet() {
  const sheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
  const HEADER_ROW = ['ID', 'FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'];
  
  // 1. Obtener datos actuales
  let data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    sheet.appendRow(HEADER_ROW);
    return "Hoja vacía, se crearon cabeceras.";
  }

  // 2. Identificar filas de datos reales (saltando cabeceras duplicadas o basura)
  const cleanData = [];
  data.forEach((row, index) => {
    const rowStr = row.join(' ').toUpperCase();
    // Saltar si es una fila de cabecera o está vacía
    if (rowStr.includes('ID') && rowStr.includes('FECHA')) return;
    if (rowStr.trim() === '') return;
    if (row[0] === '' && row[1] === '') return;
    
    cleanData.push(row);
  });

  // 3. Normalizar cada fila al nuevo esquema de 13 columnas
  const normalizedData = cleanData.map((row, index) => {
    const newRow = Array(13).fill('');
    
    // Si la fila parece estar desplazada (ej: ID es una fecha ISO)
    let idVal = String(row[0]);
    let fechaVal = row[1];
    
    // Heurística de reparación: Si el ID no empieza con AGEN y la columna 0 parece fecha
    if (!idVal.startsWith('AGEN-') && (idVal.includes('T') || idVal.includes('-202'))) {
        // Probablemente el ID está ausente y los datos empezaron en col 0
        // Desplazamos los datos hacia la derecha
        for (let i = 0; i < row.length; i++) {
            if (i + 1 < 13) newRow[i + 1] = row[i];
        }
        newRow[0] = ""; // ID vacío para generar luego
    } else {
        // Copiar tal cual hasta el límite
        row.forEach((val, i) => { if (i < 13) newRow[i] = val; });
    }
    
    return newRow;
  });

  // 4. Limpiar hoja y escribir cabeceras + datos procesados
  sheet.clear();
  sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
  
  if (normalizedData.length > 0) {
    sheet.getRange(2, 1, normalizedData.length, HEADER_ROW.length).setValues(normalizedData);
  }

  // 5. Generar IDs faltantes
  const finalData = sheet.getDataRange().getValues();
  let maxNum = 0;
  
  // Encontrar el máximo ID actual
  for (let i = 1; i < finalData.length; i++) {
    const idVal = String(finalData[i][0]);
    const match = idVal.match(/AGEN-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  }

  // Asignar IDs a los que no tienen
  for (let i = 1; i < finalData.length; i++) {
    if (String(finalData[i][0]).trim() === "" || !String(finalData[i][0]).startsWith('AGEN-')) {
      maxNum++;
      const newId = "AGEN-" + String(maxNum).padStart(5, '0');
      sheet.getRange(i + 1, 1).setValue(newId);
    }
  }

  return "Reparación completada. " + normalizedData.length + " filas procesadas.";
}

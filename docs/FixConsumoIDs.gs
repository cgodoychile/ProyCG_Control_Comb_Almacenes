/**
 * UTILIDAD DE REPARACIÓN DE IDs
 * Ejecutar esta función una sola vez para asignar IDs a las filas antiguas
 * que no tengan uno en la hoja 'EnelComb'.
 */

function fixMissingConsumoIds() {
  const sheet = getSheet(SHEET_NAMES.CONSUMOS); // 'EnelComb'
  const data = sheet.getDataRange().getValues();
  
  // Asumimos que la columna ID es la primera (índice 0)
  // Pero usamos findColumnIndices por seguridad
  const colMap = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'] });
  const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
  
  let fixedCount = 0;
  
  // Empezar desde la fila 2 (índice 1) para saltar encabezados
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentId = String(row[idIdx]).trim();
    
    // Verificar si la fila tiene datos pero no tiene ID
    // (Chequeamos si hay fecha o vehículo para asegurar que no es una fila vacía)
    const hasData = String(row[1]).trim() !== '' || String(row[3]).trim() !== ''; 
    
    if (hasData && (!currentId || currentId === '')) {
      // Generar nuevo ID
      // Nota: generateSequentialId lee la hoja cada vez, lo cual es lento en un bucle masivo,
      // pero seguro para evitar duplicados. Si son muchos registros (100+), podría optimizarse.
      const newId = generateSequentialId('CONS', SHEET_NAMES.CONSUMOS, 'ID', 7);
      
      // Escribir directamente en la celda (i + 1 para índice basado en 1)
      sheet.getRange(i + 1, idIdx + 1).setValue(newId);
      
      // Actualizar el valor en memoria data para que el siguiente generateSequentialId lo contemple
      // (aunque generateSequentialId lee de la hoja, así que setValue es suficiente)
      console.log(`Fila ${i + 1}: Asignado ID ${newId}`);
      fixedCount++;
      
      // Pequeña pausa para asegurar que se guarde si son muchos
      if (fixedCount % 10 === 0) SpreadsheetApp.flush();
    }
  }
  
  console.log(`Proceso completado. Total IDs corregidos: ${fixedCount}`);
  return `Corregidos ${fixedCount} registros.`;
}

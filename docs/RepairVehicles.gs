/**
 * SCRIPT PARA REPARAR DATOS DESPLAZADOS EN LA HOJA DE VEHICULOS
 * Detecta valores fuera de lugar y los mueve a sus columnas correctas.
 */
function repairVehiclesStructure() {
  const sheet = getSheet(SHEET_NAMES.VEHICULOS);
  const headers = ['Patente', 'Marca', 'Modelo', 'Año', 'Tipo', 'Estado', 'Kilometraje', 'Última Mnatención', 'Próxima Mantención', 'Próxima KM', 'Responsable', 'Ubicación'];
  
  // Asegurar encabezados correctos (Forzar sobreescritura para limpiar basura en I, J, K...)
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return "No hay datos para reparar";

  let fixedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // El desplazamiento detectado:
    // Col I (idx 8) tiene "Próxima Mantención" (Fecha)
    // Col J (idx 9) tiene "Responsable" (Ej: 'TESTUSER') -> DEBERIA SER PRÓXIMA KM
    // Col K (idx 10) tiene "Ubicación" -> DEBERIA SER RESPONSABLE
    // Col L (idx 11) tiene basura o dato de ubicación -> DEBERIA SER UBICACIÓN
    
    // Si la col 9 tiene un string que NO es un número y la col 8 es una fecha...
    const val8 = row[8]; // Fecha Prox. Mnt
    const val9 = row[9]; // Debería ser KM (número), pero el usuario dice que hay nombres/fechas
    const val10 = row[10]; 
    const val11 = row[11];

    // Lógica de detección: Si el valor en idx 9 (Col J) NO es numérico, probablemente sea el responsable desplazado.
    if (val9 && isNaN(val9) && typeof val9 === 'string') {
        const patent = row[0];
        const marca = row[1];
        const modelo = row[2];
        const anio = row[3];
        const tipo = row[4];
        const estado = row[5];
        const km = row[6];
        const ult = row[7];
        const proxFecha = row[8];
        
        // El desplazamiento: El KM que debería estar en 9, se perdió o está en otro lado.
        // El responsable está en 9.
        // La ubicación está en 10 o 11.
        
        const responsable = val9;
        const ubicacion = val10 || val11 || '';
        const proxKm = 0; // No podemos adivinarlo si se perdió, o asignamos un default
        
        const newRow = [patent, marca, modelo, anio, tipo, estado, km, ult, proxFecha, proxKm, responsable, ubicacion];
        sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        // Limpiar columna L si quedó algo
        sheet.getRange(i + 1, 13).clearContent(); 
        fixedCount++;
    }
  }

  return `Reparación completada. Se corrigieron ${fixedCount} filas en Vehiculos.`;
}

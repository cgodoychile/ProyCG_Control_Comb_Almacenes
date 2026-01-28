/**
 * REPARACIÓN DEFINITIVA DE MANTENCIONES - SMART V3
 */
function repairMantencionesStructure() {
  const sheet = getSheet(SHEET_NAMES.MANTENCIONES);
  const headers = ['ID', 'FECHA_INGRESO', 'VEHICULO', 'TIPO_MANTENCION', 'KM_ACTUAL', 'PROXIMA_MANTENCION_KM', 'PROXIMA_MANTENCION_FECHA', 'TALLER', 'COSTO', 'OBSERVACION', 'ESTADO', 'RESPONSABLE'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return "No hay datos";

  let fixedCount = 0;
  const estadosValidos = ['Completada', 'En Proceso', 'Agendada', 'Cancelada'];
  let logOutput = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] || String(row[0]).trim() === "" || row[0] === 'ID') continue;

    const rowStr = row.map(c => String(c).trim());
    const rowRaw = row.map(c => c);
    const originalId = String(row[0]);
    
    // --- IDENTIFICACIÓN FORENSE ---
    let id = originalId.replace('MAN-', 'MANT-').trim();
    let fecha = rowRaw[1]; 
    let veh = String(rowStr[2] || '').trim();
    let tipo = String(rowStr[3] || '').trim();
    
    // 1. Buscar KM (Número > 100)
    let kmActual = 0;
    for (let j = 4; j < 6; j++) {
      const val = parseFloat(rowStr[j]);
      if (!isNaN(val) && val > 100 && !rowStr[j].includes('/') && !rowStr[j].includes('-')) {
        kmActual = val;
        break;
      }
    }

    // 2. Buscar Estado
    let estado = "Completada";
    for (let j = 4; j < rowStr.length; j++) {
      const val = rowStr[j].toUpperCase();
      const match = estadosValidos.find(ev => ev.toUpperCase() === val);
      if (match) {
        estado = match;
        break;
      }
    }

    // 3. Buscar Próxima Fecha
    let proxFecha = "";
    for (let j = 4; j < 9; j++) {
      if ((rowStr[j].includes('/') || rowStr[j].includes('-')) && isNaN(parseFloat(rowStr[j]))) {
         if (j > 1 && rowStr[j].length > 5) {
            proxFecha = rowStr[j];
            break;
         }
      }
    }

    // 4. Buscar Responsable
    let resp = "";
    for (let j = rowStr.length - 1; j >= 9; j--) {
      const val = rowStr[j].toLowerCase();
      if (val === 'admin' || val.includes('@')) {
        resp = rowStr[j];
        break;
      }
    }

    // 5. Taller
    let taller = "";
    for (let j = 4; j < 10; j++) {
       const val = rowStr[j];
       if (val && !val.includes('/') && isNaN(parseFloat(val)) && 
           !estadosValidos.map(ev => ev.toUpperCase()).includes(val.toUpperCase()) &&
           val !== resp && val !== veh && val !== tipo) {
           taller = val;
           break;
       }
    }

    // 6. Costo
    let costo = 0;
    for (let j = 6; j < 11; j++) {
      const val = parseFloat(rowStr[j]);
      if (!isNaN(val) && val !== kmActual && val !== 0) {
        costo = val;
        break;
      }
    }

    // --- RECONSTRUCCIÓN FINAL ---
    const newRow = Array(12).fill('');
    newRow[0] = id;
    newRow[1] = fecha;
    newRow[2] = veh;
    newRow[3] = tipo;
    newRow[4] = kmActual;
    newRow[5] = 0; 
    newRow[6] = proxFecha;
    newRow[7] = taller;
    newRow[8] = costo;
    newRow[9] = ""; 
    newRow[10] = estado;
    newRow[11] = resp;

    sheet.getRange(i + 1, 1, 1, 12).setValues([newRow]);
    fixedCount++;
  }

  return `SMART-REPAIR V3: ${fixedCount} filas procesadas exitosamente.`;
}

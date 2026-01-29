/**
 * GESTIÓN CENTRALIZADA DE ALERTAS
 */

function createAlerta(modulo, tipo, mensaje, responsable, accion) {
  try {
    const sheet = getSheet('Alertas');
    if (!sheet) {
      console.error("Hoja Alertas no encontrada");
      return null;
    }
    
    // Use dynamic mapping
    const colMap = findColumnIndices(sheet, {
        ID: ['ID'],
        FECHA: ['FECHA', 'DATE', 'TIMESTAMP'],
        TIPO: ['TIPO', 'LEVEL', 'NIVEL'],
        MODULO: ['MODULO', 'SOURCE', 'ORIGEN'],
        MENSAJE: ['MENSAJE', 'MSG', 'DETALLE'],
        RESPONSABLE: ['RESPONSABLE', 'USER', 'USUARIO'],
        ESTADO: ['ESTADO', 'STATUS'],
        ACCION: ['ACCION', 'ACTION', 'DATA']
    });

    // Fallback to strict array if headers are missing (Sheet initialization)
    if (Object.keys(colMap).length === 0) {
       // Assuming it was just created or empty
       sheet.appendRow(['ID', 'FECHA', 'TIPO', 'MODULO', 'MENSAJE', 'RESPONSABLE', 'ESTADO', 'ACCION']);
       return createAlerta(modulo, tipo, mensaje, responsable, accion); // Retry once
    }

    const id = "ALR-" + new Date().getTime();
    
    // Determine max column index to create the array
    const maxIdx = Math.max(...Object.values(colMap), 7);
    const newRow = Array(maxIdx + 1).fill('');

    const set = (keyIdx, val) => {
        if (keyIdx !== -1) newRow[keyIdx] = val;
    };

    // Default indices if mapping fails but headers exist (Fail-safe order: ID, FECHA, TIPO, MODULO, MENSAJE, RESPONSABLE, ESTADO, ACCION)
    set(colMap.ID !== -1 ? colMap.ID : 0, id);
    set(colMap.FECHA !== -1 ? colMap.FECHA : 1, new Date());
    set(colMap.TIPO !== -1 ? colMap.TIPO : 2, (tipo || 'info').toLowerCase());
    set(colMap.MODULO !== -1 ? colMap.MODULO : 3, (modulo || 'Sistema').charAt(0).toUpperCase() + (modulo || 'Sistema').slice(1).toLowerCase());
    set(colMap.MENSAJE !== -1 ? colMap.MENSAJE : 4, String(mensaje || ''));
    set(colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : 5, responsable || 'Sistema');
    set(colMap.ESTADO !== -1 ? colMap.ESTADO : 6, 'PENDIENTE');
    set(colMap.ACCION !== -1 ? colMap.ACCION : 7, typeof accion === 'object' ? JSON.stringify(accion) : String(accion || ''));
    
    sheet.appendRow(newRow);
    return id;
  } catch (e) {
    console.error("Error creando alerta: " + e.toString());
    return null;
  }
}

function getActiveAlertas() {
  try {
    const sheet = getSheet('Alertas');
    if (!sheet) return createResponse(true, []);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID'],
        FECHA: ['FECHA'],
        TIPO: ['TIPO'],
        MODULO: ['MODULO'],
        MENSAJE: ['MENSAJE'],
        RESPONSABLE: ['RESPONSABLE'],
        ESTADO: ['ESTADO'],
        ACCION: ['ACCION']
    });

    const alertas = [];
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    const stIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : 6;
    
    // Leer desde el final, ignorando cabecera
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[idIdx]) continue; 
      
      const estado = String(row[stIdx] || 'PENDIENTE').toUpperCase();
      if (estado !== 'PENDIENTE') continue;

      alertas.push({
        id: String(row[idIdx]),
        fecha: formatDate(row[colMap.FECHA !== -1 ? colMap.FECHA : 1]),
        tipo: String(row[colMap.TIPO !== -1 ? colMap.TIPO : 2] || 'info').toLowerCase(),
        modulo: String(row[colMap.MODULO !== -1 ? colMap.MODULO : 3] || 'Sistema'),
        mensaje: String(row[colMap.MENSAJE !== -1 ? colMap.MENSAJE : 4] || ''),
        responsable: String(row[colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : 5] || 'Sistema'),
        estado: estado,
        accion: String(row[colMap.ACCION !== -1 ? colMap.ACCION : 7] || '')
      });
    }
    
    return createResponse(true, alertas);
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function markAlertaAsSeen(id) {
  try {
    const sheet = getSheet('Alertas');
    const data = sheet.getDataRange().getValues();
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID'],
        ESTADO: ['ESTADO']
    });
    
    const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
    const stIdx = colMap.ESTADO !== -1 ? colMap.ESTADO : 6;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id)) {
        sheet.getRange(i + 1, stIdx + 1).setValue('VISTO');
        return createResponse(true, null, "Alerta marcada como vista");
      }
    }
    return createErrorResponse("Alerta no encontrada");
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function repairAlertasData() {
  // Not strictly needed with dynamic mapping, but kept for legacy cleanup if requested
  return "Función de reparación manual deshabilitada. El sistema ahora usa mapeo dinámico.";
}

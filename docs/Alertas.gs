/**
 * GESTIÓN CENTRALIZADA DE ALERTAS
 */

function createAlerta(modulo, tipo, mensaje, responsable, accion) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETID);
    const sheet = ss.getSheetByName('Alertas') || ss.insertSheet('Alertas');
    
    // MAPEO POSICIONAL ESTRICTO v1.1 (ID, FECHA, TIPO, MODULO, MENSAJE, RESPONSABLE, ESTADO, ACCION)
    const id = "ALR-" + new Date().getTime();
    const fecha = new Date();
    
    const newRow = Array(8).fill('');
    newRow[0] = id;
    newRow[1] = fecha;
    newRow[2] = (tipo || 'info').toLowerCase();
    newRow[3] = (modulo || 'Sistema').charAt(0).toUpperCase() + (modulo || 'Sistema').slice(1).toLowerCase();
    newRow[4] = String(mensaje || '');
    newRow[5] = responsable || 'Sistema';
    newRow[6] = 'PENDIENTE';
    newRow[7] = typeof accion === 'object' ? JSON.stringify(accion) : String(accion || '');
    
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow(['ID', 'FECHA', 'TIPO', 'MODULO', 'MENSAJE', 'RESPONSABLE', 'ESTADO', 'ACCION']);
    }
    
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 8).setValues([newRow]);
    SpreadsheetApp.flush();
    return id;
  } catch (e) {
    console.error("Error creando alerta: " + e.toString());
    return null;
  }
}

function getActiveAlertas() {
  try {
    const sheet = getSheet(SHEET_NAMES.ALERTAS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    const mapping = COLUMNS.ALERTAS;
    const alertas = [];
    
    // Leer desde el final, ignorando cabecera
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[0]) continue; // Saltar filas vacías
      
      const estado = String(row[6] || 'PENDIENTE').toUpperCase();
      if (estado !== 'PENDIENTE') continue;

      alertas.push({
        id: String(row[0]),
        fecha: formatDate(row[1]),
        tipo: String(row[2] || 'info').toLowerCase(),
        modulo: String(row[3] || 'Sistema'),
        mensaje: String(row[4] || ''),
        responsable: String(row[5] || 'Sistema'),
        estado: estado,
        accion: String(row[7] || '')
      });
    }
    
    return createResponse(true, alertas);
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function markAlertaAsSeen(id) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALERTAS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.getRange(i + 1, 7).setValue('VISTO'); // Columna G
        return createResponse(true, null, "Alerta marcada como vista");
      }
    }
    return createErrorResponse("Alerta no encontrada");
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

/**
 * REPARACIÓN FORENSE DE ALERTAS v1.1
 * Basado en el patrón de desalineación detectado
 */
function repairAlertasData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETID);
    const sheet = ss.getSheetByName('Alertas');
    if (!sheet) return "Hoja Alertas no encontrada";
    
    const data = sheet.getDataRange().getValues();
    const fixedRows = [];
    // Cabecera Estándar v1.1
    fixedRows.push(['ID', 'FECHA', 'TIPO', 'MODULO', 'MENSAJE', 'RESPONSABLE', 'ESTADO', 'ACCION']);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue;

      let id = String(row[0] || '');
      let fecha = new Date();
      let tipo = 'info';
      let modulo = 'Sistema';
      let mensaje = '';
      let responsable = 'Sistema';
      let estado = 'PENDIENTE';
      let accion = '';

      // HEURÍSTICA DE REPARACIÓN
      row.forEach((cell, idx) => {
        const s = String(cell || "").trim();
        
        // Buscar ID
        if (s.startsWith("ALR-")) id = s;
        
        // Buscar Fecha (puede estar en B o F según el desfase)
        if (cell instanceof Date || (s.includes(":") && !isNaN(new Date(s).getTime()))) {
           fecha = new Date(cell);
        }

        // Buscar Tipo
        if (['info', 'warning', 'critical', 'success', 'high', 'alta'].includes(s.toLowerCase())) {
          tipo = s.toLowerCase().replace('alta', 'critical').replace('high', 'warning');
        }

        // Buscar Estado/Leída
        if (['pendiente', 'visto', 'leida', 'leído'].includes(s.toLowerCase())) {
          estado = s.toUpperCase().replace('LEIDA', 'VISTO').replace('LEÍDO', 'VISTO');
        }
      });

      // Mapeo por Posición Específica (Parche para el desfase detectado)
      // Patrón 1: [ID, FECHA_MAL, TIPO_MAL, MODULO, EMPTY, FECHA_BIEN, USER, ACCION]
      if (row.length >= 6) {
        if (row[1] instanceof Date && !id.startsWith("ALR-")) {
          // Si no hay ID en A, tal vez está en otro lado? No, generamos uno.
        }
        
        // Si hay un nombre de usuario en G (pos 6), lo tomamos como responsable
        const potentialUser = String(row[6] || "").trim();
        if (potentialUser && !['PENDIENTE', 'VISTO'].includes(potentialUser.toUpperCase()) && potentialUser.length > 2) {
          responsable = potentialUser;
        }

        // El mensaje suele ser la columna más larga o estar en C/E
        mensaje = String(row[4] || row[3] || row[2] || "");
        if (mensaje === modulo || mensaje === tipo) mensaje = String(row[4] || "");
        
        modulo = String(row[3] || modulo);
        accion = String(row[7] || "");
      }

      if (!id) id = "ALR-AUTO-" + i;
      fixedRows.push([id, fecha, tipo, modulo, mensaje, responsable, estado, accion]);
    }

    sheet.clear();
    sheet.getRange(1, 1, fixedRows.length, 8).setValues(fixedRows);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f4f6");
    SpreadsheetApp.flush();
    
    return `Reparación Alertas v1.1 completada: ${fixedRows.length - 1} registros.`;
  } catch (e) {
    return "Error: " + e.toString();
  }
}

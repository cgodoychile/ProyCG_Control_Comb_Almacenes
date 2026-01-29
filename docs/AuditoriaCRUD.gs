/**
 * CRUD Operations for Audit Logs / Alerts
 * Refactored to use fully dynamic column mapping.
 */

function handleAuditoriaGet(action) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllAuditoria();
    case 'setup': return setupAuditoria();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleAuditoriaPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createAuditEntry(data);
    case 'delete': return handleDelete('AUDITORIA', id, data);
    case 'approveanddelete': return approveAndDelete(id, data);
    case 'repair': return createResponse(true, repairAuditoriaData());
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function createAuditEntry(data) {
  const success = registrarAccion(
    data.modulo,
    data.accion,
    data.mensaje,
    data.tipo,
    data.usuario,
    data.justificacion,
    data.itemName || null // Optional name to avoid raw ID in log
  );
  if (success) {
    return createResponse(true, null, "Log registrado exitosamente");
  } else {
    return createErrorResponse("Error al registrar el log");
  }
}

/**
 * Creates the Auditoria sheet if it doesn't exist
 */
function setupAuditoria() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetName = SHEET_NAMES.AUDITORIA || 'Auditoria';
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Create Headers (Consistent 8 columns)
      const headers = ['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO', 'JUSTIFICACION'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      
      return createResponse(true, { message: 'Hoja ' + sheetName + ' creada correctamente con 8 columnas' });
    }
    
    return createResponse(true, { message: 'La hoja ' + sheetName + ' ya existe' });
  } catch (error) {
    return createErrorResponse('Error creando hoja de logs: ' + error.toString());
  }
}

/**
 * Obtiene todos los registros de auditoría con detección de desplazamiento
 */
function getAllAuditoria() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETID);
    const sheet = ss.getSheetByName('Auditoria') || ss.getSheetByName('Auditoría');
    if (!sheet) return createResponse(true, []);
    
    // COORDINADAS ABSOLUTAS v8.5 (A-H Alignment)
    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(8, sheet.getLastColumn());
    if (lastRow <= 1) return createResponse(true, []);

    // Leemos desde la celda A1 obligatoriamente para que los índices sean exactos
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const mapping = {
      'id': ['ID'], 
      'fecha': ['FECHA'], 
      'usuario': ['USUARIO'], 
      'modulo': ['MODULO'],
      'accion': ['ACCION'], 
      'mensaje': ['MENSAJE'], 
      'tipo': ['TIPO'],
      'justificacion': ['JUSTIFICACION', 'MOTIVO']
    };
    const indices = findColumnIndices(sheet, mapping);
    
    // Mapeo Estricto v8.6 (ID, FECHA, USUARIO, MODULO, ACCION, MENSAJE, TIPO, JUSTIFICACION)
    const logs = [];
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[0] && !row[1]) continue;

      let id = String(row[0] || '');
      let rawFecha = row[1];
      let usuario = String(row[2] || 'Sistema');
      let modulo = String(row[3] || 'Sistema');
      let accion = String(row[4] || 'acción');
      let mensaje = String(row[5] || '');
      let tipo = String(row[6] || 'info').toLowerCase();
      let justificacion = String(row[7] || '');

      let fechaIso = '';
      if (rawFecha instanceof Date) {
        fechaIso = rawFecha.toISOString();
      } else if (rawFecha) {
        const d = parseDate(rawFecha);
        fechaIso = d ? d.toISOString() : String(rawFecha);
      } else {
        fechaIso = new Date().toISOString();
      }

      logs.push({
        id: id || ('AUD-GEN-' + i),
        fecha: fechaIso,
        usuario: usuario,
        modulo: modulo,
        accionRealizada: accion,
        mensaje: mensaje,
        tipo: tipo,
        justificacion: justificacion
      });
    }
    
    return createResponse(true, logs);
  } catch (error) {
    console.error('Error en getAllAuditoria v8.7:', error.toString());
    return createErrorResponse('Error: ' + error.toString());
  }
}

/**
 * Re-estructura la hoja siguiendo el estándar ABSOLUTO v8.7 (ID, FECHA, USUARIO, MODULO, ACCION, MENSAJE, TIPO, JUSTIFICACION)
 */
function repairAuditoriaData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEETID);
    const sheet = ss.getSheetByName('Auditoria') || ss.getSheetByName('Auditoría');
    if (!sheet) return "Hoja no encontrada";
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 1) return "Nada que reparar";

    const data = sheet.getDataRange().getValues();
    const fixedRows = [];
    // Cabecera v8.6
    fixedRows.push(['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO', 'JUSTIFICACION']);
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let id = "", fecha = new Date(), user = "Sistema", mod = "Sistema", acc = "crear", msg = "", type = "info", just = "";

        // 1. EXTRAER POR TIPO (Identificación heurística)
        row.forEach((cell, idx) => {
          const s = String(cell || "").trim();
          if (s.startsWith("AUD-")) id = s;
          else if (cell instanceof Date) fecha = cell;
          else if (['info', 'success', 'warning', 'critical'].includes(s.toLowerCase())) type = s.toLowerCase();
          else if (idx === 0 && !isNaN(new Date(cell).getTime()) && !s.startsWith("AUD-")) {
             // Si el ID es una fecha, la recuperamos
             fecha = new Date(cell);
          }
        });

        // 2. CORRECCIÓN POSICIONAL AGRESIVA v8.6
        // El patrón detectado en screenshot es: [ID, Date, Usuario, Modulo, Accion, Mensaje, Tipo]
        // Pero la App ve IDs en Fecha. Eso significa que Row[0] es ID pero log.fecha lee Row[0]? No.
        // Si la App muestra AUD- en Fecha/Hora, es que log.fecha = row[0].
        // getAllAuditoria v8.5 hacía: id = row[0], rawFecha = row[1].
        // Si AUD- sale en "Fecha/Hora" (que usa formatDate(log.fecha)), es que row[1] contiene el ID.
        // Entonces el desfase es: [?, ID, FECHA, USER, MODULO, ACCION, MENSAJE, TIPO]
        
        // Vamos a intentar mapear lo mejor posible basándonos en si el valor EMPIEZA con AUD-
        if (id) {
           // Si encontramos un ID en cualquier columna, intentamos buscar la fecha cerca
           const idIdx = row.indexOf(id);
           if (idIdx !== -1 && idIdx < row.length - 1) {
              const nextVal = row[idIdx + 1];
              if (nextVal instanceof Date || !isNaN(new Date(nextVal).getTime())) {
                 fecha = new Date(nextVal);
                 user = row[idIdx + 2] || row[2] || user;
                 mod = row[idIdx + 3] || row[3] || mod;
                 acc = row[idIdx + 4] || row[4] || acc;
                 msg = row[idIdx + 5] || row[5] || msg;
              }
           }
        }

        // Si después de todo no hay ID, generamos uno
        if (!id) id = "AUD-AUTO-" + i;

        fixedRows.push([id, fecha, user, mod, acc, msg, type, just]);
    }
    
    sheet.clear(); 
    sheet.getRange(1, 1, fixedRows.length, 8).setValues(fixedRows);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#f3f4f6");
    
    SpreadsheetApp.flush();
    return `Reparación v8.7 (Alineación Forzada) completada: ${fixedRows.length - 1} registros.`;
  } catch (e) {
    console.error("Error en repairAuditoriaData: " + e.toString());
    return "Error: " + e.toString();
  }
}

/**
 * Approves a deletion request and executes the ACTUAL deletion from the target sheet.
 * @param {string} alertId The ID of the alert to mark as processed
 * @param {Object} data Must contain { targetEntity, targetId, restoreStock, justification }
 */
function approveAndDelete(alertId, data) {
  try {
    if (!alertId) throw new Error('ID de alerta es requerido');
    
    // Intento de extracción de metadatos del mensaje si no vienen en data
    if (!data.targetEntity || !data.targetId) {
      const ss = getSS();
      const sheet = ss.getSheetByName(SHEET_NAMES.AUDITORIA) || ss.getSheetByName(SHEET_NAMES.ALERTA) || ss.getSheetByName('Alertas');
      
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        const colMap = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'], MENSAJE: ['MENSAJE', 'DESCRIPCION'] });
        const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
        const msgIdx = colMap.MENSAJE !== -1 ? colMap.MENSAJE : 5;
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][idIdx] == alertId) {
            const msg = String(rows[i][msgIdx]);
            
            // INTENTO 1: Parsear reporte JSON robusto
            const jsonMatch = msg.match(/(\{.*?\})/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[1]);
                data.targetEntity = parsed.entity || data.targetEntity;
                data.targetId = parsed.id || parsed.patente || data.targetId;
                data.itemName = parsed.name || data.itemName;
                if (parsed.restoreStock !== undefined) data.restoreStock = parsed.restoreStock;
                if (parsed.deleteFromWarehouse !== undefined) data.deleteFromWarehouse = parsed.deleteFromWarehouse;
              } catch (e) {
                console.error("Error parseando JSON en auditoría:", e);
              }
            }
            
            // INTENTO 2: Extraer del texto si el JSON falló o es parcial
            if (!data.targetEntity || !data.targetId) {
               // Ejemplo: "Solicitud de eliminación: Activo - NOTEBOOK HP G7 (ID: ACT-000001)"
               const entityMatch = msg.match(/(Activo|Vehículo|Estanque|Consumo|Persona|Usuario|Mantención|Bodega|Producto|Carga)/i);
               if (entityMatch) {
                 const entityMap = { 
                   'activo': 'activos', 'vehículo': 'vehiculos', 'vehiculo': 'vehiculos', 
                   'estanque': 'estanques', 'consumo': 'consumos', 'persona': 'personas', 
                   'usuario': 'usuarios', 'mantención': 'mantenciones', 'mantencion': 'mantenciones', 
                   'bodega': 'almacenes', 'producto': 'productos_almacen', 'carga': 'cargas' 
                 };
                 data.targetEntity = entityMap[entityMatch[0].toLowerCase()] || entityMatch[0].toLowerCase();
               }
               
               // Buscar patrón ID: [A-Z0-9-]+
               const idMatch = msg.match(/ID:\s*([A-Z0-9-]+)/i) || msg.match(/\(([A-Z]+-[0-9-]+)\)/i);
               if (idMatch) {
                 data.targetId = idMatch[1].replace(/[()]/g, '').trim();
               }
            }
            break;
          }
        }
      }
    }

    if (!data.targetEntity || !data.targetId) throw new Error('No se pudo identificar la entidad o ID para eliminar');

    let result;
    // Execute the actual deletion based on entity
    switch (data.targetEntity.toLowerCase()) {
      case 'consumos': result = deleteConsumo(data.targetId, { restoreStock: data.restoreStock === true, justificacion: data.justificacion }); break;
      case 'vehiculos': result = deleteVehiculo(data.targetId, { justificacion: data.justificacion }); break;
      case 'estanques': result = deleteEstanque(data.targetId, { justificacion: data.justificacion }); break;
      case 'activos': result = deleteActivo(data.targetId, { deleteFromWarehouse: true, justificacion: data.justificacion }); break;
      case 'personas': result = deletePersona(data.targetId, { justificacion: data.justificacion }); break;
      case 'usuarios': result = deleteUsuario(data.targetId, { justificacion: data.justificacion }); break;
      case 'mantenciones': result = deleteMantencion(data.targetId, { justificacion: data.justificacion }); break;
      case 'almacenes': result = deleteAlmacen(data.targetId, { justificacion: data.justificacion }); break;
      case 'productos':
      case 'productos_almacen': result = deleteProducto(data.targetId, { justificacion: data.justificacion }); break;
      default: throw new Error('Entidad no soportada para eliminación aprobada: ' + data.targetEntity);
    }

    if (result.success) {
      // Mark alert as "LEIDA" (Read) or DELETE it
      const ss = getSS();
      const sheet = ss.getSheetByName(SHEET_NAMES.ALERTA);
      if (sheet) {
        const rows = sheet.getDataRange().getValues();
        const colMap = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'] });
        const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.ALERTA.ID;
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][idIdx] == alertId) {
             sheet.getRange(i + 1, COLUMNS.ALERTA.LEIDA + 1).setValue('TRUE');
             sheet.getRange(i + 1, COLUMNS.ALERTA.ACCION + 1).setValue('aprobado_y_eliminado');
             break;
          }
        }
      }
      
      // Final Audit of the APPROVAL
      const targetName = data.itemName || data.targetId;
      registrarAccion(
          data.targetEntity, 
          'aprobacion_eliminacion', 
          `ELIMINACIÓN APROBADA: ${targetName} (${data.targetId})`, 
          'success', 
          'Administrador', 
          data.justificacion
      );
      
      return createResponse(true, null, "Registro eliminado y alerta procesada");
    } else {
      return result;
    }
  } catch (error) {
    return createErrorResponse('Error al aprobar eliminación: ' + error.toString());
  }
}

// End of AuditoriaCRUD.gs

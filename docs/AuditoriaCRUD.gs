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
    case 'approveanddelete': return approveAndDelete(id, data);
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
    
    // Fallback check for 'Alertas' if the user named it that way
    if (!sheet && sheetName !== 'Alertas') {
      const altSheet = ss.getSheetByName('Alertas');
      if (altSheet) {
        sheet = altSheet;
        sheetName = 'Alertas';
      }
    }

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Create Headers
      const headers = ['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
      
      return createResponse(true, { message: 'Hoja ' + sheetName + ' creada correctamente' });
    }
    
    return createResponse(true, { message: 'La hoja ' + sheetName + ' ya existe' });
  } catch (error) {
    return createErrorResponse('Error creando hoja de logs: ' + error.toString());
  }
}

// End of helper functions - using centralized Utils.gs

/**
 * Gets all audit logs / alerts
 * @returns {Object} Standardized response with logs
 */
function getAllAuditoria() {
  try {
    let sheet;
    try {
      sheet = getSheet(SHEET_NAMES.AUDITORIA);
    } catch (e) {
      try {
        sheet = getSheet('Alertas');
      } catch (e2) {
        return createResponse(true, []);
      }
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    // DYNAMIC COLUMN MAPPING
    const colMap = findColumnIndices(sheet, {
        ID: ['ID'],
        FECHA: ['FECHA', 'TIMESTAMP'],
        USUARIO: ['USUARIO', 'USER'],
        MODULO: ['MODULO'],
        ACCION: ['ACCION'],
        MENSAJE: ['MENSAJE', 'DESCRIPCION'],
        TIPO: ['TIPO', 'LEVEL']
    });

    const idIdx = colMap.ID !== -1 ? colMap.ID : COLUMNS.AUDITORIA.ID;
    const fcIdx = colMap.FECHA !== -1 ? colMap.FECHA : COLUMNS.AUDITORIA.FECHA;
    const usrIdx = colMap.USUARIO !== -1 ? colMap.USUARIO : COLUMNS.AUDITORIA.USUARIO;
    const modIdx = colMap.MODULO !== -1 ? colMap.MODULO : COLUMNS.AUDITORIA.MODULO;
    const actIdx = colMap.ACCION !== -1 ? colMap.ACCION : COLUMNS.AUDITORIA.ACCION;
    const msgIdx = colMap.MENSAJE !== -1 ? colMap.MENSAJE : COLUMNS.AUDITORIA.MENSAJE;
    const tipIdx = colMap.TIPO !== -1 ? colMap.TIPO : COLUMNS.AUDITORIA.TIPO;

    const logs = [];
    // Skip header and iterate backwards to get most recent first
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      if (!row[idIdx]) continue;

      logs.push({
        id: row[idIdx],
        fecha: row[fcIdx],
        usuario: row[usrIdx],
        modulo: row[modIdx],
        accionRealizada: row[actIdx],
        mensaje: row[msgIdx],
        tipo: row[tipIdx]
      });
    }
    
    return createResponse(true, logs);
  } catch (error) {
    if (error.toString().includes('no encontrada')) {
        return createResponse(true, []); 
    }
    return createErrorResponse('Error al obtener auditoría: ' + error.toString());
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

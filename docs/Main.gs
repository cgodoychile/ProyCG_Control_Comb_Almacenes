/**
 * MAIN ENTRY POINTS
 */

/**
 * Crea un menú personalizado al abrir la hoja de cálculo
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ MANTENIMIENTO')
      .addItem('Reparar Columnas Inventario', 'repairInventoryHeaders')
      .addItem('Recalcular Stocks Estanques', 'recalcularTotal')
      .addSeparator()
      .addItem('Configuración Completa (Setup)', 'setupCompleto')
      .addToUi();
}

function doGet(e) {
  try {
    const params = e.parameter;
    const entity = params.entity;
    const action = params.action;
    const id = params.id;
    
    if (!entity || !action) {
      return ContentService.createTextOutput(JSON.stringify(createErrorResponse('Entidad y acción son requeridas')))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let result;
    switch (entity.toLowerCase()) {
      case 'consumos': result = handleConsumosGet(action, id); break;
      case 'vehiculos': result = handleVehiculosGet(action, id); break;
      case 'estanques': result = handleEstanquesGet(action, id); break;
      case 'cargas': result = handleCargasGet(action, id); break;
      case 'activos': result = handleActivosGet(action, id); break;
      case 'usuarios': result = handleUsuariosGet(action); break;
      case 'agendamientos': result = handleAgendamientosGet(action, id); break;
      case 'mantenciones': result = handleMantencionesGet(action, id); break;
      case 'almacenes': result = handleAlmacenesGet(action, id); break;
      case 'productos': result = handleProductosGet(action, id, params.almacenId); break;
      case 'movimientos': result = handleMovimientosGet(action, id, params.almacenId); break;
      case 'personas': result = handlePersonasGet(action, id); break;
      case 'alertas':
      case 'auditoria': result = handleAuditoriaGet(action); break;
      case 'debug': result = handleDebugGet(action); break;
      default: result = createErrorResponse('Entidad no válida: ' + entity);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify(createErrorResponse('Error crítico en doGet: ' + error.toString())))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = e.parameter;
    const entity = params.entity;
    const action = params.action;
    const id = params.id;
    
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        // Fallback for non-JSON or other formats
        data = { _raw: e.postData.contents };
      }
    }
    
    let result;
    switch (entity.toLowerCase()) {
      case 'consumos': result = handleConsumosPost(action, id, data); break;
      case 'vehiculos': result = handleVehiculosPost(action, id, data); break;
      case 'estanques': result = handleEstanquesPost(action, id, data); break;
      case 'cargas': result = handleCargasPost(action, id, data); break;
      case 'activos': result = handleActivosPost(action, id, data); break;
      case 'usuarios': result = handleUsuariosPost(action, id, data); break;
      case 'agendamientos': result = handleAgendamientosPost(action, id, data); break;
      case 'mantenciones': result = handleMantencionesPost(action, id, data); break;
      case 'almacenes': result = handleAlmacenesPost(action, id, data); break;
      case 'productos': result = handleProductosPost(action, id, data); break;
      case 'movimientos': result = handleMovimientosPost(action, id, data); break;
      case 'personas': result = handlePersonasPost(action, id, data); break;
      case 'auth': result = handleAuthPost(action, id, data); break;
      case 'alertas':
      case 'auditoria': result = handleAuditoriaPost(action, id, data); break;
      default: result = createErrorResponse('Entidad no válida: ' + entity);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify(createErrorResponse('Error crítico en doPost: ' + error.toString())))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// End of file

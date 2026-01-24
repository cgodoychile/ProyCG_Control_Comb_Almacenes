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
  const params = e.parameter;
  const entity = params.entity;
  const action = params.action;
  const id = params.id;
  
  let result;
  
  // CORS Pre-check (though usually handled by OPTIONS, this is good practice for doGet)
  if (!entity || !action) {
    return ContentService.createTextOutput(JSON.stringify(createErrorResponse('Entidad y acción son requeridas')))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  switch (entity.toLowerCase()) {
    case 'consumos':
       result = handleConsumosGet(action, id);
       break;
    case 'vehiculos':
       result = handleVehiculosGet(action, id);
       break;
    case 'estanques':
       result = handleEstanquesGet(action, id);
       break;
    case 'cargas': // Cargas de Estanques
       result = handleCargasGet(action, id);
       break;
    case 'activos':
       result = handleActivosGet(action, id);
       break;
    case 'usuarios':
       result = handleUsuariosGet(action);
       break;
    case 'agendamientos':
       result = handleAgendamientosGet(action, id);
       break;
    case 'mantenciones':
       result = handleMantencionesGet(action, id);
       break;
    case 'almacenes':
       result = handleAlmacenesGet(action, id);
       break;
    case 'productos':
       result = handleProductosGet(action, id, params.almacenId);
       break;
    case 'movimientos':
       result = handleMovimientosGet(action, id, params.almacenId);
       break;
    case 'personas':
       result = handlePersonasGet(action, id);
       break;
    case 'alertas':
    case 'auditoria':
       result = handleAuditoriaGet(action);
       break;
    case 'debug':
       result = handleDebugGet(action);
       break;
    default:
      result = createErrorResponse('Entidad no válida: ' + entity);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const params = e.parameter;
  const entity = params.entity;
  const action = params.action;
  const id = params.id;
  
  Logger.log(`[POST] Entity: ${entity}, Action: ${action}, ID: ${id}`);
  
  let data = null;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify(createErrorResponse('JSON inválido')))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  let result;
  
  switch (entity.toLowerCase()) {
    case 'consumos':
       result = handleConsumosPost(action, id, data);
       break;
    case 'vehiculos':
       result = handleVehiculosPost(action, id, data);
       break;
    case 'estanques':
       result = handleEstanquesPost(action, id, data);
       break;
    case 'cargas':
       result = handleCargasPost(action, id, data);
       break;
    case 'activos':
       result = handleActivosPost(action, id, data);
       break;
    case 'usuarios':
       result = handleUsuariosPost(action, id, data);
       break;
    case 'agendamientos':
       result = handleAgendamientosPost(action, id, data);
       break;
    case 'mantenciones':
       result = handleMantencionesPost(action, id, data);
       break;
    case 'almacenes':
       result = handleAlmacenesPost(action, id, data);
       break;
    case 'productos':
       result = handleProductosPost(action, id, data);
       break;
    case 'movimientos':
       result = handleMovimientosPost(action, id, data);
       break;
    case 'personas':
       result = handlePersonasPost(action, id, data);
       break;
    case 'auth':
       result = handleAuthPost(action, id, data); // Assuming handleAuthPost takes similar parameters
       break;
    default:
      result = createErrorResponse('Entidad no válida: ' + entity);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// End of file

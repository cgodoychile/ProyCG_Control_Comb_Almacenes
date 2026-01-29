/**
 * DESPACHADOR CENTRAL DE PETICIONES
 * VERSION: 2026-01-28-REDESIGN-ACTAS-V4
 */

function doGet(e) {
  try {
    const params = e.parameter;
    
    // EMERGENCY TRIGGER
    if (params.repair === 'mantenciones') {
      const repairResult = repairMantencionesStructure();
      return ContentService.createTextOutput(JSON.stringify(createResponse(true, repairResult))).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (params.version) {
       return ContentService.createTextOutput("VERSION: 2026-01-28-REDESIGN-ACTAS-V4").setMimeType(ContentService.MimeType.TEXT);
    }
    const entity = params.entity ? String(params.entity).trim().toLowerCase() : '';
    const action = params.action ? String(params.action).trim().toLowerCase() : 'getall';
    const id = params.id;
    
    console.log(`GET Request: Entity=${entity}, Action=${action}, ID=${id}`);
    
    if (!entity) return ContentService.createTextOutput(JSON.stringify(createErrorResponse("Entidad requerida"))).setMimeType(ContentService.MimeType.JSON);

    let result;
    
    if (entity.includes('mantencion') || entity.startsWith('man')) {
       result = typeof handleMantencionesGet === 'function' ? handleMantencionesGet(action, id) : createErrorResponse("Módulo Mantenciones no cargado");
    } else if (entity === 'alertas') {
      result = action === 'getactive' && typeof getActiveAlertas === 'function' ? getActiveAlertas() : handleGetAll(entity);
    } else if (entity === 'dashboard' && action === 'getstats') {
      result = typeof getDashboardStats === 'function' ? getDashboardStats() : createErrorResponse("Módulo Dashboard no cargado");
    } else if (entity === 'cargas') {
      result = typeof handleCargasGet === 'function' ? handleCargasGet(action, id) : handleGetAll(entity);
    } else if (entity === 'agendamientos') {
      result = typeof handleAgendamientosGet === 'function' ? handleAgendamientosGet(action, id) : handleGetAll(entity);
    } else if (entity === 'vehiculos') {
      result = typeof handleVehiculosGet === 'function' ? handleVehiculosGet(action, id) : handleGetAll(entity);
    } else if (entity === 'activos') {
      result = typeof handleActivosGet === 'function' ? handleActivosGet(action, id) : handleGetAll(entity);
    } else if (entity === 'almacenes') {
      result = typeof handleAlmacenesGet === 'function' ? handleAlmacenesGet(action, id) : handleGetAll(entity);
    } else if (entity === 'consumos') {
      result = typeof handleConsumosGet === 'function' ? handleConsumosGet(action, id) : handleGetAll(entity);
    } else if (entity === 'movimientos' || entity === 'movimientos_almacen') {
      const almacenId = params.almacenId || params.almacenid;
      result = typeof handleMovimientosGet === 'function' ? handleMovimientosGet(action, id, almacenId) : handleGetAll('MOVIMIENTOS_ALMACEN');
    } else if (entity === 'productos' || entity === 'productos_almacen') {
      const almacenId = params.almacenId || params.almacenid;
      result = typeof handleProductosGet === 'function' ? handleProductosGet(action, id, almacenId) : handleGetAll('PRODUCTOS_ALMACEN');
    } else if (entity === 'personas') {
      result = typeof handlePersonasGet === 'function' ? handlePersonasGet(action, id) : handleGetAll(entity);
    } else if (entity === 'actas') {
      result = typeof handleActasGet === 'function' ? handleActasGet(action, id) : handleGetAll('ACTAS');
    } else if (entity === 'auditoria') {
      result = typeof handleAuditoriaGet === 'function' ? handleAuditoriaGet(action, id) : handleGetAll('AUDITORIA');
    } else {
      result = handleGetAll(entity);
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify(createErrorResponse(error.toString()))).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = e.parameter;
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    
    const entity = (params.entity || body.entity || '').toLowerCase().trim();
    const action = (params.action || body.action || '').toLowerCase().trim();
    const id = params.id || body.id;
    
    console.log(`POST Request: Entity=${entity}, Action=${action}`);
    
    const responsable = body.responsable || params.responsable;
    let result;

    const isMantencion = /^(man|manten)/i.test(entity) || /mantencion/i.test(entity);
    
    if (isMantencion) {
      result = typeof handleMantencionesPost === 'function' ? handleMantencionesPost(action, id, body) : createErrorResponse("Módulo Mantenciones no cargado");
    } else if (entity === 'auth' && action === 'login') {
      result = typeof handleLogin === 'function' ? handleLogin(body.email, body.password) : createErrorResponse("Módulo Login no cargado");
    } else if (entity === 'alertas' && action === 'seen') {
      result = typeof markAlertaAsSeen === 'function' ? markAlertaAsSeen(id) : createErrorResponse("Módulo Alertas no cargado");
    } else if (entity === 'alertas' && action === 'repair') {
      result = typeof repairAlertasData === 'function' ? repairAlertasData() : createErrorResponse("Módulo Alertas no cargado");
    } else if (entity === 'cargas') {
      result = typeof handleCargasPost === 'function' ? handleCargasPost(action, id, body) : createErrorResponse("Módulo Cargas no cargado");
    } else if (entity === 'agendamientos') {
      result = typeof handleAgendamientosPost === 'function' ? handleAgendamientosPost(action, id, body) : createErrorResponse("Módulo Agendamientos no cargado");
    } else if (entity === 'vehiculos') {
      result = typeof handleVehiculosPost === 'function' ? handleVehiculosPost(action, id, body) : createErrorResponse("Módulo Vehículos no cargado");
    } else if (entity === 'activos') {
      result = typeof handleActivosPost === 'function' ? handleActivosPost(action, id, body) : createErrorResponse("Módulo Activos no cargado");
    } else if (entity === 'almacenes') {
      result = typeof handleAlmacenesPost === 'function' ? handleAlmacenesPost(action, id, body) : createErrorResponse("Módulo Almacenes no cargado");
    } else if (entity === 'consumos') {
      result = typeof handleConsumosPost === 'function' ? handleConsumosPost(action, id, body) : createErrorResponse("Módulo Consumos no cargado");
    } else if (entity === 'actas') {
      console.log(`[Main] Routing to Actas module. Action: ${action}`);
      result = typeof handleActasPost === 'function' ? handleActasPost(action, id, body) : createErrorResponse("Módulo Actas no cargado");
    } else if (entity === 'movimientos' || entity === 'movimientos_almacen') {
      result = typeof handleMovimientosPost === 'function' ? handleMovimientosPost(action, id, body) : createErrorResponse("Módulo Movimientos no cargado");
    } else if (entity === 'productos' || entity === 'productos_almacen') {
      result = typeof handleProductosPost === 'function' ? handleProductosPost(action, id, body) : createErrorResponse("Módulo Productos no cargado");
    } else if (entity === 'personas') {
      result = typeof handlePersonasPost === 'function' ? handlePersonasPost(action, id, body) : createErrorResponse("Módulo Personas no cargado");
    } else if (entity === 'auditoria') {
      result = typeof handleAuditoriaPost === 'function' ? handleAuditoriaPost(action, id, body) : handleCreate('AUDITORIA', body, responsable);
    } else {
      // Manejo unificado vía BaseCRUD o acciones genéricas
      if (action === 'delete') {
        result = handleDelete(entity, id, body, responsable);
      } else if (action === 'update' || action === 'edit') {
        result = handleUpdate(entity, id, body, responsable);
      } else {
        result = handleCreate(entity, body, responsable);
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify(createErrorResponse(error.toString()))).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * SCRIPT DE VERIFICACIÓN RÁPIDA PARA PERSONAS
 * 
 * Ejecuta esta función en Google Apps Script para verificar
 * que todo esté configurado correctamente
 */

function testPersonasBackend() {
  Logger.log('=== INICIANDO TEST DE PERSONAS ===\n');
  
  try {
    // 1. Verificar que SHEET_NAMES.PERSONAS existe
    Logger.log('1. Verificando SHEET_NAMES.PERSONAS...');
    if (!SHEET_NAMES.PERSONAS) {
      Logger.log('❌ ERROR: SHEET_NAMES.PERSONAS no está definido');
      return;
    }
    Logger.log('✅ SHEET_NAMES.PERSONAS = ' + SHEET_NAMES.PERSONAS);
    
    // 2. Verificar que COLUMNS.PERSONAS existe
    Logger.log('\n2. Verificando COLUMNS.PERSONAS...');
    if (!COLUMNS.PERSONAS) {
      Logger.log('❌ ERROR: COLUMNS.PERSONAS no está definido');
      return;
    }
    Logger.log('✅ COLUMNS.PERSONAS existe con ' + Object.keys(COLUMNS.PERSONAS).length + ' columnas');
    Logger.log('   Columnas: ' + Object.keys(COLUMNS.PERSONAS).join(', '));
    
    // 3. Verificar que la hoja Personas existe
    Logger.log('\n3. Verificando hoja Personas en Google Sheets...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.PERSONAS);
    if (!sheet) {
      Logger.log('❌ ERROR: La hoja "Personas" no existe en Google Sheets');
      Logger.log('   Ejecuta setupCompleto() en Setup.gs para crearla');
      return;
    }
    Logger.log('✅ Hoja "Personas" encontrada');
    
    // 4. Verificar headers
    Logger.log('\n4. Verificando headers de la hoja...');
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
    Logger.log('   Headers actuales: ' + headers.join(', '));
    
    const expectedHeaders = ['ID', 'Nombre Completo', 'Rol', 'Empresa', 'Email', 'Teléfono', 'Estado', 'Fecha Registro', 'Observaciones'];
    let headersOk = true;
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        Logger.log('❌ Header incorrecto en columna ' + (i+1) + ': esperado "' + expectedHeaders[i] + '", encontrado "' + headers[i] + '"');
        headersOk = false;
      }
    }
    if (headersOk) {
      Logger.log('✅ Todos los headers son correctos');
    }
    
    // 5. Verificar que las funciones CRUD existen
    Logger.log('\n5. Verificando funciones CRUD...');
    const functions = ['getAllPersonas', 'getPersonaById', 'createPersona', 'updatePersona', 'deletePersona'];
    for (const funcName of functions) {
      if (typeof this[funcName] === 'function') {
        Logger.log('✅ ' + funcName + ' existe');
      } else {
        Logger.log('❌ ' + funcName + ' NO existe');
      }
    }
    
    // 6. Verificar routing en Main.gs
    Logger.log('\n6. Verificando routing...');
    if (typeof handlePersonasGet === 'function') {
      Logger.log('✅ handlePersonasGet existe');
    } else {
      Logger.log('❌ handlePersonasGet NO existe');
    }
    if (typeof handlePersonasPost === 'function') {
      Logger.log('✅ handlePersonasPost existe');
    } else {
      Logger.log('❌ handlePersonasPost NO existe');
    }
    
    // 7. Test de getAllPersonas
    Logger.log('\n7. Probando getAllPersonas()...');
    const result = getAllPersonas();
    if (result.success) {
      Logger.log('✅ getAllPersonas() funciona correctamente');
      Logger.log('   Personas encontradas: ' + result.data.length);
    } else {
      Logger.log('❌ getAllPersonas() falló: ' + result.message);
    }
    
    // 8. Test de createPersona (con datos de prueba)
    Logger.log('\n8. Probando createPersona() con datos de prueba...');
    const testData = {
      id: 'TEST-' + new Date().getTime(),
      nombreCompleto: 'Persona de Prueba',
      rol: 'Test',
      empresa: 'Test Corp',
      email: 'test@example.com',
      telefono: '+56912345678',
      estado: 'activo'
    };
    
    const createResult = createPersona(testData);
    if (createResult.success) {
      Logger.log('✅ createPersona() funciona correctamente');
      Logger.log('   Persona creada con ID: ' + testData.id);
      
      // Limpiar: eliminar la persona de prueba
      Logger.log('\n9. Limpiando persona de prueba...');
      const deleteResult = deletePersona(testData.id);
      if (deleteResult.success) {
        Logger.log('✅ Persona de prueba eliminada correctamente');
      }
    } else {
      Logger.log('❌ createPersona() falló: ' + createResult.message);
    }
    
    Logger.log('\n=== TEST COMPLETADO ===');
    Logger.log('\n📋 RESUMEN:');
    Logger.log('Si todos los checks son ✅, el backend está funcionando correctamente.');
    Logger.log('Si hay ❌, revisa los mensajes de error arriba.');
    
  } catch (error) {
    Logger.log('\n❌ ERROR CRÍTICO: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
  }
}

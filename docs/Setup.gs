/**
 * SCRIPT DE VERIFICACIÓN Y CONFIGURACIÓN INICIAL
 * 
 * Este script te ayuda a:
 * 1. Verificar que el SPREADSHEET_ID esté configurado
 * 2. Crear las hojas necesarias si no existen
 * 3. Agregar los headers a cada hoja
 * 4. Probar la conexión
 * 
 * INSTRUCCIONES:
 * 1. Copia este código COMPLETO
 * 2. En Google Apps Script, crea un archivo llamado "Setup"
 * 3. Pega este código
 * 4. Ejecuta la función setupCompleto()
 * 5. Autoriza cuando se solicite
 * 6. Revisa los logs para ver el resultado
 */

// ============================================
// CONFIGURACIÓN
// ============================================

// Nota: Este script usa SPREADSHEET_ID del archivo Config.gs
// No necesita declarar su propia variable

// ============================================
// FUNCIÓN PRINCIPAL DE SETUP
// ============================================

/**
 * Ejecuta el setup completo:
 * - Verifica conexión al Spreadsheet
 * - Crea hojas si no existen
 * - Agrega headers
 * - Verifica configuración
 */
function setupCompleto() {
  Logger.log('=== INICIANDO SETUP COMPLETO ===\n');
  
  try {
    // 1. Verificar SPREADSHEET_ID
    Logger.log('1. Verificando SPREADSHEET_ID...');
    if (SPREADSHEET_ID === 'TU_SPREADSHEET_ID_AQUI') {
      Logger.log('❌ ERROR: Debes actualizar SPREADSHEET_ID en Config.gs');
      Logger.log('   Línea 13: const SPREADSHEET_ID = \'TU_SPREADSHEET_ID_AQUI\';');
      Logger.log('\n📝 Para obtener el ID:');
      Logger.log('   1. Abre tu Google Sheets');
      Logger.log('   2. Copia el ID de la URL: https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit');
      return;
    }
    
    // 2. Conectar al Spreadsheet
    Logger.log('2. Conectando al Spreadsheet...');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Conexión exitosa: ' + ss.getName());
    
    // 3. Crear hojas si no existen
    Logger.log('\n3. Verificando y creando hojas...');
    
    const hojasNecesarias = {
      'EnelComb': ['Fecha', 'Empresa/Usuario', 'Vehículo', 'Estanque', 'Litros Usados', 'Kilometraje', 'Contador Inicial', 'Contador Final', 'Personal Responsable', 'Justificación/Observaciones', 'Rendimiento'],
      'Estanques': ['Id', 'Nombre', 'Ubicación', 'Capacidad Total (L)', 'Stock Actual (L)', 'Estado'],
      'CargasEstanques': ['FECHA', 'N° GUÍA/FACTURA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES'],
      'INVENTARIO_ACTIVOS': ['ID_Activo', 'Nombre_Activo', 'Categoria', 'Ubicación/Almacen', 'Estado', 'Fecha_Adquisición', 'Valor_Inicial', 'Responsable'],
      'Personas': ['ID', 'Nombre Completo', 'Rol', 'Empresa', 'Email', 'Teléfono', 'Estado', 'Fecha Registro', 'Observaciones']
    };
    
    for (const [nombreHoja, headers] of Object.entries(hojasNecesarias)) {
      let sheet = ss.getSheetByName(nombreHoja);
      
      if (!sheet) {
        // Crear hoja
        sheet = ss.insertSheet(nombreHoja);
        Logger.log(`   ✅ Hoja "${nombreHoja}" creada`);
        
        // Agregar headers
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        
        // Formatear headers
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#4285f4');
        headerRange.setFontColor('#ffffff');
        
        // Ajustar ancho de columnas
        for (let i = 1; i <= headers.length; i++) {
          sheet.autoResizeColumn(i);
        }
        
        Logger.log(`   ✅ Headers agregados a "${nombreHoja}"`);
      } else {
        Logger.log(`   ℹ️  Hoja "${nombreHoja}" ya existe`);
        
        // Verificar si tiene headers
        const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
        const hasHeaders = firstRow.some(cell => cell !== '');
        
        if (!hasHeaders) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          const headerRange = sheet.getRange(1, 1, 1, headers.length);
          headerRange.setFontWeight('bold');
          headerRange.setBackground('#4285f4');
          headerRange.setFontColor('#ffffff');
          Logger.log(`   ✅ Headers agregados a "${nombreHoja}"`);
        }
      }
    }
    
    // 4. Agregar datos de ejemplo (opcional)
    Logger.log('\n4. ¿Deseas agregar datos de ejemplo?');
    Logger.log('   Ejecuta agregarDatosEjemplo() para agregar datos de prueba');
    
    // 5. Resumen final
    Logger.log('\n=== SETUP COMPLETADO EXITOSAMENTE ===');
    Logger.log('\n📋 Resumen:');
    Logger.log('   ✅ Spreadsheet conectado: ' + ss.getName());
    Logger.log('   ✅ Hojas verificadas/creadas: ' + Object.keys(hojasNecesarias).length);
    Logger.log('\n📝 Próximos pasos:');
    Logger.log('   1. Copia este SPREADSHEET_ID a Config.gs línea 13:');
    Logger.log('      ' + SPREADSHEET_ID);
    Logger.log('   2. Ejecuta testScript() en Main.gs para verificar');
    Logger.log('   3. Despliega como Web App');
    
  } catch (error) {
    Logger.log('\n❌ ERROR: ' + error.message);
    Logger.log('\n🔍 Posibles causas:');
    Logger.log('   - SPREADSHEET_ID incorrecto');
    Logger.log('   - No tienes permisos para acceder al Spreadsheet');
    Logger.log('   - El Spreadsheet no existe');
  }
}

// ============================================
// FUNCIÓN PARA AGREGAR DATOS DE EJEMPLO
// ============================================

/**
 * Agrega datos de ejemplo a cada hoja para probar
 */
function agregarDatosEjemplo() {
  Logger.log('=== AGREGANDO DATOS DE EJEMPLO ===\n');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Datos de ejemplo para Estanques
    const estanquesSheet = ss.getSheetByName('Estanques');
    if (estanquesSheet && estanquesSheet.getLastRow() === 1) {
      const datosEstanques = [
        [1, 'OF ENEL PEHUENCHE', 'Planta Pehuenche', 10000, 6850, 'operativo'],
        [2, 'Estanque Central', 'Bodega Central', 15000, 3200, 'bajo'],
        [3, 'Estanque Norte', 'Faena Norte', 8000, 1200, 'critico']
      ];
      estanquesSheet.getRange(2, 1, datosEstanques.length, 6).setValues(datosEstanques);
      Logger.log('✅ Datos de ejemplo agregados a Estanques');
    }
    
    // Datos de ejemplo para Activos
    const activosSheet = ss.getSheetByName('INVENTARIO_ACTIVOS');
    if (activosSheet && activosSheet.getLastRow() === 1) {
      const datosActivos = [
        ['SHJS31', 'Camioneta Toyota Hilux', 'Vehículo', 'Planta Pehuenche', 'operativo', '2022-03-15', 35000000, 'Diego Cofré'],
        ['TVVZ99', 'Camioneta Nissan NP300', 'Vehículo', 'Planta Pehuenche', 'operativo', '2023-01-20', 28000000, 'Ignacio Gutierrez'],
        ['TVWD55', 'Camioneta Ford Ranger', 'Vehículo', 'Faena Norte', 'mantencion', '2021-08-10', 32000000, 'David Quitral']
      ];
      activosSheet.getRange(2, 1, datosActivos.length, 8).setValues(datosActivos);
      Logger.log('✅ Datos de ejemplo agregados a Activos');
    }
    
    Logger.log('\n=== DATOS DE EJEMPLO AGREGADOS ===');
    Logger.log('Ahora puedes probar la API con estos datos');
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
  }
}

// ============================================
// FUNCIÓN DE VERIFICACIÓN RÁPIDA
// ============================================

/**
 * Verifica rápidamente la configuración
 */
function verificarConfiguracion() {
  Logger.log('=== VERIFICACIÓN RÁPIDA ===\n');
  
  const checks = [];
  
  // Check 1: SPREADSHEET_ID configurado
  if (SPREADSHEET_ID !== 'TU_SPREADSHEET_ID_AQUI') {
    checks.push('✅ SPREADSHEET_ID configurado');
  } else {
    checks.push('❌ SPREADSHEET_ID no configurado');
  }
  
  // Check 2: Conexión al Spreadsheet
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    checks.push('✅ Conexión al Spreadsheet exitosa');
    
    // Check 3: Hojas necesarias
    const hojasNecesarias = ['EnelComb', 'Estanques', 'CargasEstanques', 'INVENTARIO_ACTIVOS'];
    let hojasExistentes = 0;
    
    for (const nombreHoja of hojasNecesarias) {
      if (ss.getSheetByName(nombreHoja)) {
        hojasExistentes++;
      }
    }
    
    checks.push(`✅ Hojas encontradas: ${hojasExistentes}/${hojasNecesarias.length}`);
    
  } catch (error) {
    checks.push('❌ Error de conexión: ' + error.message);
  }
  
  // Mostrar resultados
  checks.forEach(check => Logger.log(check));
  
  Logger.log('\n=== FIN VERIFICACIÓN ===');
}

/**
 * REPARACIÓN ESTRUCTURAL DE HOJAS
 * Ejecuta esta función para alinear automáticamente las cabeceras de Almacenes, Estanques y Cargas.
 */
function repairAllSheetStructures() {
  try {
    // 1. Reparar PRODUCTOS_ALMACEN
    const pSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const pHeaders = ['ID_Producto', 'ID_Almacen', 'Nombre', 'Categoria', 'Cantidad', 'Unidad', 'Stock_Minimo', 'Valor_Unitario', 'Fecha_Ingreso', 'Proveedor_Principal', 'Estado', 'Retornable', 'En Uso', 'Es Activo', 'Descripcion'];
    pSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
    Logger.log('✅ Cabeceras de PRODUCTOS_ALMACEN reparadas');
    
    // 2. Reparar MOVIMIENTOS_ALMACEN
    const mSheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
    const mHeaders = ['ID_Movimiento', 'ID_Producto', 'Tipo', 'ID_Almacen_Origen', 'ID_Almacen_Destino', 'Cantidad', 'Fecha', 'Responsable', 'Guia_Referencia', 'Motivo', 'Proveedor_Transporte', 'Observaciones'];
    mSheet.getRange(1, 1, 1, mHeaders.length).setValues([mHeaders]);
    Logger.log('✅ Cabeceras de MOVIMIENTOS_ALMACEN reparadas');

    // 3. Reparar ESTANQUES
    const eSheet = getSheet(SHEET_NAMES.ESTANQUES);
    const eHeaders = ['ID', 'Nombre', 'Ubicacion', 'Capacidad_Total', 'Stock_Actual', 'Stock_Minimo', 'Estado', 'Tipo_Combustible', 'Fecha_Ultima_Carga', 'Responsable'];
    eSheet.getRange(1, 1, 1, eHeaders.length).setValues([eHeaders]);
    Logger.log('✅ Cabeceras de ESTANQUES reparadas');

    // 4. Reparar CARGAS_ESTANQUES
    const cSheet = getSheet(SHEET_NAMES.CARGAS);
    const cHeaders = ['Fecha', 'Tipo', 'Fecha_Programada', 'Numero_Guia', 'Estanque', 'Proveedor', 'Litros', 'Responsable', 'Observaciones', 'Patente_Camion', 'Tipo_Combustible', 'Conductor'];
    cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
    Logger.log('✅ Cabeceras de CARGAS reparadas');
    
    return "Estructuras reparadas para Almacenes, Estanques y Cargas. Por favor elimine las filas de prueba corruptas manualmente.";
  } catch (e) {
    Logger.log('❌ Error reparando: ' + e.toString());
    return "Error reparando: " + e.toString();
  }
}

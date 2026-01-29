/**
 * SETUP Y CONFIGURACIÓN INICIAL
 */

/**
 * Función que los usuarios deben ejecutar PRIMERO
 */
function setup() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('¿Deseas inicializar la estructura de la base de datos?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    createSheetsIfNotExist();
    ui.alert('Estructura inicializada correctamente.');
  }
}

/**
 * Crea las hojas necesarias si no existen y establece cabeceras
 */
function createSheetsIfNotExist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.values(SHEET_NAMES).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
  });
}

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
    // 1. Verificar SPREADSHEETID
    Logger.log('1. Verificando SPREADSHEETID...');
    if (SPREADSHEETID === 'TU_SPREADSHEET_ID_AQUI') {
      Logger.log('❌ ERROR: Debes actualizar SPREADSHEETID en Config.gs');
      Logger.log('   Línea 13: const SPREADSHEETID = \'TU_SPREADSHEET_ID_AQUI\';');
      Logger.log('\n📝 Para obtener el ID:');
      Logger.log('   1. Abre tu Google Sheets');
      Logger.log('   2. Copia el ID de la URL: https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit');
      return;
    }
    
    // 2. Conectar al Spreadsheet
    Logger.log('2. Conectando al Spreadsheet...');
    const ss = getSS();
    Logger.log('✅ Conexión exitosa: ' + ss.getName());
    
    // 3. Crear hojas si no existen
    Logger.log('\n3. Verificando y creando hojas...');
    
    const hojasNecesarias = {
      [SHEET_NAMES.CONSUMOS]: ['ID', 'Fecha', 'Empresa/Usuario', 'Vehículo/Activo', 'Estanque', 'Litros Usados', 'Kilometraje', 'Contador Inicial', 'Contador Final', 'Personal Responsable', 'Justificación', 'Rendimiento'],
      [SHEET_NAMES.ESTANQUES]: ['ID', 'Nombre', 'Ubicación', 'Capacidad Total', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Tipo Combustible', 'Fecha Última Carga', 'Responsable'],
      [SHEET_NAMES.VEHICULOS]: ['Patente', 'Marca', 'Modelo', 'Año', 'Tipo', 'Estado', 'Kilometraje', 'Última Mantención', 'Próxima Mantención', 'Responsable', 'Ubicación'],
      [SHEET_NAMES.ACTIVOS]: ['ID', 'Nombre', 'Tipo', 'Ubicación', 'Estado', 'Fecha Adquisición', 'Valor', 'Responsable', 'Marca', 'Modelo', 'N/S'],
      [SHEET_NAMES.CARGAS]: ['ID', 'FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'],
      [SHEET_NAMES.USUARIOS]: ['Email', 'Password', 'Rol', 'Nombre'],
      [SHEET_NAMES.AGENDAMIENTOS]: ['ID', 'FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'],
      [SHEET_NAMES.MANTENCIONES]: ['ID', 'Fecha', 'Fecha Ejecución', 'Patente', 'Tipo', 'Kilometraje', 'Descripción', 'Próxima Mantención', 'Costo', 'Estado'],
      [SHEET_NAMES.ALMACENES]: ['ID', 'Nombre', 'Ubicación', 'Responsable', 'Fecha_Creación', 'Estado'],
      [SHEET_NAMES.PRODUCTOS_ALMACEN]: ['ID', 'Almacen_ID', 'Nombre', 'Categoría', 'Cantidad', 'Unidad', 'Stock_Minimo', 'Valor_Unitario', 'Fecha_Ingreso', 'Proveedor', 'Estado', 'Retornable', 'En Uso', 'Es Activo'],
      [SHEET_NAMES.MOVIMIENTOS_ALMACEN]: ['ID', 'Producto_ID', 'Tipo', 'Origen', 'Destino', 'Cantidad', 'Fecha', 'Responsable', 'Guía', 'Motivo', 'Proveedor', 'Observaciones', 'Fecha Devolución Estimada'],
      [SHEET_NAMES.PERSONAS]: ['RUT/DNI', 'Nombre', 'Cargo', 'Empresa', 'Email', 'Teléfono', 'Estado', 'Fecha Ingreso', 'Observaciones'],
      [SHEET_NAMES.AUDITORIA]: ['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO', 'JUSTIFICACION'],
      [SHEET_NAMES.ALERTAS]: ['ID', 'FECHA', 'TIPO', 'MODULO', 'MENSAJE', 'RESPONSABLE', 'ESTADO', 'ACCION']
    };

    Object.entries(hojasNecesarias).forEach(([nombre, headers]) => {
      let sheet = ss.getSheetByName(nombre);
      if (!sheet) {
        sheet = ss.insertSheet(nombre);
        sheet.appendRow(headers);
        Logger.log('   ➕ Creada hoja: ' + nombre);
      } else {
        Logger.log('   ✅ Existe hoja: ' + nombre);
      }
    });

    Logger.log('\n🚀 SETUP FINALIZADO CON ÉXITO');
    Logger.log('Ya puedes usar la aplicación ProyCG.');
    
  } catch (e) {
    Logger.log('\n❌ ERROR EN SETUP: ' + e.toString());
  }
}

/**
 * REPARACIÓN ESTRUCTURAL DE HOJAS
 * Ejecuta esta función para alinear automáticamente las cabeceras.
 */
function repairAllSheetStructures() {
  try {
    // 1. Reparar PRODUCTOS_ALMACEN
    const pSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const pHeaders = ['ID', 'Almacen_ID', 'Nombre', 'Categoría', 'Cantidad', 'Unidad', 'Stock_Minimo', 'Valor_Unitario', 'Fecha_Ingreso', 'Proveedor', 'Estado', 'Retornable', 'En Uso', 'Es Activo'];
    pSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
    Logger.log('✅ Cabeceras de PRODUCTOS reparadas');
    
    // 2. Reparar MOVIMIENTOS_ALMACEN
    const mSheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
    const mHeaders = ['ID', 'Producto_ID', 'Tipo', 'Origen', 'Destino', 'Cantidad', 'Fecha', 'Responsable', 'Guía', 'Motivo', 'Proveedor', 'Observaciones', 'Fecha Devolución Estimada'];
    mSheet.getRange(1, 1, 1, mHeaders.length).setValues([mHeaders]);
    Logger.log('✅ Cabeceras de MOVIMIENTOS reparadas');

    // 3. Reparar ESTANQUES
    const eSheet = getSheet(SHEET_NAMES.ESTANQUES);
    const eHeaders = ['ID', 'Nombre', 'Ubicación', 'Capacidad Total', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Tipo Combustible', 'Fecha Última Carga', 'Responsable'];
    eSheet.getRange(1, 1, 1, eHeaders.length).setValues([eHeaders]);
    Logger.log('✅ Cabeceras de ESTANQUES reparadas');

    // 4. Reparar CARGAS_ESTANQUES
    const cSheet = getSheet(SHEET_NAMES.CARGAS);
    const cHeaders = ['ID', 'FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'];
    cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
    Logger.log('✅ Cabeceras de CARGAS reparadas');
    
    // 5. Reparar AUDITORIA
    const aSheet = getSheet(SHEET_NAMES.AUDITORIA);
    const aHeaders = ['ID', 'FECHA', 'USUARIO', 'MODULO', 'ACCION', 'MENSAJE', 'TIPO', 'JUSTIFICACION'];
    aSheet.getRange(1, 1, 1, aHeaders.length).setValues([aHeaders]);
    Logger.log('✅ Cabeceras de AUDITORIA reparadas');
    
    // 6. Reparar ALERTAS
    const alSheet = getSheet(SHEET_NAMES.ALERTAS);
    const alHeaders = ['ID', 'FECHA', 'TIPO', 'MODULO', 'MENSAJE', 'RESPONSABLE', 'ESTADO', 'ACCION'];
    alSheet.getRange(1, 1, 1, alHeaders.length).setValues([alHeaders]);
    Logger.log('✅ Cabeceras de ALERTAS reparadas');

    return "Estructuras reparadas para Almacenes, Estanques, Cargas, Auditoría y Alertas. Por favor elimine las filas de prueba corruptas manualmente.";
  } catch (e) {
    Logger.log('❌ Error reparando: ' + e.toString());
    return "Error reparando: " + e.toString();
  }
}

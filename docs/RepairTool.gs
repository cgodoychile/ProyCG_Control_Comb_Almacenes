/**
 * REPAIR WAREHOUSE SHEET STRUCTURES
 * Run this function to align headers with Config.gs
 */
function repairWarehouseStructures() {
  try {
    // 1. Repair PRODUCTOS_ALMACEN
    const pSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const pHeaders = ['ID_Producto', 'ID_Almacen', 'Nombre', 'Categoria', 'Cantidad', 'Unidad', 'Stock_Minimo', 'Valor_Unitario', 'Fecha_Ingreso', 'Proveedor_Principal', 'Estado', 'Retornable', 'En Uso', 'Es Activo'];
    
    // Check current headers and resize/overwrite
    pSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
    
    // 2. Repair MOVIMIENTOS_ALMACEN
    const mSheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
    const mHeaders = ['ID_Movimiento', 'ID_Producto', 'Tipo', 'ID_Almacen_Origen', 'ID_Almacen_Destino', 'Cantidad', 'Fecha', 'Responsable', 'Guia_Referencia', 'Motivo', 'Proveedor_Transporte', 'Observaciones'];
    mSheet.getRange(1, 1, 1, mHeaders.length).setValues([mHeaders]);

    // 3. Repair ESTANQUES
    const eSheet = getSheet(SHEET_NAMES.ESTANQUES);
    const eHeaders = ['ID', 'Nombre', 'Ubicacion', 'Capacidad_Total', 'Stock_Actual', 'Stock_Minimo', 'Estado', 'Tipo_Combustible', 'Fecha_Ultima_Carga', 'Responsable'];
    eSheet.getRange(1, 1, 1, eHeaders.length).setValues([eHeaders]);

    // 4. Repair CARGAS_ESTANQUES
    const cSheet = getSheet(SHEET_NAMES.CARGAS);
    const cHeaders = ['Fecha', 'Tipo', 'Fecha_Programada', 'Numero_Guia', 'Estanque', 'Proveedor', 'Litros', 'Responsable', 'Observaciones', 'Patente_Camion', 'Tipo_Combustible', 'Conductor'];
    cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
    
    return "Estructuras reparadas para Almacenes, Estanques y Cargas. Por favor elimine las filas de prueba corruptas manualmente.";
  } catch (e) {
    return "Error reparando: " + e.toString();
  }
}

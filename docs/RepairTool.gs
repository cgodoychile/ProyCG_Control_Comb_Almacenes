/**
 * REPAIR TOOL - Sincronización y Reparación de Datos
 */

/**
 * Repara las estructuras de las hojas para que coincidan con Config.gs
 */
function repairWarehouseStructures() {
  try {
    // 1. Repara PRODUCTOS_ALMACEN
    const pSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const pHeaders = ['ID', 'ID_Almacen', 'Nombre', 'Categoria', 'Cantidad', 'Unidad', 'Stock_Minimo', 'Valor_Unitario', 'Fecha_Ingreso', 'Proveedor_Principal', 'Estado', 'Retornable', 'En Uso', 'Es Activo', 'Descripcion'];
    pSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
    
    // 2. Repara MOVIMIENTOS_ALMACEN
    const mSheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
    const mHeaders = ['ID', 'ID_Producto', 'Tipo', 'ID_Almacen_Origen', 'ID_Almacen_Destino', 'Cantidad', 'Fecha', 'Responsable', 'Guia_Referencia', 'Motivo', 'Proveedor_Transporte', 'Observaciones', 'Fecha Devolucion Estimada'];
    mSheet.getRange(1, 1, 1, mHeaders.length).setValues([mHeaders]);

    // 3. Repara ESTANQUES
    const eSheet = getSheet(SHEET_NAMES.ESTANQUES);
    const eHeaders = ['ID', 'Nombre', 'Ubicacion', 'Capacidad_Total', 'Stock_Actual', 'Stock_Minimo', 'Estado', 'Tipo_Combustible', 'Fecha_Ultima_Carga', 'Responsable'];
    eSheet.getRange(1, 1, 1, eHeaders.length).setValues([eHeaders]);

    // 4. Repara CARGAS_ESTANQUES
    const cSheet = getSheet(SHEET_NAMES.CARGAS);
    const cHeaders = ['ID', 'FECHA', 'TIPO', 'FECHA_PROGRAMADA', 'NUMERO_GUIA', 'ESTANQUE', 'PROVEEDOR', 'LITROS', 'RESPONSABLE', 'OBSERVACIONES', 'PATENTE_CAMION', 'TIPO_COMBUSTIBLE', 'CONDUCTOR'];
    cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
    
    // 4.5 Repara AGENDAMIENTOS
    const aSheet = getSheet(SHEET_NAMES.AGENDAMIENTOS);
    aSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
    
    // 5. Repara MANTENCIONES
    const mantSheet = getSheet(SHEET_NAMES.MANTENCIONES);
    const mantHeaders = ['ID', 'FECHA_INGRESO', 'VEHICULO', 'TIPO_MANTENCION', 'KM_ACTUAL', 'PROXIMA_MANTENCION_KM', 'PROXIMA_MANTENCION_FECHA', 'TALLER', 'COSTO', 'OBSERVACION', 'ESTADO', 'RESPONSABLE'];
    mantSheet.getRange(1, 1, 1, mantHeaders.length).setValues([mantHeaders]);

    // 6. Repara ACTIVOS
    const actSheet = getSheet(SHEET_NAMES.ACTIVOS);
    const actHeaders = ['ID', 'Nombre', 'Tipo', 'Ubicacion', 'Estado', 'Fecha_Adquisicion', 'Valor', 'Responsable', 'Marca', 'Modelo', 'Numero_Serie'];
    actSheet.getRange(1, 1, 1, actHeaders.length).setValues([actHeaders]);
    
    // 7. Repara PERSONAS
    const perSheet = getSheet(SHEET_NAMES.PERSONAS);
    const perHeaders = ['ID', 'Nombre', 'Cargo', 'Departamento', 'Email', 'Telefono', 'Estado', 'Fecha_Ingreso', 'Observaciones'];
    perSheet.getRange(1, 1, 1, perHeaders.length).setValues([perHeaders]);

    // 8. Repara USUARIOS
    const userSheet = getSheet(SHEET_NAMES.USUARIOS);
    const userHeaders = ['Email', 'Password', 'Rol', 'Nombre'];
    userSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);

    // 9. Repara VEHICULOS
    repairVehiculosStructure();

    return "✅ Estructuras reparadas exitosamente. Se han actualizado las cabeceras en todos los módulos principales.";
  } catch (e) {
    return "❌ Error durante la reparación: " + e.toString();
  }
}

/**
 * Repara específicamente la hoja de Vehículos para mover KM a la columna L (índice 11)
 * Y asegurar que J es Responsable y K es Ubicación.
 */
function repairVehiculosStructure() {
  const sheet = getSheet(SHEET_NAMES.VEHICULOS);
  const headers = ['Patente', 'Marca', 'Modelo', 'Año', 'Tipo', 'Estado', 'Kilometraje', 'Última Mantención', 'Próxima Mantención', 'Responsable', 'Ubicación', 'Próxima Mantención (KM)'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  // Escanear filas para detectar si hay números en la columna J (Responsable) 
  // que deberían estar en la L (Prox KM)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const respValue = row[9]; // Columna J
    
    // Si el valor en Responsable es un número grande, probablemente sea el KM desplazado
    if (typeof respValue === 'number' && respValue > 500) {
      const actualResp = row[10]; // El nombre quedó en Ubicación (K)
      const actualUbic = row[11]; // La ubicación quedó en L (o vacía)
      
      sheet.getRange(i + 1, 10).setValue(actualResp || ""); // Fix Resp
      sheet.getRange(i + 1, 11).setValue(actualUbic || ""); // Fix Ubic
      sheet.getRange(i + 1, 12).setValue(respValue);       // Fix KM
    }
  }
}

/**
 * Escanea las hojas principales y asigna IDs a los registros que no los tengan
 */
function fillMissingIds() {
  const configs = [
    { name: SHEET_NAMES.PRODUCTOS_ALMACEN, prefix: 'PROD', padding: 7 },
    { name: SHEET_NAMES.MOVIMIENTOS_ALMACEN, prefix: 'MOV', padding: 8 },
    { name: SHEET_NAMES.ACTIVOS, prefix: 'ACT', padding: 6 },
    { name: SHEET_NAMES.MANTENCIONES, prefix: 'MANT', padding: 4 }
  ];
  
  let totalFixed = 0;
  
  configs.forEach(config => {
    try {
      const sheet = getSheet(config.name);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIdx = headers.findIndex(h => h.toUpperCase().trim() === 'ID' || h.toUpperCase().trim() === 'ID_PRODUCTO' || h.toUpperCase().trim() === 'ID_MOVIMIENTO' || h.toUpperCase().trim() === 'ID_ACTIVO');
      
      if (idIdx === -1) return;
      
      let changed = false;
      for (let i = 1; i < data.length; i++) {
        // Skip rows that are empty or are headers
        const firstCell = String(data[i][0]).toUpperCase().trim();
        if (firstCell === "ID" || firstCell === "FECHA" || firstCell === "EMAIL") continue;

        if (!data[i][idIdx] || String(data[i][idIdx]).trim() === "") {
          const newId = generateSequentialId(config.prefix, config.name, headers[idIdx], config.padding);
          sheet.getRange(i + 1, idIdx + 1).setValue(newId);
          // Actualizamos la data localmente para que el siguiente ID secuencial sea correcto
          data[i][idIdx] = newId; 
          totalFixed++;
          changed = true;
        }
      }
      if (changed) SpreadsheetApp.flush();
    } catch (e) {
      Logger.log("Error procesando hoja " + config.name + ": " + e.toString());
    }
  });
  
  return `✅ Proceso completado. Se asignaron ${totalFixed} IDs automáticos.`;
}

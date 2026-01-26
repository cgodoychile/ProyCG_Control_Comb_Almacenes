// ============================================
// CORRECTED Config.gs - Based on Actual Sheet Structure
// ============================================

var SPREADSHEETID = '1t9lhDEZobOfulN2EZXgnxdnP-DSJtkHemFH5yYep0Kc';
var SPREADSHEET_ID = SPREADSHEETID; // Alias for backward compatibility

const SHEET_NAMES = {
  CONSUMOS: 'EnelComb',
  USUARIOS: 'Usuarios',
  ESTANQUES: 'Estanques',
  CARGAS: 'CargasEstanques',
  ACTIVOS: 'Activos',
  VEHICULOS: 'VehIculos', // Corrected based on actual sheet name
  AGENDAMIENTOS: 'Agendamientos',
  MANTENCIONES: 'Mantenciones',
  ALMACENES: 'Almacenes',
  PRODUCTOS_ALMACEN: 'PRODUCTOS_ALMACEN',
  MOVIMIENTOS_ALMACEN: 'MOVIMIENTOS_ALMACEN',
  PERSONAS: 'Personas',
  AUDITORIA: 'Auditoria',
  ALERTA: 'Alertas'
};

const COLUMNS = {
  CONSUMOS: {
    ID: 0,
    FECHA: 1,
    EMPRESA_USUARIO: 2,
    VEHICULO: 3,
    ESTANQUE: 4,
    LITROS_USADOS: 5,
    KILOMETRAJE: 6,
    CONTADOR_INICIAL: 7,
    CONTADOR_FINAL: 8,
    PERSONAL_RESPONSABLE: 9,
    JUSTIFICACION: 10,
    RENDIMIENTO: 11
  },
  USUARIOS: {
    EMAIL: 0,
    PASSWORD: 1,
    ROL: 2,
    NOMBRE: 3
  },
  ESTANQUES: {
    ID: 0,
    NOMBRE: 1,
    UBICACION: 2,
    CAPACIDAD_TOTAL: 3,
    STOCK_ACTUAL: 4,
    STOCK_MINIMO: 5,
    ESTADO: 6,
    TIPO_COMBUSTIBLE: 7,
    FECHA_ULTIMA_CARGA: 8,
    RESPONSABLE: 9
  },
  CARGAS: {
    FECHA: 0,
    TIPO: 1,
    FECHA_PROGRAMADA: 2,
    NUMERO_GUIA: 3,
    ESTANQUE: 4,
    PROVEEDOR: 5,
    LITROS: 6,
    RESPONSABLE: 7,
    OBSERVACIONES: 8,
    PATENTE_CAMION: 9,
    TIPO_COMBUSTIBLE: 10,
    CONDUCTOR: 11
  },
  VEHICULOS: {
    PATENTE: 0,
    MARCA: 1,
    MODELO: 2,
    ANO: 3,
    TIPO: 4,
    ESTADO: 5,
    KILOMETRAJE: 6,
    ULTIMA_MANTENCION: 7,
    PROXIMA_MANTENCION: 8,
    RESPONSABLE: 9,
    UBICACION: 10
  },
  MANTENCIONES: {
    ID: 0,
    VEHICULO_PATENTE: 2,
    FECHA: 1,
    TIPO: 3,
    DESCRIPCION: 6,
    COSTO: 8,
    KILOMETRAJE: 4,
    PROXIMO_SERVICIO: 5,
    RESPONSABLE: 11,
    ESTADO: 10
  },
  ALMACENES: {
    ID: 0,
    NOMBRE: 1,
    UBICACION: 2,
    RESPONSABLE: 3,
    FECHA_CREACION: 4,
    ESTADO: 5
  },
  PRODUCTOS_ALMACEN: {
    ID: 0,
    ALMACEN_ID: 1,
    NOMBRE: 2,
    CATEGORIA: 3,
    CANTIDAD: 4,
    UNIDAD: 5,
    STOCK_MINIMO: 6,
    VALOR_UNITARIO: 7,
    FECHA_INGRESO: 8,
    PROVEEDOR_PRINCIPAL: 9,
    ESTADO: 10,
    ES_RETORNABLE: 11,
    CANTIDAD_EN_USO: 12,
    ES_ACTIVO: 13,
    DESCRIPCION: 14
  },
  MOVIMIENTOS_ALMACEN: {
    ID: 0,
    PRODUCTO_ID: 1,
    TIPO: 2,
    ALMACEN_ORIGEN: 3,
    ALMACEN_DESTINO: 4,
    CANTIDAD: 5,
    FECHA: 6,
    RESPONSABLE: 7,
    GUIA_REFERENCIA: 8,
    MOTIVO: 9,
    PROVEEDOR_TRANSPORTE: 10,
    OBSERVACIONES: 11,
    FECHA_DEVOLUCION: 12
  },
  ACTIVOS: {
    ID: 0,
    NOMBRE: 1,
    TIPO: 2,
    MARCA: 8,
    MODELO: 9,
    NUMERO_SERIE: 10,
    ESTADO: 4,
    UBICACION: 3,
    RESPONSABLE: 7,
    FECHA_ADQUISICION: 5,
    VALOR: 6
  },
  AGENDAMIENTOS: {
    FECHA: 0,
    TIPO: 1,
    FECHA_PROGRAMADA: 2,
    NUMERO_GUIA: 3,
    ESTANQUE: 4,
    PROVEEDOR: 5,
    LITROS: 6,
    RESPONSABLE: 7,
    OBSERVACIONES: 8,
    PATENTE_CAMION: 9,
    TIPO_COMBUSTIBLE: 10,
    CONDUCTOR: 11
  },
  PERSONAS: {
    ID: 0,
    NOMBRE: 1, // Nombre Completo
    CARGO: 2, // Rol
    DEPARTAMENTO: 3, // Empresa
    EMAIL: 4,
    TELEFONO: 5,
    ESTADO: 6,
    FECHA_INGRESO: 7,
    OBSERVACIONES: 8
  },
  AUDITORIA: {
    ID: 0,
    FECHA: 1,
    USUARIO: 2,
    MODULO: 3,
    ACCION: 4,
    MENSAJE: 5,
    TIPO: 6
  },
  ALERTA: {
    ID: 0,
    TIPO: 1,
    MENSAJE: 2,
    MODULO: 3,
    FECHA: 4,
    LEIDA: 5,
    ACCION: 6
  }
};

/**
 * Función para inicializar o reparar las cabeceras de Almacenes
 * Útil cuando se añaden nuevas columnas al esquema.
 */
function repairInventoryHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prodSheet = ss.getSheetByName("PRODUCTOS_ALMACEN");
  
  if (!prodSheet) return "Error: No se encontró la hoja PRODUCTOS_ALMACEN.";
  
  // Asegurar 14 columnas
  const maxCols = prodSheet.getMaxColumns();
  if (maxCols < 14) {
    prodSheet.insertColumnsAfter(maxCols, 14 - maxCols);
  }
  
  // Forzar cabeceras exactas para evitar fallos de mapeo
  const headers = [
    [1, 12, "Retornable"],   // Col L
    [1, 13, "En Uso"],       // Col M
    [1, 14, "Es Activo"]     // Col N
  ];
  
  headers.forEach(h => prodSheet.getRange(h[0], h[1]).setValue(h[2]));
  
  const lastRow = prodSheet.getLastRow();
  if (lastRow > 1) {
    const numRows = lastRow - 1;
    
    // Inicializar Col L (Retornable)
    const rangeRet = prodSheet.getRange(2, 12, numRows);
    const valuesRet = rangeRet.getValues();
    for (let i = 0; i < valuesRet.length; i++) {
      const val = String(valuesRet[i][0] || '').toUpperCase();
      if (val !== "TRUE" && val !== "FALSE") valuesRet[i][0] = "FALSE";
    }
    rangeRet.setValues(valuesRet);
    
    // Inicializar Col M (En Uso)
    const rangeUso = prodSheet.getRange(2, 13, numRows);
    const valuesUso = rangeUso.getValues();
    for (let i = 0; i < valuesUso.length; i++) {
      if (isNaN(parseFloat(valuesUso[i][0]))) valuesUso[i][0] = 0;
    }
    rangeUso.setValues(valuesUso);

    // Inicializar Col N (Es Activo)
    const rangeAct = prodSheet.getRange(2, 14, numRows);
    const valuesAct = rangeAct.getValues();
    for (let i = 0; i < valuesAct.length; i++) {
      const val = String(valuesAct[i][0] || '').toUpperCase();
      if (val !== "TRUE" && val !== "FALSE") valuesAct[i][0] = "FALSE";
    }
    rangeAct.setValues(valuesAct);
  }
  
  Logger.log("✅ Estructura de PRODUCTOS_ALMACEN reparada.");
  
  // REPAIR MOVIMIENTOS_ALMACEN
  const movSheet = ss.getSheetByName("MOVIMIENTOS_ALMACEN");
  if (movSheet) {
    const maxColsMov = movSheet.getMaxColumns();
    if (maxColsMov < 13) {
      movSheet.insertColumnsAfter(maxColsMov, 13 - maxColsMov);
    }
    movSheet.getRange(1, 13).setValue("Fecha Devolución Estimada");
    Logger.log("✅ Estructura de MOVIMIENTOS_ALMACEN reparada.");
  }

  return "Reparación completada. Columnas aseguradas en PRODUCTOS Y MOVIMIENTOS.";
}

# CÓDIGO COMPLETO PARA GOOGLE APPS SCRIPT (V2 - CORREGIDO)

Hola, para asegurar que todo funcione correctamente y que no haya desfases de datos, he actualizado este archivo con la configuración **real** de tus hojas y todas las correcciones estructurales.

**IMPORTANTE:** Copia y reemplaza cada archivo en tu editor de Apps Script.

---

## 1. Config.gs
*(Reemplaza TODO el contenido de Config.gs con esto)*

```javascript
// ============================================
// CONFIGURACIÓN GLOBAL - FUENTE DE VERDAD
// ============================================

const SPREADSHEETID = '1vqCOLrIqjGNLCOkAcXNzLxNPMdDQmDhkPYxdPHcBzQY';

const SHEET_NAMES = {
  CONSUMOS: 'EnelComb',
  USUARIOS: 'Usuarios',
  ESTANQUES: 'Estanques',
  CARGAS: 'CargasEstanques',
  ACTIVOS: 'Activos',
  VEHICULOS: 'Vehiculos',
  AGENDAMIENTOS: 'Agendamientos',
  MANTENCIONES: 'Mantenciones',
  ALMACENES: 'Almacenes',
  PRODUCTOS_ALMACEN: 'PRODUCTOS_ALMACEN',
  MOVIMIENTOS_ALMACEN: 'MOVIMIENTOS_ALMACEN',
  PERSONAS: 'Personas',
  ALERTAS: 'Alertas'
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
    ESTADO: 10
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
    OBSERVACIONES: 11
  },
  PERSONAS: {
    ID: 0,
    NOMBRE: 1,
    CARGO: 2,
    DEPARTAMENTO: 3,
    EMAIL: 4,
    TELEFONO: 5,
    ESTADO: 6,
    FECHA_INGRESO: 7,
    OBSERVACIONES: 8
  },
  ALERTAS: {
    ID: 0,
    FECHA: 1,
    MODULO: 2,
    TIPO: 3,
    DESCRIPCION: 4,
    RESPONSABLE: 5,
    ESTADO: 6
  }
};
```

---

## 2. Setup.gs (REPARACIÓN ESTRUCTURAL)
*(Crea este archivo o reemplaza el existente. Aquí está la función de reparación)*

```javascript
/**
 * REPARACIÓN ESTRUCTURAL DE HOJAS
 * Ejecuta esta función para alinear automáticamente las cabeceras.
 */
function repairAllSheetStructures() {
  try {
    // 1. Reparar PRODUCTOS_ALMACEN
    const pSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const pHeaders = ['ID_Producto', 'ID_Almacen', 'Nombre', 'Categoria', 'Cantidad', 'Unidad', 'Stock_Minimo', 'Valor_Unitario', 'Fecha_Ingreso', 'Proveedor_Principal', 'Estado'];
    pSheet.getRange(1, 1, 1, pHeaders.length).setValues([pHeaders]);
    
    // 2. Reparar MOVIMIENTOS_ALMACEN
    const mSheet = getSheet(SHEET_NAMES.MOVIMIENTOS_ALMACEN);
    const mHeaders = ['ID_Movimiento', 'ID_Producto', 'Tipo', 'ID_Almacen_Origen', 'ID_Almacen_Destino', 'Cantidad', 'Fecha', 'Responsable', 'Guia_Referencia', 'Motivo', 'Proveedor_Transporte', 'Observaciones'];
    mSheet.getRange(1, 1, 1, mHeaders.length).setValues([mHeaders]);

    // 3. Reparar ESTANQUES
    const eSheet = getSheet(SHEET_NAMES.ESTANQUES);
    const eHeaders = ['ID', 'Nombre', 'Ubicacion', 'Capacidad_Total', 'Stock_Actual', 'Stock_Minimo', 'Estado', 'Tipo_Combustible', 'Fecha_Ultima_Carga', 'Responsable'];
    eSheet.getRange(1, 1, 1, eHeaders.length).setValues([eHeaders]);

    // 4. Reparar CARGAS_ESTANQUES
    const cSheet = getSheet(SHEET_NAMES.CARGAS);
    const cHeaders = ['Fecha', 'Tipo', 'Fecha_Programada', 'Numero_Guia', 'Estanque', 'Proveedor', 'Litros', 'Responsable', 'Observaciones', 'Patente_Camion', 'Tipo_Combustible', 'Conductor'];
    cSheet.getRange(1, 1, 1, cHeaders.length).setValues([cHeaders]);
    
    return "✅ Estructuras reparadas exitosamente. Por favor borre las filas corruptas manualmente.";
  } catch (e) {
    return "❌ Error reparando: " + e.toString();
  }
}

/**
 * UTILS: getSheet
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEETID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
  return sheet;
}

function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
```

---

## 3. CargasEstanquesCRUD.gs
*(Lógica corregida para 12 columnas y fechas formateadas)*

```javascript
function getAllCargas() {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    const mapping = COLUMNS.CARGAS;
    const cargas = data.slice(1).map((row, index) => ({
      id: (index + 2).toString(),
      fecha: formatDate(row[mapping.FECHA]),
      tipo: row[mapping.TIPO],
      fechaProgramada: formatDate(row[mapping.FECHA_PROGRAMADA]),
      numeroGuia: row[mapping.NUMERO_GUIA],
      estanque: row[mapping.ESTANQUE],
      proveedor: row[mapping.PROVEEDOR],
      litros: row[mapping.LITROS],
      responsable: row[mapping.RESPONSABLE],
      observaciones: row[mapping.OBSERVACIONES],
      patenteCamion: row[mapping.PATENTE_CAMION],
      tipoCombustible: row[mapping.TIPO_COMBUSTIBLE],
      conductor: row[mapping.CONDUCTOR]
    }));
    return createResponse(true, cargas);
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}

function createCarga(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    const mapping = COLUMNS.CARGAS;
    const newRow = Array(12).fill('');
    
    newRow[mapping.FECHA] = formatDate(data.fecha);
    newRow[mapping.TIPO] = data.tipo || 'Directa';
    newRow[mapping.FECHA_PROGRAMADA] = formatDate(data.fechaProgramada);
    newRow[mapping.NUMERO_GUIA] = data.numeroGuia || '-';
    newRow[mapping.ESTANQUE] = data.estanque;
    newRow[mapping.PROVEEDOR] = data.proveedor;
    newRow[mapping.LITROS] = parseFloat(data.litros) || 0;
    newRow[mapping.RESPONSABLE] = data.responsable || 'Sistema';
    newRow[mapping.OBSERVACIONES] = data.observaciones || '';
    newRow[mapping.PATENTE_CAMION] = data.patenteCamion || '';
    newRow[mapping.TIPO_COMBUSTIBLE] = data.tipoCombustible || '';
    newRow[mapping.CONDUCTOR] = data.conductor || '';

    sheet.appendRow(newRow);
    
    // Actualizar Stock en Estanque
    updateEstanqueStock(data.estanque, newRow[mapping.LITROS]);
    
    // Generar Alerta
    createAlerta({
      modulo: 'Estanques',
      tipo: 'Carga',
      descripcion: `Nueva carga de ${newRow[mapping.LITROS]}L en estanque ${data.estanque}`,
      responsable: newRow[mapping.RESPONSABLE]
    });

    return createResponse(true, data, "Carga registrada exitosamente");
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}
```

---

## 4. EstanquesCRUD.gs
*(Lógica corregida para incluir Stock Mínimo y Responsable)*

```javascript
function createEstanque(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const id = "EST-" + new Date().getTime();
    const mapping = COLUMNS.ESTANQUES;
    const newRow = Array(10).fill('');

    newRow[mapping.ID] = id;
    newRow[mapping.NOMBRE] = data.nombre;
    newRow[mapping.UBICACION] = data.ubicacion;
    newRow[mapping.CAPACIDAD_TOTAL] = data.capacidadTotal;
    newRow[mapping.STOCK_ACTUAL] = data.stockActual || 0;
    newRow[mapping.STOCK_MINIMO] = data.stockMinimo || 0;
    newRow[mapping.ESTADO] = data.estado || 'Activo';
    newRow[mapping.TIPO_COMBUSTIBLE] = data.tipoCombustible || '';
    newRow[mapping.RESPONSABLE] = data.responsable || '';

    sheet.appendRow(newRow);
    
    createAlerta({
      modulo: 'Estanques',
      tipo: 'Creación',
      descripcion: `Nuevo estanque creado: ${data.nombre}`,
      responsable: newRow[mapping.RESPONSABLE]
    });

    return createResponse(true, { id: id, ...data });
  } catch (e) {
    return createResponse(false, null, e.toString());
  }
}
```

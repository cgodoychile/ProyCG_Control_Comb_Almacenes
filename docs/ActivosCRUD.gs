/**
 * CRUD OPERATIONS: ACTIVOS
 */

function handleActivosGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllActivos();
    case 'getbyid': return getActivoById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleActivosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createActivo(data);
    case 'update': return updateActivo(id, data);
    case 'delete': return deleteActivo(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllActivos() {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    const activos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || row[0] === 'ID') continue; // Salta ID vacío o cabecera

        activos.push({
            id: String(row[0]),
            categoria: String(row[1]),
            nombre: String(row[2]),
            ubicacion: String(row[3]),
            estado: String(row[4]),
            fechaAdquisicion: row[5],
            valorInicial: Number(row[6]) || 0,
            responsable: String(row[7]),
            marca: String(row[8]),
            modelo: String(row[9]),
            numeroSerie: String(row[10])
        });
    }
    return createResponse(true, activos);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function getActivoById(id) {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][COLUMNS.ACTIVOS.ID] == id) {
             const row = data[i];
             return createResponse(true, {
                id: row[COLUMNS.ACTIVOS.ID],
                nombre: row[COLUMNS.ACTIVOS.NOMBRE],
                categoria: row[COLUMNS.ACTIVOS.TIPO],
                ubicacion: row[COLUMNS.ACTIVOS.UBICACION],
                estado: row[COLUMNS.ACTIVOS.ESTADO],
                fechaAdquisicion: row[COLUMNS.ACTIVOS.FECHA_ADQUISICION],
                valorInicial: row[COLUMNS.ACTIVOS.VALOR],
                responsable: row[COLUMNS.ACTIVOS.RESPONSABLE]
             });
        }
    }
    return createErrorResponse("Activo no encontrado", 404);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

/**
 * Generate unique asset code based on category
 */
function generateAssetCode(categoria) {
  return generateSequentialId('ACT', SHEET_NAMES.ACTIVOS, 'ID', 6);
}

function createActivo(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const duplicateResponse = checkIdempotency(sheet, data.clientRequestId, 0); // 0 is ID
    if (duplicateResponse) return duplicateResponse;

    const id = generateSequentialId('ACT', SHEET_NAMES.ACTIVOS, 'ID', 4);
    data.id = id;

    // MAPEO ABSOLUTO (Indestructible)
    const newRow = Array(11).fill('');
    newRow[0] = data.id;                               // A: ID
    newRow[1] = data.categoria || '';                  // B: CATEGORIA
    newRow[2] = data.nombre || '';                     // C: NOMBRE
    newRow[3] = data.ubicacion || '';                  // D: UBICACION
    newRow[4] = data.estado || 'operativo';            // E: ESTADO
    newRow[5] = data.fechaAdquisicion || new Date();    // F: FECHA
    newRow[6] = Number(data.valorInicial) || 0;        // G: VALOR
    newRow[7] = data.responsable || '';                // H: RESPONSABLE
    newRow[8] = data.marca || '';                      // I: MARCA
    newRow[9] = data.modelo || '';                     // J: MODELO
    newRow[10] = data.numeroSerie || data.serie || ''; // K: SERIE
    
    sheet.appendRow(newRow);
    
    // Solo agregar a bodega si no viene del proceso de Almacenes (evita duplicidad circular)
    if (data.ubicacion && data.ubicacion.startsWith('ALM-') && !data._fromAlmacenes) {
        addActivoToWarehouse(data);
    }

    registrarAccion('Activos', 'crear', `Nuevo activo: ${data.id} (${data.nombre})`, 'success', data.responsable);
    createAlerta('Activos', 'success', `Activo registrado: ${data.id} - ${data.nombre}`, data.responsable, 'crear');

    return createResponse(true, { ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateActivo(id, data) {
    try {
        const sheet = getSheet(SHEET_NAMES.ACTIVOS);
        const values = sheet.getDataRange().getValues();
        
        for (let i = 1; i < values.length; i++) {
            if (values[i][0] == id) {
                const row = i + 1;
                if (data.categoria !== undefined) sheet.getRange(row, 2).setValue(data.categoria);
                if (data.nombre !== undefined) sheet.getRange(row, 3).setValue(data.nombre);
                if (data.ubicacion !== undefined) sheet.getRange(row, 4).setValue(data.ubicacion);
                if (data.estado !== undefined) sheet.getRange(row, 5).setValue(data.estado);
                if (data.fechaAdquisicion !== undefined) sheet.getRange(row, 6).setValue(data.fechaAdquisicion);
                if (data.valorInicial !== undefined) sheet.getRange(row, 7).setValue(data.valorInicial);
                if (data.responsable !== undefined) sheet.getRange(row, 8).setValue(data.responsable);
                if (data.marca !== undefined) sheet.getRange(row, 9).setValue(data.marca);
                if (data.modelo !== undefined) sheet.getRange(row, 10).setValue(data.modelo);
                if (data.numeroSerie !== undefined) sheet.getRange(row, 11).setValue(data.numeroSerie);
                return createResponse(true, { id, ...data });
            }
        }
        throw new Error("Activo no encontrado");
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

function deleteActivo(id, data) {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const dataValues = sheet.getDataRange().getValues();
    let assetName = '', rowIndex = -1;

    for (let i = 1; i < dataValues.length; i++) {
        if (String(dataValues[i][0]).trim() === String(id).trim()) {
            assetName = dataValues[i][2]; // NOMBRE en Col C
            rowIndex = i + 1;
            break;
        }
    }
    if (rowIndex === -1) throw new Error('Activo no encontrado');

    removeActivoFromWarehouse(id);
    sheet.deleteRow(rowIndex);

    const justificacion = data ? data.justificacion : 'Sin justificación';
    registrarAccion('Activos', 'eliminar', `Activo ${assetName} (${id}) eliminado. Motivo: ${justificacion}`, 'warning', 'Usuario', justificacion);
    createAlerta('Activos', 'warning', `Activo eliminado: ${assetName} (${id})`, 'Administrador', 'eliminar');
    return createResponse(true, { message: 'Activo eliminado' });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function repairActivosSheet() {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const data = sheet.getDataRange().getValues();
    
    // 1. Reparar Cabeceras
    const headers = ["ID", "CATEGORIA", "NOMBRE", "UBICACION", "ESTADO", "FECHA_ADQUISICION", "VALOR", "RESPONSABLE", "MARCA", "MODELO", "NUMERO_SERIE"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // 2. Reparar Filas con Desfase (Heurística)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // SI detectamos que el ID de la bodega está en la columna VALOR (id 6)
        // Y la marca está en la columna UBICACION (id 3)
        // Significa que esa fila está desplazada.
        if (String(row[3]).toLowerCase() === 'makita' || String(row[6]).startsWith('ALM-')) {
            const newRow = Array(11).fill('');
            newRow[0] = row[0]; // ID
            newRow[1] = row[1]; // CATEGORIA
            newRow[2] = row[2]; // NOMBRE
            newRow[3] = row[6]; // UBICACION (Estaba en Valor)
            newRow[4] = row[5]; // ESTADO (Estaba en Fecha)
            newRow[5] = row[7]; // FECHA (Estaba en Responsable)
            newRow[6] = row[8]; // VALOR (Estaba en Marca)
            newRow[7] = row[10]; // RESPONSABLE (Estaba en Serie)
            newRow[8] = row[3]; // MARCA (Estaba en Ubicacion)
            newRow[9] = row[4]; // MODELO (Estaba en Estado)
            newRow[10] = "";     // SERIE (A evaluar)
            sheet.getRange(i + 1, 1, 1, 11).setValues([newRow]);
        }
    }

    return "Estructura de Activos reparada y datos alineados.";
  } catch (e) {
    return "Error reparando: " + e.toString();
  }
}

/**
 * RE-SINCRONIZA TODOS LOS ACTIVOS CON ALMACENES
 * Ejecuta esto si los activos no aparecen en el módulo Almacenes.
 */
function reSyncAllActivosToWarehouse() {
  try {
    const sheet = getSheet(SHEET_NAMES.ACTIVOS);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return "No hay activos para sincronizar.";

    let syncCount = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const activo = {
            id: row[0],
            categoria: row[1],
            nombre: row[2],
            ubicacion: row[3],
            estado: row[4],
            valorInicial: Number(row[6]) || 0,
            marca: row[8],
            modelo: row[9],
            numeroSerie: row[10]
        };

        // Si el activo tiene una ubicación de bodega (ALM-...)
        if (activo.id && activo.ubicacion && activo.ubicacion.startsWith('ALM-')) {
            // Primero eliminamos si ya existe para evitar duplicados
            removeActivoFromWarehouse(activo.id);
            // Creamos el registro en Almacenes
            addActivoToWarehouse(activo);
            syncCount++;
        }
    }
    return `Sincronización completada: ${syncCount} activos procesados.`;
  } catch (e) {
    return "Error en re-sincronización: " + e.toString();
  }
}

function addActivoToWarehouse(activo) {
    try {
        const prodData = {
            id: activo.id,
            nombre: activo.nombre,
            categoria: 'Activos - ' + activo.categoria,
            unidad: 'Unidad',
            cantidad: 1,
            valorUnitario: activo.valorInicial,
            almacenId: activo.ubicacion,
            esActivo: true,
            esRetornable: true,
            estado: 'Operativo',
            descripcion: `Marca: ${activo.marca || '-'}, Modelo: ${activo.modelo || '-'}, S/N: ${activo.numeroSerie || activo.serie || '-'}`
        };
        createProducto(prodData);
    } catch (e) {
        console.error("Error adding activo to warehouse:", e);
    }
}

function removeActivoFromWarehouse(activoId) {
    try {
        const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
        const data = sheet.getDataRange().getValues();
        const idIdx = 0; // Por defecto en PRODUCTOS_ALMACEN el ID es 0
        for (let i = data.length - 1; i >= 1; i--) {
            if (String(data[i][idIdx]).trim() === String(activoId).trim()) {
                sheet.deleteRow(i + 1);
            }
        }
    } catch (e) {
        console.error("Error removing activo from warehouse:", e);
    }
}

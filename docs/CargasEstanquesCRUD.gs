function handleCargasGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllCargas();
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleCargasPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createCarga(data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllCargas() {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    const cargas = [];
    for (let i = 1; i < data.length; i++) {
        // Skip empty rows if needed, or implement ID check if you add ID column
        // Assuming no explicit ID column for Cargas yet based on previous code usually just appending
        // But let's assume valid rows have at least a date
        const row = data[i];
        if (!row[COLUMNS.CARGAS.FECHA]) continue;

        cargas.push({
            id: (i + 1).toString(), 
            fecha: formatDate(row[COLUMNS.CARGAS.FECHA]),
            tipo: row[COLUMNS.CARGAS.TIPO] || 'real',
            fechaProgramada: row[COLUMNS.CARGAS.FECHA_PROGRAMADA] ? formatDate(row[COLUMNS.CARGAS.FECHA_PROGRAMADA]) : '',
            numeroGuia: row[COLUMNS.CARGAS.NUMERO_GUIA],
            estanque: row[COLUMNS.CARGAS.ESTANQUE],
            proveedor: row[COLUMNS.CARGAS.PROVEEDOR],
            litros: row[COLUMNS.CARGAS.LITROS],
            responsable: row[COLUMNS.CARGAS.RESPONSABLE],
            observaciones: row[COLUMNS.CARGAS.OBSERVACIONES],
            patenteCamion: row[COLUMNS.CARGAS.PATENTE_CAMION],
            tipoCombustible: row[COLUMNS.CARGAS.TIPO_COMBUSTIBLE],
            conductor: row[COLUMNS.CARGAS.CONDUCTOR]
        });
    }
    return createResponse(true, cargas);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createCarga(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CARGAS);
    
    const newRow = Array(12).fill('');
    newRow[COLUMNS.CARGAS.FECHA] = formatDate(data.fecha || new Date());
    newRow[COLUMNS.CARGAS.TIPO] = data.tipo || 'real';
    newRow[COLUMNS.CARGAS.FECHA_PROGRAMADA] = data.fechaProgramada ? formatDate(data.fechaProgramada) : '';
    newRow[COLUMNS.CARGAS.NUMERO_GUIA] = data.numeroGuia || '';
    newRow[COLUMNS.CARGAS.ESTANQUE] = data.estanque;
    newRow[COLUMNS.CARGAS.PROVEEDOR] = data.proveedor;
    newRow[COLUMNS.CARGAS.LITROS] = parseFloat(data.litros) || 0;
    newRow[COLUMNS.CARGAS.RESPONSABLE] = data.responsable || 'Admin';
    newRow[COLUMNS.CARGAS.OBSERVACIONES] = data.observaciones || '';
    newRow[COLUMNS.CARGAS.PATENTE_CAMION] = data.patenteCamion || '';
    newRow[COLUMNS.CARGAS.TIPO_COMBUSTIBLE] = data.tipoCombustible || '';
    newRow[COLUMNS.CARGAS.CONDUCTOR] = data.conductor || '';
    
    sheet.appendRow(newRow);
    
    // Audit Log
    registrarAccion('Cargas', 'crear', `Nueva carga (${newRow[COLUMNS.CARGAS.TIPO]}): ${newRow[COLUMNS.CARGAS.LITROS]}L en ${data.estanque}`, 'success', data.responsable);
    
    createAlerta('success', `Nueva carga (${newRow[COLUMNS.CARGAS.TIPO]}): ${newRow[COLUMNS.CARGAS.LITROS]}L en ${data.estanque}`, 'Cargas', 'crear');
    
    // Update Stock Estanque ONLY IF REAL
    if (data.tipo !== 'programada' && data.estanque && data.litros) {
        updateEstanqueStock(data.estanque, parseFloat(data.litros));
    }
    
    return createResponse(true, { ...data }, "Carga creada");
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateEstanqueStock(nombre, litros) {
    try {
        const sheet = getSheet(SHEET_NAMES.ESTANQUES);
        const data = sheet.getDataRange().getValues();
        let rowIndex = -1;

        for (let i = 1; i < data.length; i++) {
            if (data[i][COLUMNS.ESTANQUES.NOMBRE] === nombre) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex !== -1) {
            const currentStock = parseFloat(data[rowIndex-1][COLUMNS.ESTANQUES.STOCK_ACTUAL]) || 0;
            sheet.getRange(rowIndex, COLUMNS.ESTANQUES.STOCK_ACTUAL + 1).setValue(currentStock + litros);
            sheet.getRange(rowIndex, COLUMNS.ESTANQUES.FECHA_ULTIMA_CARGA + 1).setValue(new Date());
        }
    } catch (error) {
        Logger.log('Error updating estanque stock: ' + error.toString());
    }
}

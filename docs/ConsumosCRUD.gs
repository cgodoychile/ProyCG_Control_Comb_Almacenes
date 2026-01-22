/**
 * CRUD OPERATIONS: CONSUMOS
 */

function handleConsumosGet(action, id) {
  switch (action.toLowerCase()) {
    case 'getall': return getAllConsumos();
    case 'getbyid': return getConsumoById(id);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function handleConsumosPost(action, id, data) {
  switch (action.toLowerCase()) {
    case 'create': return createConsumo(data);
    case 'update': return updateConsumo(id, data);
    case 'delete': return deleteConsumo(id, data);
    default: return createErrorResponse('Acción no válida', 400);
  }
}

function getAllConsumos() {
  try {
    const sheet = getSheet(SHEET_NAMES.CONSUMOS);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return createResponse(true, []);
    
    const consumos = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Skip empty rows if ID is missing
      if (!row[COLUMNS.CONSUMOS.ID]) continue;

      consumos.push({
        id: row[COLUMNS.CONSUMOS.ID],
        fecha: row[COLUMNS.CONSUMOS.FECHA],
        empresa: row[COLUMNS.CONSUMOS.EMPRESA_USUARIO],
        vehiculo: row[COLUMNS.CONSUMOS.VEHICULO],
        estanque: row[COLUMNS.CONSUMOS.ESTANQUE],
        litrosUsados: row[COLUMNS.CONSUMOS.LITROS_USADOS],
        kilometraje: row[COLUMNS.CONSUMOS.KILOMETRAJE],
        contadorInicial: row[COLUMNS.CONSUMOS.CONTADOR_INICIAL],
        contadorFinal: row[COLUMNS.CONSUMOS.CONTADOR_FINAL],
        responsable: row[COLUMNS.CONSUMOS.PERSONAL_RESPONSABLE],
        justificacion: row[COLUMNS.CONSUMOS.JUSTIFICACION],
        rendimiento: row[COLUMNS.CONSUMOS.RENDIMIENTO]
      });
    }
    return createResponse(true, consumos);
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function getConsumoById(id) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.CONSUMOS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[COLUMNS.CONSUMOS.ID] == id) {
        return createResponse(true, {
            id: row[COLUMNS.CONSUMOS.ID],
            fecha: row[COLUMNS.CONSUMOS.FECHA],
            empresa: row[COLUMNS.CONSUMOS.EMPRESA_USUARIO],
            vehiculo: row[COLUMNS.CONSUMOS.VEHICULO],
            estanque: row[COLUMNS.CONSUMOS.ESTANQUE],
            litrosUsados: row[COLUMNS.CONSUMOS.LITROS_USADOS],
            kilometraje: row[COLUMNS.CONSUMOS.KILOMETRAJE],
            contadorInicial: row[COLUMNS.CONSUMOS.CONTADOR_INICIAL],
            contadorFinal: row[COLUMNS.CONSUMOS.CONTADOR_FINAL],
            responsable: row[COLUMNS.CONSUMOS.PERSONAL_RESPONSABLE],
            justificacion: row[COLUMNS.CONSUMOS.JUSTIFICACION],
            rendimiento: row[COLUMNS.CONSUMOS.RENDIMIENTO]
        });
      }
    }
    throw new Error('Consumo no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function createConsumo(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CONSUMOS);
    const id = new Date().getTime().toString(); // Simple ID generation
    
    const newRow = Array(13).fill('');
    newRow[COLUMNS.CONSUMOS.ID] = id;
    newRow[COLUMNS.CONSUMOS.FECHA] = data.fecha;
    newRow[COLUMNS.CONSUMOS.EMPRESA_USUARIO] = data.empresa;
    newRow[COLUMNS.CONSUMOS.VEHICULO] = data.vehiculo;
    newRow[COLUMNS.CONSUMOS.ESTANQUE] = data.estanque;
    newRow[COLUMNS.CONSUMOS.LITROS_USADOS] = data.litrosUsados;
    newRow[COLUMNS.CONSUMOS.KILOMETRAJE] = data.kilometraje;
    newRow[COLUMNS.CONSUMOS.CONTADOR_INICIAL] = data.contadorInicial;
    newRow[COLUMNS.CONSUMOS.CONTADOR_FINAL] = data.contadorFinal;
    newRow[COLUMNS.CONSUMOS.PERSONAL_RESPONSABLE] = data.responsable;
    newRow[COLUMNS.CONSUMOS.JUSTIFICACION] = data.justificacion || data.observaciones;
    // Calculate Rendimiento if possible
    if (data.litrosUsados > 0 && data.kilometraje > 0) {
        newRow[COLUMNS.CONSUMOS.RENDIMIENTO] = (data.kilometraje / data.litrosUsados).toFixed(2);
    }

    sheet.appendRow(newRow);
    
    // Update Stock Estanque
    if (data.estanque && data.litrosUsados) {
        updateEstanqueStock(data.estanque, -parseFloat(data.litrosUsados));
    }

    // Audit Log
    registrarAccion('Consumo', 'crear', `Nuevo consumo de ${data.litrosUsados}L para vehículo ${data.vehiculo}`, 'success', data.responsable);

    return createResponse(true, { id: id, ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateConsumo(id, data) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.CONSUMOS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
       if (values[i][COLUMNS.CONSUMOS.ID] == id) {
           const row = i + 1;
           const oldLitros = parseFloat(values[i][COLUMNS.CONSUMOS.LITROS_USADOS]) || 0;
           const oldEstanque = values[i][COLUMNS.CONSUMOS.ESTANQUE];
           
           // Prepare new values (merge with existing if data is partial, but here we assume full object or we read from values)
           // If data comes partial, we should safeguard. For now assuming full edit from frontend.
           
           const newLitros = data.litrosUsados !== undefined ? parseFloat(data.litrosUsados) : oldLitros;
           const newEstanque = data.estanque || oldEstanque;
           
           // Update Row
           // Map fields to columns
           if (data.fecha) sheet.getRange(row, COLUMNS.CONSUMOS.FECHA + 1).setValue(data.fecha);
           if (data.empresa) sheet.getRange(row, COLUMNS.CONSUMOS.EMPRESA_USUARIO + 1).setValue(data.empresa);
           if (data.vehiculo) sheet.getRange(row, COLUMNS.CONSUMOS.VEHICULO + 1).setValue(data.vehiculo);
           if (data.estanque) sheet.getRange(row, COLUMNS.CONSUMOS.ESTANQUE + 1).setValue(data.estanque);
           if (data.litrosUsados !== undefined) sheet.getRange(row, COLUMNS.CONSUMOS.LITROS_USADOS + 1).setValue(data.litrosUsados);
           if (data.kilometraje !== undefined) sheet.getRange(row, COLUMNS.CONSUMOS.KILOMETRAJE + 1).setValue(data.kilometraje);
           if (data.contadorInicial !== undefined) sheet.getRange(row, COLUMNS.CONSUMOS.CONTADOR_INICIAL + 1).setValue(data.contadorInicial);
           if (data.contadorFinal !== undefined) sheet.getRange(row, COLUMNS.CONSUMOS.CONTADOR_FINAL + 1).setValue(data.contadorFinal);
           if (data.responsable) sheet.getRange(row, COLUMNS.CONSUMOS.PERSONAL_RESPONSABLE + 1).setValue(data.responsable);
           if (data.justificacion || data.observaciones) sheet.getRange(row, COLUMNS.CONSUMOS.JUSTIFICACION + 1).setValue(data.justificacion || data.observaciones);
           
           // Recalculate Rendimiento
           if (newLitros > 0 && data.kilometraje > 0) {
               const rendimiento = (data.kilometraje / newLitros).toFixed(2);
               sheet.getRange(row, COLUMNS.CONSUMOS.RENDIMIENTO + 1).setValue(rendimiento);
           }

           // Handle Stock updates
           // Case 1: Same Estanque, changed Litros
           if (oldEstanque === newEstanque) {
               const diff = newLitros - oldLitros;
               if (diff !== 0) {
                   // Subtract the difference from stock (if usage increased, stock decreases)
                   updateEstanqueStock(newEstanque, -diff);
               }
           } 
           // Case 2: Changed Estanque
           else {
               // Restore old stock
               if (oldEstanque) updateEstanqueStock(oldEstanque, oldLitros);
               // Deduct new stock
               if (newEstanque) updateEstanqueStock(newEstanque, -newLitros);
           }
           
           return createResponse(true, { id: id, ...data }, "Consumo actualizado");
       }
    }
    throw new Error('Consumo no encontrado');
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function deleteConsumo(id, data) {
    try {
        if (!id) throw new Error('ID es requerido');
        const sheet = getSheet(SHEET_NAMES.CONSUMOS);
        const rows = sheet.getDataRange().getValues();
        
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][COLUMNS.CONSUMOS.ID] == id) {
                const litros = rows[i][COLUMNS.CONSUMOS.LITROS_USADOS];
                const estanque = rows[i][COLUMNS.CONSUMOS.ESTANQUE];
                
                sheet.deleteRow(i + 1);
                
                // Restore Stock ONLY if requested
                // Use strict check: data.restoreStock must be true
                if (data && data.restoreStock === true && estanque && litros) {
                    updateEstanqueStock(estanque, parseFloat(litros));
                }
                
                // Audit Log
                registrarAccion('Consumo', 'eliminar', `Eliminado registro de consumo ${id} (Vehículo: ${rows[i][COLUMNS.CONSUMOS.VEHICULO]})`, 'warning', null);
                
                return createResponse(true, { id: 'Consumo eliminado' });
            }
        }
        throw new Error('Consumo no encontrado');
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

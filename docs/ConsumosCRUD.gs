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
    
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', '№', 'CODIGO'],
        FECHA: ['FECHA', 'TIMESTAMP', 'DIA'],
        EMPRESA: ['EMPRESA/USUARIO', 'EMPRESA', 'USER', 'USUARIO', 'CONDUCTOR', 'PERSONA'],
        VEHICULO: ['VEHICULO', 'PATENTE', 'ACTIVO', 'VEHICULO/PATENTE'],
        ESTANQUE: ['ESTANQUE', 'BODEGA'],
        LITROS: ['LITROS USADOS', 'LITROS', 'CANTIDAD'],
        KM: ['KILOMETRAJE', 'KM', 'ODO'],
        INI: ['CONTADOR INICIAL', 'INICIAL'],
        FIN: ['CONTADOR FINAL', 'FINAL'],
        RESPONSABLE: ['PERSONAL RESPONSABLE', 'RESPONSABLE', 'ENCARGADO'],
        JUSTIFICACION: ['JUSTIFICACION', 'MOTIVO', 'COMENTARIO', 'OBSERVACIONES'],
        OBSERVACIONES: ['OBSERVACIONES', 'OBS'],
        RENDIMIENTO: ['RENDIMIENTO']
    });

    // FAIL-SAFE: Fallback a posiciones fijas (basado en imagen Excel)
    const getIdx = (key, fallback) => (colMap[key] !== undefined && colMap[key] !== -1) ? colMap[key] : fallback;
    
    const idIdx = getIdx('ID', 0);
    const fechaIdx = getIdx('FECHA', 1);
    const empresaIdx = getIdx('EMPRESA', 2);
    const vehIdx = getIdx('VEHICULO', 3); // Columna D
    const estIdx = getIdx('ESTANQUE', 4);
    const litIdx = getIdx('LITROS', 5);
    const kmIdx = getIdx('KM', 6);
    const iniIdx = getIdx('INI', 7);
    const finIdx = getIdx('FIN', 8);
    const respIdx = getIdx('RESPONSABLE', 9);
    const justIdx = getIdx('JUSTIFICACION', 10); // Columna K
    const obsIdx = getIdx('OBSERVACIONES', 10); // Fallback to Justificacion if Obs not found
    const rendIdx = getIdx('RENDIMIENTO', 11);

    const consumos = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[idIdx] && !row[fechaIdx]) continue;

        let justVal = String(row[justIdx] || '').trim();
        if (obsIdx !== justIdx && obsIdx !== -1) {
          const obsVal = String(row[obsIdx] || '').trim();
          if (obsVal && !justVal.includes(obsVal)) justVal += ' ' + obsVal;
        }

        consumos.push({
            id: row[idIdx] || `ID-${i}`,
            fecha: row[fechaIdx],
            empresa: String(row[empresaIdx] || ''),
            vehiculo: String(row[vehIdx] || '').trim(),
            estanque: String(row[estIdx] || ''),
            litrosUsados: parseFloat(row[litIdx]) || 0,
            kilometraje: parseFloat(row[kmIdx]) || 0,
            contadorInicial: parseFloat(row[iniIdx]) || 0,
            contadorFinal: parseFloat(row[finIdx]) || 0,
            responsable: String(row[respIdx] || ''),
            justificacion: justVal,
            rendimiento: parseFloat(row[rendIdx]) || 0
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
    
    const colInfo = findColumnIndices(sheet, { ID: ['ID', 'CODIGO'] });
    const idIdx = colInfo._map.ID !== -1 ? colInfo._map.ID : 0;
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (String(row[idIdx]) === String(id)) {
            // Mapping for all fields
            const allCols = findColumnIndices(sheet, {
                ID: ['ID'], FECHA: ['FECHA'], EMPRESA: ['EMPRESA/USUARIO'], VEHICULO: ['VEHICULO'],
                ESTANQUE: ['ESTANQUE'], LITROS: ['LITROS'], KM: ['KILOMETRAJE'], INI: ['CONTADOR INICIAL'],
                FIN: ['CONTADOR FINAL'], RESPONSABLE: ['PERSONAL RESPONSABLE'], JUST: ['JUSTIFICACION'], REND: ['RENDIMIENTO']
            });
            const m = allCols;
            
            return createResponse(true, {
                id: row[idIdx],
                fecha: m.FECHA !== -1 ? row[m.FECHA] : '',
                empresa: m.EMPRESA !== -1 ? row[m.EMPRESA] : '',
                vehiculo: m.VEHICULO !== -1 ? row[m.VEHICULO] : '',
                estanque: m.ESTANQUE !== -1 ? row[m.ESTANQUE] : '',
                litrosUsados: m.LITROS !== -1 ? row[m.LITROS] : 0,
                kilometraje: m.KM !== -1 ? row[m.KM] : 0,
                contadorInicial: m.INI !== -1 ? row[m.INI] : 0,
                contadorFinal: m.FIN !== -1 ? row[m.FIN] : 0,
                responsable: m.RESPONSABLE !== -1 ? row[m.RESPONSABLE] : '',
                justificacion: m.JUST !== -1 ? row[m.JUST] : '',
                rendimiento: m.REND !== -1 ? row[m.REND] : 0
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

    // Dynamic Mapping for insertion
    const colMap = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA'],
        EMPRESA: ['EMPRESA/USUARIO', 'EMPRESA'],
        VEHICULO: ['VEHICULO', 'PATENTE'],
        ESTANQUE: ['ESTANQUE'],
        LITROS: ['LITROS USADOS', 'LITROS'],
        KILOMETRAJE: ['KILOMETRAJE', 'KM'],
        INICIAL: ['CONTADOR INICIAL'],
        FINAL: ['CONTADOR FINAL'],
        RESPONSABLE: ['PERSONAL RESPONSABLE', 'RESPONSABLE'],
        JUSTIFICACION: ['JUSTIFICACION', 'MOTIVO'],
        RENDIMIENTO: ['RENDIMIENTO']
    });

    // Generate sequential ID
    const id = generateSequentialId('CONS', SHEET_NAMES.CONSUMOS, 'ID', 7);
    
    // Determine array size
    const maxIdx = Math.max(...Object.values(colMap), 11);
    const newRow = Array(maxIdx + 1).fill('');

    const set = (keyIdx, val) => {
        if (keyIdx !== -1) newRow[keyIdx] = val;
    };

    set(colMap.ID !== -1 ? colMap.ID : 0, id);
    set(colMap.FECHA !== -1 ? colMap.FECHA : 1, formatDate(data.fecha || new Date()));
    set(colMap.EMPRESA !== -1 ? colMap.EMPRESA : 2, data.empresa || '-');
    set(colMap.VEHICULO !== -1 ? colMap.VEHICULO : 3, data.vehiculo);
    set(colMap.ESTANQUE !== -1 ? colMap.ESTANQUE : 4, data.estanque || '');
    set(colMap.LITROS !== -1 ? colMap.LITROS : 5, parseFloat(data.litrosUsados) || 0);
    set(colMap.KILOMETRAJE !== -1 ? colMap.KILOMETRAJE : 6, parseFloat(data.kilometraje) || 0);
    set(colMap.INICIAL !== -1 ? colMap.INICIAL : 7, parseFloat(data.contadorInicial) || 0);
    set(colMap.FINAL !== -1 ? colMap.FINAL : 8, parseFloat(data.contadorFinal) || 0);
    set(colMap.RESPONSABLE !== -1 ? colMap.RESPONSABLE : 9, data.responsable || 'Admin');
    set(colMap.JUSTIFICACION !== -1 ? colMap.JUSTIFICACION : 10, data.justificacion || data.observaciones || '-');
    
    // Calculate Rendimiento if possible
    if (data.litrosUsados > 0 && data.kilometraje > 0) {
        set(colMap.RENDIMIENTO !== -1 ? colMap.RENDIMIENTO : 11, (data.kilometraje / data.litrosUsados).toFixed(2));
    }

    sheet.appendRow(newRow);
    
    // Update Stock Estanque
    if (data.estanque && data.litrosUsados) {
        updateEstanqueStock(data.estanque, -parseFloat(data.litrosUsados));
    }

    // Audit Log
    registrarAccion('Consumo', 'crear', `Nuevo consumo de ${data.litrosUsados}L para vehículo ${data.vehiculo} (ID: ${id})`, 'success', data.responsable);
    createAlerta('Consumo', 'info', `Nuevo consumo de ${data.litrosUsados}L - ${data.vehiculo}`, data.responsable);

    return createResponse(true, { id: id, ...data });
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function updateConsumo(id, data) {
  try {
    if (!id) throw new Error('ID es requerido');
    const sheet = getSheet(SHEET_NAMES.CONSUMOS);
    const values = sheet.getDataRange().getValues();
    
    const colInfo = findColumnIndices(sheet, {
        ID: ['ID', 'CODIGO'],
        FECHA: ['FECHA'],
        EMPRESA: ['EMPRESA/USUARIO', 'EMPRESA'],
        VEHICULO: ['VEHICULO', 'PATENTE'],
        ESTANQUE: ['ESTANQUE'],
        LITROS: ['LITROS USADOS', 'LITROS'],
        KM: ['KILOMETRAJE', 'KM'],
        INI: ['CONTADOR INICIAL', 'INICIAL'],
        FIN: ['CONTADOR FINAL', 'FINAL'],
        RESP: ['PERSONAL RESPONSABLE', 'RESPONSABLE'],
        JUST: ['JUSTIFICACION', 'MOTIVO'],
        REND: ['RENDIMIENTO']
    });
    
    const cMap = colInfo;
    const idIdx = (cMap.ID !== undefined && cMap.ID !== -1) ? cMap.ID : 0;
    
    for (let i = 1; i < values.length; i++) {
       if (String(values[i][idIdx]) === String(id)) {
           const row = i + 1;
           const oldLitros = parseFloat(values[i][cMap.LITROS !== -1 ? cMap.LITROS : 5]) || 0;
           const oldEstanque = cMap.ESTANQUE !== -1 ? values[i][cMap.ESTANQUE] : '';
           
           const newLitros = data.litrosUsados !== undefined ? parseFloat(data.litrosUsados) : oldLitros;
           const newEstanque = data.estanque || oldEstanque;
           
           const setV = (key, val) => {
               if (cMap[key] !== -1 && val !== undefined) {
                   sheet.getRange(row, cMap[key] + 1).setValue(val);
               }
           };

           if (data.fecha) setV('FECHA', data.fecha);
           if (data.empresa) setV('EMPRESA', data.empresa);
           if (data.vehiculo) setV('VEHICULO', data.vehiculo);
           if (data.estanque) setV('ESTANQUE', data.estanque);
           if (data.litrosUsados !== undefined) setV('LITROS', data.litrosUsados);
           if (data.kilometraje !== undefined) setV('KM', data.kilometraje);
           if (data.contadorInicial !== undefined) setV('INI', data.contadorInicial);
           if (data.contadorFinal !== undefined) setV('FIN', data.contadorFinal);
           if (data.responsable) setV('RESP', data.responsable);
           if (data.justificacion || data.observaciones) setV('JUST', data.justificacion || data.observaciones);
           
           if (newLitros > 0 && data.kilometraje > 0) {
               const rendimiento = (data.kilometraje / newLitros).toFixed(2);
               setV('REND', rendimiento);
           }

           if (oldEstanque === newEstanque) {
               const diff = newLitros - oldLitros;
               if (diff !== 0) updateEstanqueStock(newEstanque, -diff);
           } else {
               if (oldEstanque) updateEstanqueStock(oldEstanque, oldLitros);
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
        
        const colMap = findColumnIndices(sheet, {
            ID: ['ID', 'CODIGO'],
            LITROS: ['LITROS'],
            ESTANQUE: ['ESTANQUE'],
            VEHICULO: ['VEHICULO', 'PATENTE']
        });
        const idIdx = colMap.ID !== -1 ? colMap.ID : 0;
        const litIdx = colMap.LITROS !== -1 ? colMap.LITROS : 5;
        const estIdx = colMap.ESTANQUE !== -1 ? colMap.ESTANQUE : 4;
        const vehIdx = colMap.VEHICULO !== -1 ? colMap.VEHICULO : 3;
        
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][idIdx] == id) {
                const litros = rows[i][litIdx];
                const estanque = rows[i][estIdx];
                const vehiculo = rows[i][vehIdx];
                
                sheet.deleteRow(i + 1);
                
                // Restore Stock ONLY if requested
                if (data && data.restoreStock === true && estanque && litros) {
                    updateEstanqueStock(estanque, parseFloat(litros));
                }
                
                // Audit Log
                registrarAccion('Consumo', 'eliminar', `Eliminado registro de consumo ${id} (Vehículo: ${vehiculo})`, 'warning', null, data ? data.justificacion : null);
                createAlerta('Consumo', 'warning', `Consumo eliminado: ${id} - ${vehiculo}`, null, 'eliminar');
                
                return createResponse(true, { id: 'Consumo eliminado' });
            }
        }
        throw new Error('Consumo no encontrado');
    } catch (error) {
        return createResponse(false, null, error.toString());
    }
}

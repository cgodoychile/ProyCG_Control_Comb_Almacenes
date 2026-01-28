/**
 * LÓGICA CORE DE OPERACIONES (CRUD)
 */

function handleGetAll(entity) {
  try {
    const entityKey = (entity || '').toUpperCase();
    const sheetName = SHEET_NAMES[entityKey];
    const mapping = COLUMNS[entityKey];
    
    console.log(`[BaseCRUD] handleGetAll - Entity: ${entity}, Key: ${entityKey}, SheetName: ${sheetName}`);
    
    if (!sheetName) throw new Error(`Nombre de hoja no mapeado para entidad: ${entityKey}`);
    
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);
    
    const result = data.slice(1).map((row, index) => {
      const item = { _row: index + 2 };
      for (const [key, colIndex] of Object.entries(mapping)) {
        let value = row[colIndex];
        // Formatear fechas si la columna contiene "FECHA"
        if (key.includes("FECHA") && value instanceof Date) {
          value = formatDate(value);
        }
        item[key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())] = value;
      }
      return item;
    });
    
    return createResponse(true, result);
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function handleCreate(entity, rawData, responsable) {
  try {
    const entityKey = (entity || '').toUpperCase();
    const sheetName = SHEET_NAMES[entityKey];
    const mapping = COLUMNS[entityKey];
    
    console.log(`[BaseCRUD] handleCreate - Entity: ${entity}, Key: ${entityKey}, SheetName: ${sheetName}`);
    
    if (!sheetName) throw new Error(`Nombre de hoja no mapeado para entidad: ${entityKey}`);
    
    const sheet = getSheet(sheetName);
    
    // ID Automático si no viene
    if (mapping.ID !== undefined && !rawData.id) {
      if (entityKey === 'ACTIVOS') {
        rawData.id = generateActivoId();
      } else if (entityKey.includes('MANTENCION') || entityKey.startsWith('MAN')) {
        // SEGURIDAD NIVEL 2: BaseCRUD nunca debe procesar mantenciones
        console.warn("BaseCRUD intercepción: MANTENCION/MAN detectada. Redirigiendo a CRUD específico.");
        return handleMantencionesPost('create', null, rawData);
      } else {
        const prefix = entityKey.substring(0, 3);
        rawData.id = generateAutoId(prefix);
      }
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = Array(headers.length).fill('');
    
    // Asignar valores según mapeo
    for (const [key, colIndex] of Object.entries(mapping)) {
      const dataKey = key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      if (rawData[dataKey] !== undefined) {
        newRow[colIndex] = rawData[dataKey];
      }
    }
    
    sheet.appendRow(newRow);
    
    // Lógica de Negocio Automática
    processImpact(entityKey, rawData, 'CREATE');
    
    // Registrar Alerta/Auditoría
    createAlerta(entity, 'ALTA', `Nuevo registro en ${entity}: ${rawData.id || 'N/A'}`, responsable);
    
    return createResponse(true, { id: rawData.id }, "Registro creado exitosamente");
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function handleUpdate(entity, id, rawData, responsable) {
  try {
    const entityKey = entity.toUpperCase();
    const sheetName = SHEET_NAMES[entityKey];
    const mapping = COLUMNS[entityKey];
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
        if (data[i][mapping.ID] == id) {
            // No permitimos cambiar el ID
            delete rawData.id;
            
            for (const [key, colIndex] of Object.entries(mapping)) {
                const dataKey = key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                if (rawData[dataKey] !== undefined) {
                    sheet.getRange(i + 1, colIndex + 1).setValue(rawData[dataKey]);
                }
            }
            
            createAlerta(entity, 'MODIFICACIÓN', `Actualizado registro en ${entity}: ${id}`, responsable);
            return createResponse(true, null, "Registro actualizado");
        }
    }
    return createErrorResponse("ID no encontrado");
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function handleDelete(entity, id, params, responsable) {
  try {
    const entityKey = entity.toUpperCase();
    const sheetName = SHEET_NAMES[entityKey];
    const mapping = COLUMNS[entityKey];
    if (!mapping) throw new Error("Mapeo no encontrado para " + entityKey);
    
    const sheet = getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    // Buscar el índice del ID (soporta ID o PATENTE)
    const idIdx = (mapping && mapping.ID !== undefined) ? mapping.ID : (mapping && mapping.PATENTE !== undefined ? mapping.PATENTE : 0);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id)) {
        const deletedData = {};
        for (const [key, colIndex] of Object.entries(mapping)) {
          deletedData[key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())] = data[i][colIndex];
        }
        
        sheet.deleteRow(i + 1);
        
        // Impacto inverso
        if (params && params.restoreStock !== false) {
          processImpact(entityKey, deletedData, 'DELETE');
        }
        
        registrarAccion(entity, 'eliminar', `Eliminado registro en ${entity}: ${id}`, 'warning', responsable);
        return createResponse(true, null, "Registro eliminado");
      }
    }
    return createErrorResponse("ID no encontrado: " + id);
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

/**
 * PROCESADOR DE IMPACTO AUTOMÁTICO
 * Maneja las actualizaciones cruzadas entre hojas.
 */
function processImpact(entity, data, action) {
  const entityKey = entity.toUpperCase();
  if (entityKey === 'CONSUMOS') {
    if (action === 'CREATE') {
      updateEstanqueStock(data.estanque, -(parseFloat(data.litrosUsados) || 0));
      if ((parseFloat(data.litrosUsados) || 0) >= 80) {
        createAlerta('Consumo', 'warning', `Consumo excesivo: ${data.litrosUsados}L por ${data.responsable} en ${data.vehiculo}`);
      }
    } else if (action === 'DELETE') {
      updateEstanqueStock(data.estanque, (parseFloat(data.litrosUsados) || 0));
    }
  } else if (entityKey === 'CARGAS') {
    if (action === 'CREATE') {
      updateEstanqueStock(data.estanque, (parseFloat(data.litros) || 0));
    } else if (action === 'DELETE') {
      updateEstanqueStock(data.estanque, -(parseFloat(data.litros) || 0));
    }
  } else if (entityKey === 'ACTIVOS') {
    if (action === 'CREATE') {
      // Sincronización delegada a ActivosCRUD para evitar duplicados
      // registerActivoInAlmacen(data); // COMENTADO O ELIMINADO para evitar duplicación
    } else if (action === 'DELETE') {
      deleteActivoFromAlmacen(data.id, data.ubicacion, data.valorInicial);
    }
  } else if (entityKey === 'MANTENCIONES') {
    if (action === 'CREATE' && data.estado === 'Completada') {
      updateVehiculoInfo(data.vehiculo, data.kmActual, data.fechaIngreso);
    }
  } else if (entityKey === 'MOVIMIENTOS_ALMACEN') {
    if (action === 'CREATE') {
      handleMovimientoImpact(data);
    }
  }
}

function handleMovimientoImpact(m) {
  try {
    const productSheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const prodMapping = COLUMNS.PRODUCTOS_ALMACEN;
    const prodData = productSheet.getDataRange().getValues();
    let productRow = -1;
    let producto = null;

    for (let i = 1; i < prodData.length; i++) {
      if (prodData[i][prodMapping.ID].toString() === m.productoId.toString()) {
        productRow = i + 1;
        producto = prodData[i];
        break;
      }
    }

    if (!producto) return;

    const tipo = m.tipo.toUpperCase();
    const cant = parseFloat(m.cantidad) || 0;
    let stockDiff = 0;
    let inUseDiff = 0;
    let valueDiff = 0;

    const isRetornable = producto[prodMapping.ES_RETORNABLE] === true || producto[prodMapping.ES_RETORNABLE] === 'true';
    const valorUnit = parseFloat(producto[prodMapping.VALOR_UNITARIO]) || 0;

    if (tipo === 'ENTRADA') {
      stockDiff = cant;
      valueDiff = cant * valorUnit;
    } else if (tipo === 'SALIDA') {
      stockDiff = -cant;
      if (isRetornable) {
        inUseDiff = cant;
        // Productos retornables NO descuentan valor al salir
        valueDiff = 0;
      } else {
        valueDiff = -(cant * valorUnit);
      }
    } else if (tipo === 'RETORNO') {
      stockDiff = cant;
      inUseDiff = -cant;
      valueDiff = 0;
    } else if (tipo === 'TRASLADO') {
       // El traslado es más complejo si movemos entre almacenes diferentes
       // Por ahora, asumimos que el stock del "producto" es global pero tiene un AlmacenID.
       // Si el traslado cambia el AlmacenID del producto, actualizamos el producto.
       if (m.almacenDestino && m.almacenDestino !== m.almacenOrigen) {
         productSheet.getRange(productRow, prodMapping.ALMACEN_ID + 1).setValue(m.almacenDestino);
         // Ajustar valores de inventario de ambas bodegas
         const totalVal = (parseFloat(producto[prodMapping.CANTIDAD]) || 0) * valorUnit;
         updateAlmacenCost(m.almacenOrigen, -totalVal);
         updateAlmacenCost(m.almacenDestino, totalVal);
       }
    }

    if (stockDiff !== 0) {
      const currentStock = parseFloat(producto[prodMapping.CANTIDAD]) || 0;
      productSheet.getRange(productRow, prodMapping.CANTIDAD + 1).setValue(currentStock + stockDiff);
    }
    if (inUseDiff !== 0) {
      const currentInUse = parseFloat(producto[prodMapping.CANTIDAD_EN_USO]) || 0;
      productSheet.getRange(productRow, prodMapping.CANTIDAD_EN_USO + 1).setValue(currentInUse + inUseDiff);
    }
    if (valueDiff !== 0) {
      updateAlmacenCost(m.almacenOrigen, valueDiff);
    }

  } catch (e) { console.error("Error handleMovimientoImpact: " + e.toString()); }
}

function updateEstanqueStock(nombre, cantidad) {
  try {
    const sheet = getSheet(SHEET_NAMES.ESTANQUES);
    const data = sheet.getDataRange().getValues();
    const mapping = COLUMNS.ESTANQUES;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][mapping.NOMBRE] === nombre) {
        const currentStock = parseFloat(data[i][mapping.STOCK_ACTUAL]) || 0;
        sheet.getRange(i + 1, mapping.STOCK_ACTUAL + 1).setValue(currentStock + cantidad);
        sheet.getRange(i + 1, mapping.FECHA_ULTIMA_CARGA + 1).setValue(new Date());
        return true;
      }
    }
  } catch(e) { console.error("Error stock estanque: " + e.toString()); }
  return false;
}

function updateVehiculoInfo(patente, km, fecha) {
  try {
    const sheet = getSheet(SHEET_NAMES.VEHICULOS);
    const data = sheet.getDataRange().getValues();
    const mapping = COLUMNS.VEHICULOS || { ID: 0, KILOMETRAJE: 6, ULTIMA_MANTENCION: 8 };
    
    for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][mapping.ID || 0]).toString().toUpperCase();
        if (rowId === patente.toString().toUpperCase()) {
            const kmIdx = mapping.KILOMETRAJE !== undefined ? mapping.KILOMETRAJE : 6;
            const currentKm = parseFloat(data[i][kmIdx]) || 0;
            // Solo actualizar si el nuevo KM es mayor
            if (parseFloat(km) > currentKm) {
              sheet.getRange(i + 1, kmIdx + 1).setValue(km);
            }
            const ultIdx = mapping.ULTIMA_MANTENCION !== undefined ? mapping.ULTIMA_MANTENCION : 8;
            sheet.getRange(i + 1, ultIdx + 1).setValue(fecha);
            return true;
        }
    }
  } catch(e) { console.error("Error updateVehiculoInfo: " + e.toString()); }
  return false;
}

function registerActivoInAlmacen(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const mapping = COLUMNS.PRODUCTOS_ALMACEN;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = Array(headers.length).fill('');
    
    // Mapeo manual para asegurar precisión
    newRow[mapping.ID] = generateAutoId('PROD');
    newRow[mapping.NOMBRE] = data.nombre;
    newRow[mapping.DESCRIPCION] = `Activo: ${data.id} - ${data.categoria}`;
    newRow[mapping.CATEGORIA] = data.categoria;
    newRow[mapping.UNIDAD] = 'UNIDAD';
    newRow[mapping.CANTIDAD] = 1;
    newRow[mapping.VALOR_UNITARIO] = data.valorInicial || 0;
    newRow[mapping.UBICACION] = data.ubicacion;
    newRow[mapping.ES_RETORNABLE] = true;
    newRow[mapping.ES_ACTIVO] = true;
    
    sheet.appendRow(newRow);
    
    // Actualizar costo en la bodega
    updateAlmacenCost(data.ubicacion, parseFloat(data.valorInicial) || 0);
  } catch(e) { console.error("Error registerActivoInAlmacen: " + e.toString()); }
}

function deleteActivoFromAlmacen(activoId, bodega, costo) {
  try {
    const sheet = getSheet(SHEET_NAMES.PRODUCTOS_ALMACEN);
    const data = sheet.getDataRange().getValues();
    const mapping = COLUMNS.PRODUCTOS_ALMACEN;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][mapping.DESCRIPCION].toString().includes(activoId)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    updateAlmacenCost(bodega, -(parseFloat(costo) || 0));
  } catch(e) { console.error("Error deleteActivoFromAlmacen: " + e.toString()); }
}

function updateAlmacenCost(almacenNombre, diferenciaCosto) {
  try {
    const sheet = getSheet(SHEET_NAMES.ALMACENES);
    const data = sheet.getDataRange().getValues();
    const mapping = COLUMNS.ALMACENES;
    
    for (let i = 1; i < data.length; i++) {
        // En Almacenes, el nombre suele ser el ID o identificador único
        if (data[i][mapping.NOMBRE] === almacenNombre) {
            const currentCost = parseFloat(data[i][mapping.VALOR_INVENTARIO]) || 0;
            sheet.getRange(i + 1, mapping.VALOR_INVENTARIO + 1).setValue(currentCost + diferenciaCosto);
            return true;
        }
    }
  } catch(e) { console.error("Error updateAlmacenCost: " + e.toString()); }
  return false;
}

function handleLogin(email, password) {
  try {
    const sheet = getSheet(SHEET_NAMES.USUARIOS);
    const data = sheet.getDataRange().getValues();
    const mapping = COLUMNS.USUARIOS;

    for (let i = 1; i < data.length; i++) {
      const dbEmail = data[i][mapping.EMAIL];
      const dbPass = data[i][mapping.PASSWORD];
      
      if (dbEmail === email && dbPass === password) {
        const user = {
          email: dbEmail,
          name: data[i][mapping.NAME],
          role: data[i][mapping.ROLE] || 'user'
        };
        return createResponse(true, user, "Login exitoso");
      }
    }
    return createErrorResponse("Credenciales incorrectas", 401);
  } catch (e) {
    return createErrorResponse("Error en login: " + e.toString());
  }
}

function generateActivoId() {
  const sheet = getSheet(SHEET_NAMES.ACTIVOS);
  const nextId = sheet.getLastRow(); 
  return "ACT-" + String(nextId).padStart(5, '0');
}

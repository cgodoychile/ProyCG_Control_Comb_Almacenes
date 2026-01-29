/**
 * MÓDULO DE DASHBOARD Y ESTADÍSTICAS
 */

function getDashboardStats() {
  try {
    // Audit check for overdue returns
    if (typeof checkOverdueMovements === 'function') {
      checkOverdueMovements();
    }
    
    const stats = {
      combustible: calculateCombustibleStats(),
      almacenes: calculateAlmacenStats(),
      alertas: (getActiveAlertas().data || []).length,
      flota: calculateFlotaStats()
    };
    return createResponse(true, stats);
  } catch (e) {
    return createErrorResponse(e.toString());
  }
}

function calculateCombustibleStats() {
  const sheet = getSheet(SHEET_NAMES.CONSUMOS);
  const data = sheet.getDataRange().getValues();
  
  const colMap = findColumnIndices(sheet, {
    FECHA: ['FECHA'],
    LITROS: ['LITROS_USADOS', 'LITROS', 'CANTIDAD']
  });

  const fIdx = colMap.FECHA !== -1 ? colMap.FECHA : 1;
  const lIdx = colMap.LITROS !== -1 ? colMap.LITROS : 5;
  
  const estanquesResp = handleGetAll('estanques');
  const estanques = estanquesResp.success ? (estanquesResp.data || []) : [];
  
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  let totalLitrosMes = 0;
  let totalLitrosAnual = 0;
  
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const fecha = parseDate(row[fIdx]);
      if (!fecha || isNaN(fecha.getTime())) continue;
      
      const cLitros = parseFloat(row[lIdx]) || 0;
      if (fecha.getFullYear() === thisYear) {
        totalLitrosAnual += cLitros;
        if (fecha.getMonth() === thisMonth) {
          totalLitrosMes += cLitros;
        }
      }
    }
  }

  // Calculate Costs from Cargas
  let gastoMes = 0;
  let gastoAnual = 0;
  
  // Debug info
  let debugMsg = "";

  try {
      // Intenta usar el nombre de la constante, si falla, usa 'CargasEstanques' directo
      let sheetCargas = getSheet(SHEET_NAMES.CARGAS);
      if (!sheetCargas) sheetCargas = getSheet('CargasEstanques');
      
      if (sheetCargas) {
          const dataCargas = sheetCargas.getDataRange().getValues();
          if (dataCargas.length > 1) {
              const colMapCargas = findColumnIndices(sheetCargas, {
                  FECHA: ['FECHA', 'FECHA_INGRESO'],
                  TOTAL: ['TOTAL', 'VALOR_TOTAL', 'COSTO_TOTAL', 'Total', 'Precio Total']
              });
              
              // Fallback to Column O (Index 14) if TOTAL not found, as verified in browser
              const totIdx = colMapCargas.TOTAL !== -1 ? colMapCargas.TOTAL : 14; 
              const fcIdx = colMapCargas.FECHA !== -1 ? colMapCargas.FECHA : 1; // Default to B (Index 1)

              for (let i = 1; i < dataCargas.length; i++) {
                  const row = dataCargas[i];
                  const fecha = parseDate(row[fcIdx]);
                  
                  if (!fecha || isNaN(fecha.getTime())) continue;

                  // Clean value string (remove $ or dots if present)
                  let rawVal = row[totIdx];
                  if (typeof rawVal === 'string') {
                      rawVal = rawVal.replace(/[\$\.]/g, '').replace(',', '.').trim();
                  }
                  const monto = parseFloat(rawVal) || 0;

                  if (fecha.getFullYear() === thisYear) {
                      gastoAnual += monto;
                      if (fecha.getMonth() === thisMonth) {
                          gastoMes += monto;
                      }
                  }
              }
          }
      }
  } catch(e) {
      Logger.log("Error calculating costs: " + e);
  }
  
  return {
    litrosMesActual: totalLitrosMes,
    litrosAnioActual: totalLitrosAnual,
    gastoMesActual: gastoMes,
    gastoAnioActual: gastoAnual,
    estanquesLowStock: estanques.filter(e => (parseFloat(e.stockActual) || 0) < (parseFloat(e.stockMinimo) || 0)).length,
    totalStockDisponible: estanques.reduce((acc, e) => acc + (parseFloat(e.stockActual) || 0), 0)
  };
}

function calculateAlmacenStats() {
  const response = getAllAlmacenes();
  const almacenes = response.success ? (response.data || []) : [];
  const valorInventario = almacenes.reduce((acc, a) => acc + (parseFloat(a.valorInventario) || 0), 0);
  return {
    totalBodegas: almacenes.length,
    valorInventarioTotal: valorInventario
  };
}

function calculateFlotaStats() {
  const vehiculosResp = handleVehiculosGet('getAll');
  const vehiculos = vehiculosResp.success ? (vehiculosResp.data || []) : [];
  
  const mantencionesResp = handleMantencionesGet('getAll');
  const mantenciones = mantencionesResp.success ? (mantencionesResp.data || []) : [];
  
  return {
    totalVehiculos: vehiculos.length,
    enMantencion: vehiculos.filter(v => ['mantencion', 'mantención'].includes(String(v.estado).toLowerCase())).length,
    mantencionesPendientes: mantenciones.filter(m => String(m.estado).toLowerCase() === 'agendada').length
  };
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Si no es un Date, intentar parsear formato DD-MM-YYYY HH:mm o ISO
  const s = String(dateStr);
  const parts = s.split(' ')[0].split(/[-/]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0]);
    const p1 = parseInt(parts[1]);
    const p2 = parseInt(parts[2]);
    
    if (p2 > 1000) { // DD-MM-YYYY
      return new Date(p2, p1 - 1, p0);
    } else if (p0 > 1000) { // YYYY-MM-DD
      return new Date(p0, p1 - 1, p2);
    }
  }
  return new Date(s);
}

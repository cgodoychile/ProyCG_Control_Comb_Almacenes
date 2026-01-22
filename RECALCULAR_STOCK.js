/**
 * SCRIPT DE RECALCULO DE STOCK
 * 
 * Instrucciones:
 * 1. Copia este código.
 * 2. Pégalo en un nuevo archivo o al final de Main.gs en tu proyecto de Apps Script.
 * 3. Ejecuta la función "recalcularStockTotal" desde el editor.
 */

function recalcularTotal() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // Usa el ID de Config.gs

    const sheetEstanques = ss.getSheetByName(SHEET_NAMES.ESTANQUES);
    const sheetCargas = ss.getSheetByName(SHEET_NAMES.CARGAS);
    const sheetConsumos = ss.getSheetByName(SHEET_NAMES.CONSUMOS);

    const estanquesData = sheetEstanques.getDataRange().getValues();
    const cargasData = sheetCargas.getDataRange().getValues();
    const consumosData = sheetConsumos.getDataRange().getValues();

    // 1. Resetear stocks a 0
    const stocks = {}; // Mapa: NombreEstanque -> Cantidad

    // Inicializar mapa con nombres de estanques
    for (let i = 1; i < estanquesData.length; i++) {
        const nombre = estanquesData[i][COLUMNS.ESTANQUES.NOMBRE];
        if (nombre) {
            stocks[nombre] = 0;
        }
    }

    // 2. Sumar Cargas
    for (let i = 1; i < cargasData.length; i++) {
        const nombre = cargasData[i][COLUMNS.CARGAS.ESTANQUE];
        const litros = parseFloat(cargasData[i][COLUMNS.CARGAS.LITROS]) || 0;
        if (stocks.hasOwnProperty(nombre)) {
            stocks[nombre] += litros;
        }
    }

    // 3. Restar Consumos
    for (let i = 1; i < consumosData.length; i++) {
        const nombre = consumosData[i][COLUMNS.CONSUMOS.ESTANQUE];
        const litros = parseFloat(consumosData[i][COLUMNS.CONSUMOS.LITROS_USADOS]) || 0;
        if (stocks.hasOwnProperty(nombre)) {
            stocks[nombre] -= litros;
        }
    }

    // 4. Escribir resultados en hoja Estanques
    for (let i = 1; i < estanquesData.length; i++) {
        const nombre = estanquesData[i][COLUMNS.ESTANQUES.NOMBRE];
        if (stocks.hasOwnProperty(nombre)) {
            // +1 porque getRange es 1-based, y otra corrección por encabezado si fuera necesario
            // Aquí estamos iterando data que incluye encabezado en índice 0
            sheetEstanques.getRange(i + 1, COLUMNS.ESTANQUES.STOCK_ACTUAL + 1).setValue(stocks[nombre]);
        }
    }

    return "Recálculo completado exitosamente";
}

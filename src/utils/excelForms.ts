import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LOGO_URL = '/LogoCorpEnel.png';

// Helper to fetch image as buffer
const fetchImage = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
};

/**
 * Genera un archivo Excel con el formulario de registro manual de consumo
 * Utiliza exceljs para un formato de alta fidelidad (idéntico a la vista previa)
 */
export const generateManualConsumptionExcel = async (tankName: string) => {
    const today = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registro Manual');

    // Configuración de página
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 9; // A4
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;
    worksheet.pageSetup.fitToHeight = 1;
    worksheet.pageSetup.margins = {
        left: 0.3, right: 0.3,
        top: 0.3, bottom: 0.3,
        header: 0, footer: 0
    };

    // Ancho de columnas
    worksheet.columns = [
        { width: 15 }, // Fecha/Hora
        { width: 25 }, // Conductor / Empresa
        { width: 18 }, // Vehículo
        { width: 12 }, // Litros
        { width: 14 }, // KM Vehículo
        { width: 14 }, // Contador Inicial
        { width: 14 }, // Contador Final
        { width: 16 }, // Firma Recep.
        { width: 28 }, // Justificación (>80L)
    ];

    // --- ENCABEZADO ---
    worksheet.mergeCells('A1:C2');

    // Embed Logo
    try {
        const logoBuffer = await fetchImage(LOGO_URL);
        const imageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });
        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            br: { col: 2, row: 2 },
            editAs: 'oneCell'
        } as any);
    } catch (e) {
        console.error("Error loading logo", e);
        const logoCell = worksheet.getCell('A1');
        logoCell.value = 'ENEL';
        logoCell.font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FF005EB8' } };
        logoCell.alignment = { vertical: 'middle', horizontal: 'left' };
    }

    worksheet.mergeCells('F1:I1');
    const titleCell = worksheet.getCell('F1');
    titleCell.value = 'FORMULARIO DE REGISTRO MANUAL';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'bottom', horizontal: 'right' };

    worksheet.mergeCells('F2:I2');
    const subTitleCell = worksheet.getCell('F2');
    subTitleCell.value = `Documento de Respaldo Terreno | Generado: ${today}`;
    subTitleCell.font = { name: 'Arial', size: 10, color: { argb: 'FF666666' } };
    subTitleCell.alignment = { vertical: 'top', horizontal: 'right' };

    // Línea divisoria negra
    worksheet.getRow(3).height = 4;
    for (let i = 1; i <= 9; i++) {
        worksheet.getCell(3, i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF000000' }
        };
    }

    // --- INFO BOX ---
    worksheet.getRow(4).height = 10; // Espaciador

    worksheet.mergeCells('A5:I6');
    const infoBox = worksheet.getCell('A5');
    infoBox.value = {
        richText: [
            { text: 'ESTACIÓN / ESTANQUE SELECCIONADO:\n', font: { size: 9, bold: true, color: { argb: 'FF666666' } } },
            { text: tankName.toUpperCase(), font: { size: 14, bold: true, color: { argb: 'FF005EB8' } } }
        ]
    };
    infoBox.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' }
    };
    infoBox.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    };
    infoBox.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };

    worksheet.getRow(7).height = 10; // Espaciador

    // --- TABLA ---
    const headerRow = worksheet.getRow(8);
    headerRow.height = 35;
    const headers = [
        'FECHA/HORA', 'CONDUCTOR / EMPRESA', 'VEHÍCULO (PATENTE)',
        'LITROS', 'KM VEHÍCULO', 'CONTADOR INICIAL',
        'CONTADOR FINAL', 'FIRMA RECEP.', 'JUSTIFICACIÓN (>80L)'
    ];

    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Arial', size: 9, bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    });

    // Filas de registro (25 filas)
    for (let r = 9; r <= 33; r++) {
        const row = worksheet.getRow(r);
        row.height = 22;
        for (let c = 1; c <= 9; c++) {
            const cell = row.getCell(c);
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        }
    }

    // --- PIE DE PÁGINA ---
    const footerRow = worksheet.getRow(34);
    footerRow.height = 20;

    worksheet.mergeCells('A34:G34');
    const footerText = worksheet.getCell('A34');
    footerText.value = '* Completar todos los campos de forma legible. Informar anomalías superiores a 80L.';
    footerText.font = { size: 9, italic: true, color: { argb: 'FF666666' } };
    footerText.alignment = { vertical: 'middle' };

    worksheet.mergeCells('H34:I34');
    const pageCell = worksheet.getCell('H34');
    pageCell.value = 'Página 1 de 1';
    pageCell.font = { size: 9, color: { argb: 'FF666666' } };
    pageCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // Generar buffer y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Formulario_Manual_${tankName.replace(/\s+/g, '_')}.xlsx`);
};

/**
 * Genera un archivo Excel con el formulario de inventario físico
 */
export const generateInventoryExcel = async (warehouseName: string) => {
    const today = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario Físico');

    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 9;
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.margins = { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0, footer: 0 };

    worksheet.columns = [
        { width: 6 },  // N°
        { width: 30 }, // Artículo / Descripción
        { width: 18 }, // Categoría
        { width: 10 }, // Unidad
        { width: 12 }, // Cant. Sistema
        { width: 12 }, // Cant. Física
        { width: 12 }, // Diferencia
        { width: 18 }, // Estado / Condición
        { width: 22 }, // Observaciones
    ];

    // Encabezado
    worksheet.mergeCells('A1:C2');

    // Embed Logo
    try {
        const logoBuffer = await fetchImage(LOGO_URL);
        const imageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });
        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            br: { col: 2, row: 2 },
            editAs: 'oneCell'
        } as any);
    } catch (e) {
        console.error("Error loading logo", e);
        const logoCell = worksheet.getCell('A1');
        logoCell.value = 'ENEL';
        logoCell.font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FF005EB8' } };
        logoCell.alignment = { vertical: 'middle' };
    }

    worksheet.mergeCells('G1:I1');
    const titleCell = worksheet.getCell('G1');
    titleCell.value = 'FORMULARIO DE INVENTARIO FÍSICO';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'bottom', horizontal: 'right' };

    worksheet.mergeCells('G2:I2');
    const subTitleCell = worksheet.getCell('G2');
    subTitleCell.value = `Documento de Verificación en Terreno | Generado: ${today}`;
    subTitleCell.font = { size: 10, color: { argb: 'FF666666' } };
    subTitleCell.alignment = { vertical: 'top', horizontal: 'right' };

    worksheet.getRow(3).height = 4;
    for (let i = 1; i <= 9; i++) {
        worksheet.getCell(3, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
    }

    // Info Boxes
    worksheet.mergeCells('A5:F6');
    const infoBox1 = worksheet.getCell('A5');
    infoBox1.value = {
        richText: [
            { text: 'ALMACÉN / BODEGA:\n', font: { size: 9, bold: true, color: { argb: 'FF666666' } } },
            { text: warehouseName.toUpperCase(), font: { size: 14, bold: true, color: { argb: 'FF005EB8' } } }
        ]
    };
    infoBox1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    infoBox1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    infoBox1.alignment = { vertical: 'middle', indent: 1 };

    worksheet.mergeCells('G5:I6');
    const infoBox2 = worksheet.getCell('G5');
    infoBox2.value = {
        richText: [
            { text: 'RESPONSABLE INVENTARIO:\n', font: { size: 9, bold: true, color: { argb: 'FF666666' } } },
            { text: '__________________________', font: { size: 12 } }
        ]
    };
    infoBox2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    infoBox2.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    infoBox2.alignment = { vertical: 'middle', indent: 1 };

    // Tabla
    const headerRow = worksheet.getRow(8);
    headerRow.height = 30;
    const invHeaders = ['N°', 'ARTÍCULO / DESCRIPCIÓN', 'CATEGORÍA', 'UNIDAD', 'CANT. SISTEMA', 'CANT. FÍSICA', 'DIFERENCIA', 'ESTADO/COND.', 'OBSERVACIONES'];

    invHeaders.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    for (let r = 9; r <= 38; r++) {
        const row = worksheet.getRow(r);
        row.height = 20;
        row.getCell(1).value = r - 8;
        for (let c = 1; c <= 9; c++) {
            row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
    }

    // Firmas
    worksheet.mergeCells('A40:D40');
    worksheet.getCell('A40').value = 'FIRMA RESPONSABLE INVENTARIO:';
    worksheet.getCell('A40').font = { bold: true, size: 9 };

    worksheet.mergeCells('F40:I40');
    worksheet.getCell('F40').value = 'FIRMA SUPERVISOR / VALIDACIÓN:';
    worksheet.getCell('F40').font = { bold: true, size: 9 };

    worksheet.mergeCells('A41:D43');
    worksheet.getCell('A41').border = { bottom: { style: 'thin' } };
    worksheet.mergeCells('F41:I43');
    worksheet.getCell('F41').border = { bottom: { style: 'thin' } };

    worksheet.mergeCells('A44:D44');
    worksheet.getCell('A44').value = 'Nombre y Firma';
    worksheet.getCell('A44').font = { size: 8, color: { argb: 'FF666666' } };

    worksheet.mergeCells('F44:I44');
    worksheet.getCell('F44').value = 'Nombre y Firma';
    worksheet.getCell('F44').font = { size: 8, color: { argb: 'FF666666' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Formulario_Inventario_${warehouseName.replace(/\s+/g, '_')}.xlsx`);
};

/**
 * Genera un archivo Excel con el formulario de control de salida de materiales
 */
export const generateManualExitExcel = async (warehouseName: string) => {
    const today = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Control de Salida');

    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.paperSize = 9;
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.margins = { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0, footer: 0 };

    worksheet.columns = [
        { width: 12 }, // Código
        { width: 35 }, // Descripción
        { width: 10 }, // Cantidad
        { width: 10 }, // Unidad
        { width: 25 }, // Destino / OT
        { width: 20 }, // Solicitante
        { width: 18 }, // Fecha Devolución
        { width: 20 }, // Firma
    ];

    // Encabezado
    worksheet.mergeCells('A1:C2');

    // Embed Logo
    try {
        const logoBuffer = await fetchImage(LOGO_URL);
        const imageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });
        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            br: { col: 2, row: 2 },
            editAs: 'oneCell'
        } as any);
    } catch (e) {
        console.error("Error loading logo", e);
        const logoCell = worksheet.getCell('A1');
        logoCell.value = 'ENEL';
        logoCell.font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FF005EB8' } };
        logoCell.alignment = { vertical: 'middle' };
    }

    worksheet.mergeCells('E1:H1');
    const titleCell = worksheet.getCell('E1');
    titleCell.value = 'CONTROL DE SALIDA DE MATERIALES';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'bottom', horizontal: 'right' };

    worksheet.mergeCells('E2:H2');
    const subTitleCell = worksheet.getCell('E2');
    subTitleCell.value = `Registro de Movimientos Diarios | Generado: ${today}`;
    subTitleCell.font = { size: 10, color: { argb: 'FF666666' } };
    subTitleCell.alignment = { vertical: 'top', horizontal: 'right' };

    worksheet.getRow(3).height = 4;
    for (let i = 1; i <= 8; i++) {
        worksheet.getCell(3, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
    }

    // Info Boxes
    worksheet.mergeCells('A5:E6');
    const infoBox1 = worksheet.getCell('A5');
    infoBox1.value = {
        richText: [
            { text: 'ALMACÉN / BODEGA:\n', font: { size: 9, bold: true, color: { argb: 'FF666666' } } },
            { text: warehouseName.toUpperCase(), font: { size: 14, bold: true, color: { argb: 'FF005EB8' } } }
        ]
    };
    infoBox1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    infoBox1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    infoBox1.alignment = { vertical: 'middle', indent: 1 };

    worksheet.mergeCells('F5:H6');
    const infoBox2 = worksheet.getCell('F5');
    infoBox2.value = {
        richText: [
            { text: 'RESPONSABLE ENTREGA:\n', font: { size: 9, bold: true, color: { argb: 'FF666666' } } },
            { text: '__________________________', font: { size: 12 } }
        ]
    };
    infoBox2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    infoBox2.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    infoBox2.alignment = { vertical: 'middle', indent: 1 };

    // Tabla
    const headerRow = worksheet.getRow(8);
    headerRow.height = 30;
    const invHeaders = ['CÓDIGO', 'DESCRIPCIÓN / PRODUCTO', 'CANTIDAD', 'UNIDAD', 'DESTINO / OT', 'SOLICITANTE', 'FECHA DEV. (Si aplica)', 'FIRMA RETIRO'];

    invHeaders.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    for (let r = 9; r <= 33; r++) { // ~25 rows
        const row = worksheet.getRow(r);
        row.height = 24; // Taller
        for (let c = 1; c <= 8; c++) {
            row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
    }

    // Pie de página
    const footerRow = worksheet.getRow(35);
    worksheet.mergeCells('A35:E35');
    const footerText = worksheet.getCell('A35');
    footerText.value = '* Todo retiro debe ser firmado por quien recibe el material. Para productos retornables, indicar fecha de devolución.';
    footerText.font = { size: 9, italic: true, color: { argb: 'FF666666' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Control_Salida_${warehouseName.replace(/\s+/g, '_')}.xlsx`);
};

/**
 * Genera un Acta de Cargo profesional en Excel
 */
export const generateCargoActaExcel = async (data: any) => {
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Acta de Cargo');

    worksheet.pageSetup.paperSize = 9; // A4
    worksheet.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0, footer: 0 };

    worksheet.columns = [
        { width: 15 }, // A
        { width: 20 }, // B
        { width: 20 }, // C
        { width: 15 }, // D
        { width: 15 }, // E
        { width: 20 }, // F
    ];

    // Encabezado
    worksheet.mergeCells('A1:B3');
    try {
        const logoBuffer = await fetchImage(LOGO_URL);
        const imageId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });
        worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            br: { col: 2, row: 3 },
            editAs: 'oneCell'
        } as any);
    } catch (e) {
        worksheet.getCell('A1').value = 'ENEL';
        worksheet.getCell('A1').font = { size: 20, bold: true, color: { argb: 'FF005EB8' } };
    }

    worksheet.mergeCells('C1:F2');
    const titleCell = worksheet.getCell('C1');
    titleCell.value = 'ACTA DE CARGO Y ASIGNACIÓN DE EQUIPO';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('C3:F3');
    const dateCell = worksheet.getCell('C3');
    dateCell.value = `Generado el ${today} | Sistema de Gestión de Activos Enel`;
    dateCell.font = { size: 9, italic: true, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'right' };

    // Línea divisoria
    worksheet.getRow(4).height = 10;
    for (let i = 1; i <= 6; i++) {
        worksheet.getCell(4, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005EB8' } };
    }

    // --- SECCIÓN 1: DATOS GENERALES ---
    worksheet.mergeCells('A6:F6');
    const sec1 = worksheet.getCell('A6');
    sec1.value = '1. IDENTIFICACIÓN DEL RESPONSABLE';
    sec1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

    const addRow = (rowNum: number, label: string, value: any) => {
        worksheet.getCell(`A${rowNum}`).value = label;
        worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 };
        worksheet.getCell(`A${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        worksheet.mergeCells(`B${rowNum}:F${rowNum}`);
        worksheet.getCell(`B${rowNum}`).value = value || '-';
        worksheet.getCell(`B${rowNum}`).alignment = { horizontal: 'left', indent: 1 };
        worksheet.getRow(rowNum).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    };

    addRow(7, 'RESPONSABLE:', data.responsable);
    addRow(8, 'CARGO / ROL:', data.cargo);
    addRow(9, 'FECHA ENTREGA:', data.fecha || today);

    // --- SECCIÓN 2: DETALLES DEL EQUIPO ---
    worksheet.mergeCells('A11:F11');
    const sec2 = worksheet.getCell('A11');
    sec2.value = '2. DESCRIPCIÓN DEL RECURSO ASIGNADO';
    sec2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

    addRow(12, 'EQUIPO:', data.equipo);
    addRow(13, 'MARCA / MODELO:', `${data.marca || '-'} / ${data.modelo || '-'}`);
    addRow(14, 'CAT. / PATENTE:', data.patente || data.serie || '-');

    // --- SECCIÓN 3: OBSERVACIONES ---
    worksheet.mergeCells('A16:F16');
    const sec3 = worksheet.getCell('A16');
    sec3.value = '3. ESTADO Y OBSERVACIONES DE ENTREGA';
    sec3.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sec3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

    worksheet.mergeCells('A17:F20');
    const obsCell = worksheet.getCell('A17');
    obsCell.value = data.observaciones || 'Se hace entrega del equipo en condiciones operativas estándar.';
    obsCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
    obsCell.font = { italic: true };
    obsCell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    // --- SECCIÓN 4: COMPROMISO ---
    worksheet.mergeCells('A22:F24');
    const declCell = worksheet.getCell('A22');
    declCell.value = "Declaro recibir conforme el equipo arriba detallado, comprometiéndome a su cuidado, uso exclusivo para fines laborales y cumplimiento de las normativas de seguridad de la empresa. En caso de pérdida o daño por negligencia, acepto las responsabilidades administrativas correspondientes.";
    declCell.font = { size: 9, color: { argb: 'FF666666' } };
    declCell.alignment = { wrapText: true, vertical: 'middle' };

    // Firmas
    worksheet.mergeCells('A28:C28');
    worksheet.getCell('A28').border = { bottom: { style: 'medium' } };
    worksheet.mergeCells('A29:C29');
    worksheet.getCell('A29').value = 'FIRMA DEL RESPONSABLE (RECEPTOR)';
    worksheet.getCell('A29').font = { size: 8, bold: true };
    worksheet.getCell('A29').alignment = { horizontal: 'center' };

    worksheet.mergeCells('E28:F28');
    worksheet.getCell('E28').border = { bottom: { style: 'medium' } };
    worksheet.mergeCells('E29:F29');
    worksheet.getCell('E29').value = 'FIRMA SUPERVISOR (ENTREGA)';
    worksheet.getCell('E29').font = { size: 8, bold: true };
    worksheet.getCell('E29').alignment = { horizontal: 'center' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Acta_Cargo_${data.responsable.replace(/\s+/g, '_')}_${data.activoId || 'GEN'}.xlsx`);
};

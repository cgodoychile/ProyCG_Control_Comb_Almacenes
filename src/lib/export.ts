import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Export to PDF
export const exportToPDF = (
    data: any[],
    columns: { header: string; dataKey: string }[],
    title: string,
    filename: string
) => {
    const doc = new jsPDF();

    // Try to add Enel logo
    try {
        const logo = new Image();
        logo.src = '/enel-logo.png';

        // Add logo (if loaded successfully)
        logo.onload = () => {
            try {
                doc.addImage(logo, 'PNG', 14, 10, 30, 15);
            } catch (e) {
                console.warn('Could not add logo to PDF:', e);
            }
        };
    } catch (e) {
        console.warn('Could not load logo:', e);
    }

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(title, 50, 20);

    // Add date and subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, 50, 26);

    // Add separator line
    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    // Add table
    autoTable(doc, {
        startY: 35,
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => row[col.dataKey] || '')),
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [41, 128, 185], // Enel Blue
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        margin: { top: 35 },
    });

    // Save
    doc.save(`${filename}.pdf`);
};

// Export to Excel
export const exportToExcel = (
    data: any[],
    sheetName: string,
    filename: string
) => {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Save file
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `${filename}.xlsx`);
};

// Format data for export
export const formatDataForExport = (data: any[], fields: string[]) => {
    return data.map(item => {
        const formatted: any = {};
        fields.forEach(field => {
            formatted[field] = item[field] || '';
        });
        return formatted;
    });
};

// Generate consumption report
export const generateConsumoReport = (consumos: any[]) => {
    const columns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Conductor', dataKey: 'empresa' },
        { header: 'Vehículo', dataKey: 'vehiculo' },
        { header: 'Estanque', dataKey: 'estanque' },
        { header: 'Litros', dataKey: 'litrosUsados' },
        { header: 'Kilometraje', dataKey: 'kilometraje' },
        { header: 'Rendimiento', dataKey: 'rendimiento' },
    ];

    const formattedData = consumos.map(c => {
        let fechaFormateada = '';
        try {
            if (c.fecha) {
                const fecha = typeof c.fecha === 'string' ? new Date(c.fecha) : c.fecha;
                if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                    fechaFormateada = fecha.toLocaleDateString('es-ES');
                } else {
                    fechaFormateada = String(c.fecha);
                }
            }
        } catch {
            fechaFormateada = String(c.fecha || '');
        }

        const rendimientoNum = typeof c.rendimiento === 'number' ? c.rendimiento : parseFloat(c.rendimiento) || 0;

        return {
            ...c,
            fecha: fechaFormateada,
            rendimiento: rendimientoNum > 0 ? `${rendimientoNum.toFixed(1)} km/L` : '',
        };
    });

    return { columns, data: formattedData };
};

// Generate tanks report
export const generateEstanquesReport = (estanques: any[]) => {
    const columns = [
        { header: 'Nombre', dataKey: 'nombre' },
        { header: 'Ubicación', dataKey: 'ubicacion' },
        { header: 'Capacidad', dataKey: 'capacidadTotal' },
        { header: 'Stock Actual', dataKey: 'stockActual' },
        { header: 'Porcentaje', dataKey: 'porcentaje' },
        { header: 'Estado', dataKey: 'estado' },
    ];

    const formattedData = estanques.map(e => ({
        ...e,
        capacidadTotal: `${e.capacidadTotal} L`,
        stockActual: `${e.stockActual} L`,
        porcentaje: e.porcentaje || `${Math.round((e.stockActual / e.capacidadTotal) * 100)}%`,
    }));

    return { columns, data: formattedData };
};

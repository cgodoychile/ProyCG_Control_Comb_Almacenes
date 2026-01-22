import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDF = (title: string, data: any[], columns: string[]) => {
    const doc = new jsPDF();

    // Add Enel logo
    const logo = new Image();
    logo.src = '/enel-logo.png';
    doc.addImage(logo, 'PNG', 14, 10, 40, 15);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 60, 20);

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 60, 27);

    // Table
    autoTable(doc, {
        startY: 35,
        head: [columns],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [0, 176, 80] },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`${title}_${Date.now()}.pdf`);
};

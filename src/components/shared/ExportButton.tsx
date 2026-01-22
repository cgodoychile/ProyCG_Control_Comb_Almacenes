import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/lib/export';

interface ExportButtonProps {
    data: any[];
    columns?: { header: string; dataKey: string }[];
    filename: string;
    title?: string;
    sheetName?: string;
}

export function ExportButton({
    data,
    columns,
    filename,
    title = 'Reporte',
    sheetName = 'Datos',
}: ExportButtonProps) {
    const handleExportPDF = () => {
        if (!columns) {
            console.error('Columns are required for PDF export');
            return;
        }
        exportToPDF(data, columns, title, filename);
    };

    const handleExportExcel = () => {
        exportToExcel(data, sheetName, filename);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF} disabled={!columns}>
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar a PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar a Excel
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

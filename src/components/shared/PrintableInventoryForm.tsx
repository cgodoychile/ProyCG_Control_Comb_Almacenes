import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import enelLogo from '@/assets/enel-logo.png';

interface PrintableInventoryFormProps {
    warehouseName?: string;
}

export const PrintableInventoryForm: React.FC<PrintableInventoryFormProps> = ({ warehouseName }) => {
    const rows = Array.from({ length: 30 });
    const today = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });

    return (
        <div className="inventory-form-container bg-white text-black p-8 font-sans">
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          
          * {
            visibility: hidden;
          }
          
          .inventory-form-container,
          .inventory-form-container * {
            visibility: visible;
          }
          
          .inventory-form-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5cm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }
        
        .inventory-form-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          table-layout: fixed;
        }
        
        .inventory-form-table th, 
        .inventory-form-table td {
          border: 1px solid #333;
          padding: 8px 4px;
          text-align: center;
          font-size: 10px;
          word-wrap: break-word;
        }
        
        .inventory-form-table th {
          background-color: #f3f4f6 !important;
          font-weight: bold;
          text-transform: uppercase;
          color: #111;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
      `}} />

            {/* Header */}
            <div className="header-section">
                <div className="flex items-center gap-4">
                    <img src={enelLogo} alt="Enel" className="h-16 object-contain" />
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold uppercase">FORMULARIO DE INVENTARIO FÍSICO</h2>
                    <p className="text-xs text-gray-500">Documento de Verificación en Terreno | Generado: {today}</p>
                </div>
            </div>

            {/* Info Boxes */}
            <div className="mt-4 mb-2 grid grid-cols-3 gap-4">
                <div className="border border-gray-300 p-2 rounded bg-gray-50 col-span-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">ALMACÉN / BODEGA:</p>
                    <div className="text-sm font-bold text-blue-900 mt-1 uppercase">
                        {warehouseName ? warehouseName : "________________________________________________"}
                    </div>
                </div>
                <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">RESPONSABLE:</p>
                    <div className="h-4 border-b border-dotted border-gray-400 mt-1"></div>
                </div>
            </div>

            {/* Table */}
            <table className="inventory-form-table">
                <thead>
                    <tr>
                        <th style={{ width: '4%' }}>N°</th>
                        <th style={{ width: '20%' }}>Artículo / Descripción</th>
                        <th style={{ width: '12%' }}>Categoría</th>
                        <th style={{ width: '8%' }}>Unidad</th>
                        <th style={{ width: '10%' }}>Cant. Sistema</th>
                        <th style={{ width: '10%' }}>Cant. Física</th>
                        <th style={{ width: '10%' }}>Diferencia</th>
                        <th style={{ width: '12%' }}>Estado / Condición</th>
                        <th style={{ width: '14%' }}>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((_, i) => (
                        <tr key={i}>
                            <td className="h-8 font-mono text-xs">{i + 1}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Info */}
            <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[9px] text-gray-500 italic">
                    <p>* Completar "Cant. Física" con el conteo real en terreno. Indicar diferencias y estado de cada artículo.</p>
                    <p>Página 1 de 1</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-300">
                    <div>
                        <p className="text-[10px] font-bold text-gray-700 mb-2">FIRMA RESPONSABLE INVENTARIO:</p>
                        <div className="h-12 border-b border-gray-400"></div>
                        <p className="text-[8px] text-gray-500 mt-1">Nombre y Firma</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-700 mb-2">FIRMA SUPERVISOR / VALIDACIÓN:</p>
                        <div className="h-12 border-b border-gray-400"></div>
                        <p className="text-[8px] text-gray-500 mt-1">Nombre y Firma</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

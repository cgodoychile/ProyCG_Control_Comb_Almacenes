import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import enelLogo from '@/assets/enel-logo.png';

interface PrintableManualFormProps {
  tankName?: string;
}

export const PrintableManualForm: React.FC<PrintableManualFormProps> = ({ tankName }) => {
  const rows = Array.from({ length: 25 });
  const today = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="manual-form-container bg-white text-black p-8 font-sans">
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
          
          .manual-form-container,
          .manual-form-container * {
            visibility: visible;
          }
          
          .manual-form-container {
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
        
        .manual-form-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          table-layout: fixed;
        }
        
        .manual-form-table th, 
        .manual-form-table td {
          border: 1px solid #333;
          padding: 8px 4px;
          text-align: center;
          font-size: 10px;
          word-wrap: break-word;
        }
        
        .manual-form-table th {
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

        .logo-placeholder {
          width: 40px;
          height: 40px;
          background-color: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
        }
      `}} />

      {/* Header */}
      <div className="header-section">
        <div className="flex items-center gap-4">
          <img src={enelLogo} alt="Enel" className="h-16 object-contain" />
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold uppercase">FORMULARIO DE REGISTRO MANUAL</h2>
          <p className="text-xs text-gray-500">Documento de Respaldo Terreno | Generado: {today}</p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="mt-4 mb-2">
        <div className="border border-gray-300 p-2 rounded bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 uppercase">ESTACIÓN / ESTANQUE SELECCIONADO:</p>
          <div className="text-sm font-bold text-blue-900 mt-1 uppercase">
            {tankName ? tankName : "________________________________________________"}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="manual-form-table">
        <thead>
          <tr>
            <th style={{ width: '10%' }}>Fecha/Hora</th>
            <th style={{ width: '18%' }}>Conductor / Empresa</th>
            <th style={{ width: '12%' }}>Vehículo (Patente)</th>
            <th style={{ width: '10%' }}>Litros</th>
            <th style={{ width: '10%' }}>KM Vehículo</th>
            <th style={{ width: '10%' }}>Contador Inicial</th>
            <th style={{ width: '10%' }}>Contador Final</th>
            <th style={{ width: '10%' }}>Firma Recep.</th>
            <th style={{ width: '20%' }}>Justificación ({">"}80L)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, i) => (
            <tr key={i}>
              <td className="h-8"></td>
              <td></td>
              <td className="font-mono"></td>
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
      <div className="mt-4 flex justify-between text-[9px] text-gray-500 italic">
        <p>* Este documento debe ser entregado al finalizar el turno para su digitalización en LogiFuel.</p>
        <p>Página 1 de 1</p>
      </div>
    </div>
  );
};

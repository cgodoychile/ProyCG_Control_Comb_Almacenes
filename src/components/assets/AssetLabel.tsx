import { forwardRef } from 'react';
import { BarcodeGenerator } from '../shared/BarcodeGenerator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import enelLogo from '@/assets/enel-logo.png';
import type { Activo } from '@/types/crm';

interface AssetLabelProps {
    activo: Activo;
    showBoth?: boolean;
}

export const AssetLabel = forwardRef<HTMLDivElement, AssetLabelProps>(
    ({ activo, showBoth = true }, ref) => {
        return (
            <div ref={ref} className="bg-white p-8 print:p-4">
                {/* Page break for multiple labels */}
                <div className="w-[10cm] h-[5cm] border-2 border-gray-300 rounded-lg p-4 mx-auto bg-white shadow-lg print:shadow-none print:border-black">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <img src={enelLogo} alt="Enel" className="h-6 object-contain" />
                        <div className="text-right">
                            <h3 className="font-bold text-sm text-gray-800">ProyCG</h3>
                            <p className="text-[8px] text-gray-500">Control de Gestión</p>
                        </div>
                    </div>

                    {/* Barcode/QR Section */}
                    <div className="flex items-center justify-center mb-2">
                        {showBoth ? (
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <BarcodeGenerator
                                        value={activo.id}
                                        format="CODE128"
                                        width={1.5}
                                        height={35}
                                        displayValue={false}
                                    />
                                </div>
                                <div className="w-16 h-16 flex-shrink-0">
                                    <BarcodeGenerator
                                        value={activo.id}
                                        format="QR"
                                    />
                                </div>
                            </div>
                        ) : (
                            <BarcodeGenerator
                                value={activo.id}
                                format="CODE128"
                                width={2}
                                height={40}
                            />
                        )}
                    </div>

                    {/* Asset Information */}
                    <div className="space-y-0.5">
                        <div className="text-center">
                            <p className="font-bold text-lg text-gray-900">{activo.id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 text-[9px]">
                            <div>
                                <p className="font-semibold text-gray-700 truncate">{activo.nombre}</p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Cat:</span> {activo.categoria}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-600 truncate">
                                    <span className="font-medium">Resp:</span> {activo.responsable || 'N/A'}
                                </p>
                                <p className="text-gray-600 truncate">
                                    <span className="font-medium">Ubic:</span> {activo.ubicacion || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="text-center pt-1 border-t border-gray-200">
                            <p className="text-[8px] text-gray-500">
                                Registrado: {activo.fechaAdquisicion ? format(new Date(activo.fechaAdquisicion), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Print instructions */}
                <div className="mt-4 text-center text-sm text-gray-500 print:hidden">
                    <p>Tamaño recomendado: Etiqueta adhesiva 10cm x 5cm</p>
                    <p className="text-xs mt-1">Ajusta la escala de impresión si es necesario</p>
                </div>
            </div>
        );
    }
);

AssetLabel.displayName = 'AssetLabel';

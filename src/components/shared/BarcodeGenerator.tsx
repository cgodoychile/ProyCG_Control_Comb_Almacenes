import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';

interface BarcodeGeneratorProps {
    value: string;
    format?: 'CODE128' | 'QR' | 'BOTH';
    width?: number;
    height?: number;
    displayValue?: boolean;
}

export function BarcodeGenerator({
    value,
    format = 'CODE128',
    width = 2,
    height = 50,
    displayValue = true
}: BarcodeGeneratorProps) {
    if (format === 'QR') {
        return (
            <div className="flex justify-center">
                <QRCodeSVG
                    value={value}
                    size={128}
                    level="H"
                    includeMargin
                />
            </div>
        );
    }

    if (format === 'BOTH') {
        return (
            <div className="flex flex-col items-center gap-4">
                <Barcode
                    value={value}
                    width={width}
                    height={height}
                    displayValue={displayValue}
                    margin={10}
                />
                <QRCodeSVG
                    value={value}
                    size={100}
                    level="H"
                    includeMargin
                />
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <Barcode
                value={value}
                width={width}
                height={height}
                displayValue={displayValue}
                margin={10}
            />
        </div>
    );
}

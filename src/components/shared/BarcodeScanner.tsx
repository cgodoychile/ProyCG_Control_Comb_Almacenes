import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X, CheckCircle, AlertCircle, Keyboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scannedCode, setScannedCode] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [manualCode, setManualCode] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);

    useEffect(() => {
        if (open && !scannerRef.current && !showManualInput) {
            // Give time for the container to mount
            const timer = setTimeout(() => {
                const element = document.getElementById('qr-reader');
                if (!element) return;

                try {
                    const scanner = new Html5QrcodeScanner(
                        'qr-reader',
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            showTorchButtonIfSupported: true,
                            showZoomSliderIfSupported: true,
                        },
                        false
                    );

                    scanner.render(
                        (decodedText) => {
                            setScannedCode(decodedText);
                            setIsScanning(false);
                            scanner.clear().catch(console.error);
                            onScan(decodedText);
                            setTimeout(() => {
                                onClose();
                            }, 1500);
                        },
                        (errorMessage) => {
                            // Silently handle scanning errors
                            console.debug('Scan error:', errorMessage);
                        }
                    );

                    scannerRef.current = scanner;
                    setIsScanning(true);
                } catch (err: any) {
                    console.error('Scanner initialization error:', err);
                    setError('Error al inicializar escáner: ' + (err.message || String(err)));
                    setShowManualInput(true);
                }
            }, 300);

            return () => clearTimeout(timer);
        }

        return () => {
            if (scannerRef.current && !open) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
                setIsScanning(false);
                setScannedCode('');
                setError('');
            }
        };
    }, [open, onScan, onClose, showManualInput]);

    const handleClose = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
        setIsScanning(false);
        setScannedCode('');
        setError('');
        setShowManualInput(false);
        setManualCode('');
        onClose();
    };

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            onScan(manualCode.trim());
            handleClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Escanear Código
                    </DialogTitle>
                    <DialogDescription>
                        Apunta la cámara hacia el código de barras o QR del activo/producto
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-destructive">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Scanner Container */}
                    {!showManualInput && (
                        <div id="qr-reader" className="w-full rounded-lg overflow-hidden border border-border" />
                    )}

                    {/* Manual Input */}
                    {showManualInput && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Keyboard className="w-4 h-4" />
                                <span>Ingreso manual de código</span>
                            </div>
                            <Input
                                placeholder="Ej: ACT-GEN-001"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleManualSubmit();
                                    }
                                }}
                                autoFocus
                            />
                            <Button
                                onClick={handleManualSubmit}
                                className="w-full"
                                disabled={!manualCode.trim()}
                            >
                                Buscar
                            </Button>
                        </div>
                    )}

                    {/* Scanned Result */}
                    {scannedCode && (
                        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-success" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-success">¡Código escaneado!</p>
                                <p className="text-xs text-muted-foreground font-mono">{scannedCode}</p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    {isScanning && !scannedCode && !error && (
                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Mantén el código dentro del recuadro
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                <span>Escaneando...</span>
                            </div>
                        </div>
                    )}

                    {/* Toggle Manual Input Button */}
                    {!showManualInput && !error && (
                        <Button
                            variant="outline"
                            onClick={() => setShowManualInput(true)}
                            className="w-full"
                        >
                            <Keyboard className="w-4 h-4 mr-2" />
                            Ingresar código manualmente
                        </Button>
                    )}

                    {/* Close Button */}
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="w-full"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

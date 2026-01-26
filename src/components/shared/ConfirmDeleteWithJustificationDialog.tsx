import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ConfirmDeleteWithJustificationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (justification: string, checkboxesState?: Record<string, boolean>) => void;
    isLoading?: boolean;
    title?: string;
    description?: string;
    itemName?: string;
    isAdmin?: boolean;
    isCritical?: boolean;
    checkboxes?: {
        id: string;
        label: string;
        defaultValue?: boolean;
    }[];
}

export function ConfirmDeleteWithJustificationDialog({
    open,
    onClose,
    onConfirm,
    isLoading = false,
    title,
    description,
    itemName,
    isAdmin = true,
    isCritical = false,
    checkboxes = []
}: ConfirmDeleteWithJustificationDialogProps) {
    const isRequestMode = isCritical && !isAdmin;

    const displayTitle = title || (isRequestMode ? "¿Solicitar Eliminación?" : "¿Eliminar registro?");
    const displayDescription = description || (isRequestMode
        ? "Esta entidad es crítica. Un administrador debe aprobar esta eliminación. Su solicitud será enviada con la justificación proporcionada."
        : "Esta acción es irreversible. Por favor, proporcione una justificación para esta eliminación.");
    const [justification, setJustification] = useState('');
    const [checkboxesState, setCheckboxesState] = useState<Record<string, boolean>>(
        checkboxes.reduce((acc, cb) => ({ ...acc, [cb.id]: cb.defaultValue ?? false }), {})
    );

    const handleConfirm = () => {
        if (!justification.trim()) return;
        onConfirm(justification.trim(), checkboxesState);
        setJustification('');
    };

    const toggleCheckbox = (id: string) => {
        setCheckboxesState(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        {displayTitle}
                    </DialogTitle>
                    <DialogDescription>
                        {displayDescription}
                        {itemName && (
                            <span className="block mt-2 font-bold text-foreground">
                                Item: {itemName}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Motivo de la eliminación <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                        placeholder="Escriba la causa de la eliminación aquí..."
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        className="min-h-[100px]"
                    />

                    {checkboxes.length > 0 && (
                        <div className="space-y-3 pt-2">
                            {checkboxes.map((cb) => (
                                <div key={cb.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={cb.id}
                                        checked={checkboxesState[cb.id]}
                                        onCheckedChange={() => toggleCheckbox(cb.id)}
                                    />
                                    <label
                                        htmlFor={cb.id}
                                        className="text-sm font-medium leading-none cursor-pointer"
                                    >
                                        {cb.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!justification.trim() || isLoading}
                        className="gap-2"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isRequestMode ? "Enviar Solicitud" : "Confirmar Eliminación"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

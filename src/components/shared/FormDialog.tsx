import { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    isLoading?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
}

export function FormDialog({
    open,
    onClose,
    onSubmit,
    title,
    description,
    children,
    isLoading = false,
    submitLabel = 'Guardar',
    cancelLabel = 'Cancelar',
}: FormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="py-4">
                    {children}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="submit"
                        onClick={onSubmit}
                        disabled={isLoading}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

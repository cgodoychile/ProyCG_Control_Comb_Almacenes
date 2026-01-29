import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productosAlmacenApi, almacenesApi } from '@/lib/apiService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Package, Warehouse, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalProductSearchDialogProps {
    open: boolean;
    onClose: () => void;
}

export function GlobalProductSearchDialog({ open, onClose }: GlobalProductSearchDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all products across all warehouses
    const { data: productos, isLoading } = useQuery({
        queryKey: ['productos-global'],
        queryFn: productosAlmacenApi.getAll,
        enabled: open
    });

    // Fetch all warehouses to resolve names
    const { data: almacenes } = useQuery({
        queryKey: ['almacenes'],
        queryFn: almacenesApi.getAll,
        enabled: open
    });

    const productosData = productos?.data || [];

    const filtered = productosData.filter((p: any) =>
        (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''));

    const getAlmacenName = (id: string) => {
        return almacenes?.data?.find(a => a.id === id)?.nombre || id;
    };

    // Calculate totals
    const totalByProduct = filtered.reduce((acc: any, p) => {
        if (!acc[p.nombre]) {
            acc[p.nombre] = {
                nombre: p.nombre,
                categoria: p.categoria,
                total: 0,
                ubicaciones: []
            };
        }
        acc[p.nombre].total += (Number(p.cantidad) || 0);
        acc[p.nombre].ubicaciones.push({
            almacen: getAlmacenName(p.almacenId),
            cantidad: p.cantidad,
            unidad: p.unidad
        });
        return acc;
    }, {});

    const productGroups = Object.values(totalByProduct);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
                <DialogHeader className="p-6 pb-2 border-b border-border/50">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Search className="w-5 h-5 text-accent" />
                        Búsqueda Global de Inventario
                    </DialogTitle>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar producto en todas las bodegas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-secondary/30 h-11"
                            autoFocus
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                            <p>Consultando todas las bodegas...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground italic text-sm">
                            No se encontraron productos con ese nombre.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {productGroups.map((group: any, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Package className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{group.nombre}</h4>
                                                <span className="text-xs text-muted-foreground uppercase">{group.categoria}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-accent">{group.total}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">STOCK TOTAL DISPONIBLE</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {group.ubicaciones.map((loc: any, lIdx: number) => (
                                            <div key={lIdx} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl border border-border/30">
                                                <div className="flex items-center gap-2">
                                                    <Warehouse className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{loc.almacen}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "font-bold",
                                                        loc.cantidad > 0 ? "text-foreground" : "text-destructive"
                                                    )}>
                                                        {loc.cantidad} {loc.unidad}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DateRangeFilterProps {
    onFilterChange: (desde: string, hasta: string) => void;
}

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const handleApplyFilter = () => {
        onFilterChange(desde, hasta);
    };

    const handleClearFilter = () => {
        setDesde('');
        setHasta('');
        onFilterChange('', '');
    };

    return (
        <div className="flex items-end gap-3">
            <div className="flex-1">
                <Label htmlFor="fechaDesde" className="text-sm font-medium">
                    Desde
                </Label>
                <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="fechaDesde"
                        type="date"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex-1">
                <Label htmlFor="fechaHasta" className="text-sm font-medium">
                    Hasta
                </Label>
                <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        id="fechaHasta"
                        type="date"
                        value={hasta}
                        onChange={(e) => setHasta(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={handleApplyFilter} size="sm">
                    Aplicar
                </Button>
                <Button onClick={handleClearFilter} variant="outline" size="sm">
                    Limpiar
                </Button>
            </div>
        </div>
    );
}

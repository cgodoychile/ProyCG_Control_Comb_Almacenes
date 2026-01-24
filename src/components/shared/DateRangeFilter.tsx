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
        <div className="flex flex-col sm:flex-row items-end gap-2 w-full lg:col-span-1">
            <div className="flex-1 w-full">
                <Label htmlFor="fechaDesde" className="text-[10px] font-bold uppercase text-muted-foreground">
                    Desde
                </Label>
                <div className="relative mt-1">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        id="fechaDesde"
                        type="date"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                        className="pl-8 h-10 text-xs"
                    />
                </div>
            </div>

            <div className="flex-1 w-full">
                <Label htmlFor="fechaHasta" className="text-[10px] font-bold uppercase text-muted-foreground">
                    Hasta
                </Label>
                <div className="relative mt-1">
                    <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        id="fechaHasta"
                        type="date"
                        value={hasta}
                        onChange={(e) => setHasta(e.target.value)}
                        className="pl-8 h-10 text-xs"
                    />
                </div>
            </div>

            <div className="flex gap-1 w-full sm:w-auto">
                <Button onClick={handleApplyFilter} size="sm" className="flex-1 sm:flex-none h-10 px-3 text-xs">
                    Aplicar
                </Button>
                <Button onClick={handleClearFilter} variant="outline" size="sm" className="flex-1 sm:flex-none h-10 px-3 text-xs">
                    Limpiar
                </Button>
            </div>
        </div>
    );
}

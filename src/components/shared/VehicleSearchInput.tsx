import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Vehicle {
    id: string;
    patente?: string;
    marca?: string;
    modelo?: string;
    nombre?: string;
    estado?: string;
}

interface VehicleSearchInputProps {
    vehicles: Vehicle[];
    value: string;
    onChange: (value: string) => void;
    onManualEntry: () => void;
    isManualMode: boolean;
    placeholder?: string;
    className?: string;
}

export function VehicleSearchInput({
    vehicles,
    value,
    onChange,
    onManualEntry,
    isManualMode,
    placeholder = "Buscar por patente...",
    className
}: VehicleSearchInputProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter vehicles by search term
    const filteredVehicles = vehicles
        .filter(v => v.estado === 'operativo')
        .filter(v => {
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            const patente = (v.patente || '').toLowerCase();
            const marca = (v.marca || '').toLowerCase();
            const modelo = (v.modelo || '').toLowerCase();
            return patente.includes(search) || marca.includes(search) || modelo.includes(search);
        })
        .sort((a, b) => (a.patente || '').localeCompare(b.patente || ''));

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredVehicles.length ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex === 0) {
                    // Manual entry option
                    handleManualEntryClick();
                } else if (highlightedIndex <= filteredVehicles.length) {
                    const selected = filteredVehicles[highlightedIndex - 1];
                    handleSelect(selected);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (vehicle: Vehicle) => {
        onChange(vehicle.patente || vehicle.nombre || vehicle.id);
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(0);
    };

    const handleManualEntryClick = () => {
        onManualEntry();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(0);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setIsOpen(true);
        setHighlightedIndex(0);

        // If in manual mode, update the value directly
        if (isManualMode) {
            onChange(newValue);
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    // Highlight matching text
    const highlightMatch = (text: string, search: string) => {
        if (!search) return text;
        const parts = text.split(new RegExp(`(${search})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === search.toLowerCase()
                ? <mark key={i} className="bg-accent/30 text-accent-foreground font-bold">{part}</mark>
                : part
        );
    };

    // Get display value
    const selectedVehicle = !isManualMode && value && !searchTerm ? vehicles.find(v => v.patente === value || v.id === value) : null;

    return (
        <div ref={wrapperRef} className={cn("relative", className)}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={isManualMode ? value : searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={isManualMode ? "Ingrese patente manualmente..." : placeholder}
                    className={cn(
                        "pl-9",
                        isManualMode && "border-accent bg-accent/5"
                    )}
                />
                {selectedVehicle && !searchTerm && (
                    <div className="absolute left-9 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-muted-foreground">
                        <span className="font-mono font-bold text-foreground">{selectedVehicle.patente}</span>
                        {selectedVehicle.marca && (
                            <span className="ml-2">
                                - {selectedVehicle.marca} {selectedVehicle.modelo || ''}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                    {/* Manual Entry Option */}
                    <button
                        type="button"
                        onClick={handleManualEntryClick}
                        className={cn(
                            "w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors border-b border-border flex items-center gap-2",
                            highlightedIndex === 0 && "bg-accent/20"
                        )}
                        onMouseEnter={() => setHighlightedIndex(0)}
                    >
                        <Edit3 className="w-4 h-4 text-accent" />
                        <div>
                            <div className="font-bold text-accent">✏️ Ingreso Manual</div>
                            <div className="text-xs text-muted-foreground">Escribir patente manualmente</div>
                        </div>
                    </button>

                    {/* Vehicle List */}
                    {filteredVehicles.length === 0 ? (
                        <div className="px-4 py-8 text-center text-muted-foreground text-sm italic">
                            No se encontraron vehículos operativos
                        </div>
                    ) : (
                        filteredVehicles.map((vehicle, index) => (
                            <button
                                key={vehicle.id}
                                type="button"
                                onClick={() => handleSelect(vehicle)}
                                className={cn(
                                    "w-full px-4 py-2.5 text-left hover:bg-accent/10 transition-colors flex items-center justify-between",
                                    highlightedIndex === index + 1 && "bg-accent/20",
                                    index < filteredVehicles.length - 1 && "border-b border-border/50"
                                )}
                                onMouseEnter={() => setHighlightedIndex(index + 1)}
                            >
                                <div className="flex-1">
                                    <div className="font-mono font-bold text-foreground">
                                        {highlightMatch(vehicle.patente || vehicle.id, searchTerm)}
                                    </div>
                                    {vehicle.marca && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {highlightMatch(`${vehicle.marca} ${vehicle.modelo || ''}`, searchTerm)}
                                        </div>
                                    )}
                                </div>
                                {vehicle.estado && (
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        vehicle.estado === 'operativo'
                                            ? "bg-success/10 text-success"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {vehicle.estado}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

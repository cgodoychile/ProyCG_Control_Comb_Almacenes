import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estanquesApi, vehiculosApi, consumosApi, cargasApi, agendamientosApi, alertasApi } from '@/lib/apiService';
import { format, isBefore, addDays, subDays } from 'date-fns';
import { useAlertsContext } from '@/context/AlertsContext';

export interface Alerta {
    id: string;
    titulo: string;
    mensaje: string;
    tipo: 'critical' | 'warning' | 'info' | 'success';
    fecha: string;
    origen: string;
    accion?: string;
    action?: string;
    data?: any;
}

export function useAlerts() {
    const { dismissedIds, handleDismiss, handleDismissAll: contextHandleDismissAll, handleClearDismissed } = useAlertsContext();
    const today = new Date();

    // Fetch Data
    const { data: estanquesData, isLoading: loadingEstanques } = useQuery({
        queryKey: ['estanques'],
        queryFn: estanquesApi.getAll,
        refetchInterval: 60000 // Refresh every minute
    });

    const { data: vehiculosData, isLoading: loadingVehiculos } = useQuery({
        queryKey: ['vehiculos'],
        queryFn: vehiculosApi.getAll,
        refetchInterval: 60000
    });

    const { data: consumosResponse, isLoading: loadingConsumos } = useQuery({
        queryKey: ['consumos'],
        queryFn: consumosApi.getAll,
        refetchInterval: 60000
    });

    const { data: cargasResponse, isLoading: loadingCargas } = useQuery({
        queryKey: ['cargas'],
        queryFn: cargasApi.getAll,
        refetchInterval: 60000
    });

    const { data: agendamientosResponse } = useQuery({
        queryKey: ['agendamientos'],
        queryFn: agendamientosApi.getAll,
        refetchInterval: 60000
    });

    // Fetch Activity Alerts from Backend
    const { data: activityAlertsResponse, isLoading: loadingActivityAlerts } = useQuery({
        queryKey: ['activity-alerts'],
        queryFn: alertasApi.getAll,
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Calculate Alerts
    const alerts = useMemo(() => {
        const generatedAlerts: Alerta[] = [];
        const formattedToday = format(today, 'yyyy-MM-dd');
        const fortyEightHoursAgo = subDays(today, 2);

        // 0. Activity Alerts from Backend (CRUD operations)
        const activityAlerts = activityAlertsResponse?.data || [];
        activityAlerts.forEach(a => {
            // Format the date for display
            let displayDate = formattedToday;
            try {
                if (a.fecha) {
                    const parsedDate = new Date(a.fecha);
                    if (!isNaN(parsedDate.getTime())) {
                        displayDate = format(parsedDate, 'dd/MM/yyyy HH:mm');
                    }
                }
            } catch (e) {
                // Keep default date if parsing fails
            }

            const accion = (a as any).accion || (a as any).accionRealizada || 'Actividad';
            let mensaje = a.mensaje;
            let metadata = null;

            // Try to parse JSON message for special actions
            if (mensaje) {
                let jsonToParse = mensaje;
                // If message has a tail (like " ||| Something"), strip it for JSON parsing
                if (mensaje.includes(' ||| ')) {
                    jsonToParse = mensaje.split(' ||| ')[0];
                }

                if (jsonToParse.trim().startsWith('{')) {
                    try {
                        // REINFORCE: Only try to parse if it looks like complete JSON
                        const lastBrace = jsonToParse.lastIndexOf('}');
                        const potentialJson = jsonToParse.substring(0, lastBrace + 1);

                        const parsed = JSON.parse(potentialJson);
                        metadata = parsed;
                        if (parsed.name) {
                            const entityMap: any = { 'activos': 'Activo', 'vehiculos': 'Vehículo', 'consumos': 'Consumo', 'estanques': 'Estanque', 'almacenes': 'Bodega' };
                            const friendlyEntity = entityMap[parsed.entity?.toLowerCase()] || parsed.entity || '';
                            mensaje = `Solicitud para eliminar ${friendlyEntity}: ${parsed.name}${parsed.justification ? ` - Motivo: ${parsed.justification}` : ''}`;
                        } else if (parsed.mensaje) {
                            mensaje = parsed.mensaje;
                        }
                    } catch (e) {
                        // If parsing fails, use the message parts without technical separators
                        mensaje = mensaje.replace(' ||| ', ' - ').replace('###', ' - ');
                        console.warn('Alert parsing fallback active for:', a.id);
                    }
                }
            }

            generatedAlerts.push({
                id: a.id,
                titulo: (accion === 'solicitud_eliminacion' || accion === 'solicitud') ? '🔒 Solicitud de Eliminación' : `${accion.charAt(0).toUpperCase() + accion.slice(1)} en ${a.modulo}`,
                mensaje: mensaje,
                tipo: (accion === 'solicitud_eliminacion' || accion === 'solicitud') ? 'critical' : (a.tipo || 'info'),
                fecha: displayDate,
                origen: a.modulo || 'Sistema',
                accion: accion,
                data: metadata
            });
        });

        // 1. Estanques Logic
        const estanques = estanquesData?.data || [];
        estanques.forEach(e => {
            const stock = e.stockActual || 0;
            const cap = e.capacidadTotal || 1;
            const pct = stock / cap;

            if (pct < 0.15) { // < 15% Critical
                generatedAlerts.push({
                    id: `stk-crit-${e.id}`,
                    titulo: `Nivel Crítico de Combustible`,
                    mensaje: `El estanque ${e.nombre} está al ${(pct * 100).toFixed(0)}% de su capacidad (${stock.toLocaleString()} L).`,
                    tipo: 'critical',
                    fecha: formattedToday,
                    origen: 'Estanques'
                });
            } else if (pct < 0.30) { // < 30% Warning
                generatedAlerts.push({
                    id: `stk-warn-${e.id}`,
                    titulo: `Nivel Bajo de Combustible`,
                    mensaje: `El estanque ${e.nombre} está bajando (${(pct * 100).toFixed(0)}%). Considerar recarga.`,
                    tipo: 'warning',
                    fecha: formattedToday,
                    origen: 'Estanques'
                });
            }
        });

        // 2. Vehiculos Logic
        const vehiculos = vehiculosData?.data || [];
        vehiculos.forEach(v => {
            // Check by Date
            if (v.proximaMantencion) {
                const prox = new Date(v.proximaMantencion);
                if (isBefore(prox, today)) {
                    generatedAlerts.push({
                        id: `mant-overdue-${v.id}`,
                        titulo: `Mantención Vencida`,
                        mensaje: `El vehículo ${v.marca} ${v.modelo} (${v.id}) debía realizar mantención el ${format(prox, 'dd/MM/yyyy')}.`,
                        tipo: 'critical',
                        fecha: formattedToday,
                        origen: 'Vehículos'
                    });
                }
                else if (isBefore(prox, addDays(today, 7))) {
                    generatedAlerts.push({
                        id: `mant-soon-${v.id}`,
                        titulo: `Mantención Próxima`,
                        mensaje: `El vehículo ${v.marca} ${v.modelo} (${v.id}) requiere mantención pronto (${format(prox, 'dd/MM/yyyy')}).`,
                        tipo: 'warning',
                        fecha: formattedToday,
                        origen: 'Vehículos'
                    });
                }
            }

            // Check by Mileage
            if (v.proximaMantencionKm && v.kilometraje) {
                const diff = v.proximaMantencionKm - v.kilometraje;
                if (diff <= 0) {
                    generatedAlerts.push({
                        id: `mant-km-overdue-${v.id}`,
                        titulo: `Mantenimiento por Km Vencido`,
                        mensaje: `El vehículo ${v.id} superó el límite de ${v.proximaMantencionKm.toLocaleString()} km.`,
                        tipo: 'critical',
                        fecha: formattedToday,
                        origen: 'Vehículos'
                    });
                } else if (diff <= 1000) {
                    generatedAlerts.push({
                        id: `mant-km-soon-${v.id}`,
                        titulo: `Mantenimiento por Km Próximo`,
                        mensaje: `El vehículo ${v.id} requiere mantención en ${diff.toLocaleString()} km.`,
                        tipo: 'warning',
                        fecha: formattedToday,
                        origen: 'Vehículos'
                    });
                }
            }
        });

        // 3. Global Activity Notifications (New Records)
        const consumos = consumosResponse?.data || [];
        consumos.forEach(c => {
            // 1. High Consumption Alert (> 80L)
            if (c.litrosUsados > 80) {
                generatedAlerts.push({
                    id: `high-consumo-${c.id}`,
                    titulo: `Alto Consumo Detectado`,
                    mensaje: `El vehículo ${c.vehiculo} registró un consumo elevado de ${c.litrosUsados}L.`,
                    tipo: 'warning',
                    fecha: c.fecha,
                    origen: 'Consumo'
                });
            }

            // 2. New Record Notification (Last 48 hours)
            const fechaRec = new Date(c.fecha);
            if (isBefore(fortyEightHoursAgo, fechaRec)) {
                generatedAlerts.push({
                    id: `new-consumo-${c.id}`,
                    titulo: `Nuevo Registro de Consumo`,
                    mensaje: `${c.responsable} registró ${c.litrosUsados}L para ${c.vehiculo}.`,
                    tipo: 'info',
                    fecha: c.fecha,
                    origen: 'Consumo'
                });
            }
        });

        // 4. Agendamientos Proximity Alert
        const agendamientos = agendamientosResponse?.data || [];
        agendamientos.forEach(c => {
            if (c.fechaProgramada) {
                const prox = new Date(c.fechaProgramada);
                const diffDays = Math.ceil((prox.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 2) {
                    generatedAlerts.push({
                        id: `sched-prox-${c.id}`,
                        titulo: `Carga Programada Próxima`,
                        mensaje: `Se aproxima la carga de ${c.litros}L en ${c.estanque} para el ${format(prox, 'dd/MM/yyyy')}.`,
                        tipo: 'warning',
                        fecha: formattedToday,
                        origen: 'Cargas'
                    });
                }
            }
        });

        // 5. Cargas Records (Last 48 hours)
        const cargas = cargasResponse?.data || [];
        cargas.forEach(c => {
            const fechaRec = new Date(c.fecha);
            if (isBefore(fortyEightHoursAgo, fechaRec)) {
                generatedAlerts.push({
                    id: `new-carga-${c.id}`,
                    titulo: `Nuevo Registro de Carga`,
                    mensaje: `${c.responsable} cargó ${c.litros.toLocaleString()}L en ${c.estanque}.`,
                    tipo: 'info',
                    fecha: c.fecha,
                    origen: 'Cargas'
                });
            }
        });

        // Sort by date (newest first)
        return generatedAlerts.sort((a, b) => {
            const dateA = new Date(a.fecha).getTime();
            const dateB = new Date(b.fecha).getTime();
            return dateB - dateA;
        });
    }, [estanquesData, vehiculosData, consumosResponse, cargasResponse, agendamientosResponse, activityAlertsResponse]);

    const activeAlerts = useMemo(() => {
        return alerts.filter(a => !dismissedIds.includes(a.id));
    }, [alerts, dismissedIds]);

    const handleDismissAll = () => {
        const allIds = activeAlerts.map(a => a.id);
        contextHandleDismissAll(allIds);
    };

    return {
        alerts,
        activeAlerts,
        dismissedIds,
        handleDismiss,
        handleDismissAll,
        handleClearDismissed,
        isLoading: loadingEstanques || loadingVehiculos
    };
}

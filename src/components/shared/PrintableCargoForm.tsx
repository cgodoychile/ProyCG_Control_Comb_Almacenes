import React, { forwardRef } from 'react';
import { FileText, User, Shield, Package, Calendar, MapPin, Zap } from 'lucide-react';

interface PrintableCargoFormProps {
    data: {
        titulo?: string;
        empresa?: string;
        fecha: string;
        responsable: string;
        cargo?: string;
        equipo: string;
        marca?: string;
        modelo?: string;
        serie?: string;
        patente?: string;
        documentoId?: string;
        observaciones?: string;
    };
}

export const PrintableCargoForm = forwardRef<HTMLDivElement, PrintableCargoFormProps>(({ data }, ref) => {
    return (
        <div ref={ref} className="p-10 bg-white text-slate-900 min-h-[297mm] font-sans print:p-6 relative overflow-hidden">
            {/* Background elements for corporate feel */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-30" />

            {/* Header / Letterhead */}
            <div className="flex justify-between items-center border-b-4 border-orange-500 pb-6 mb-8 relative z-10">
                <div className="flex items-center gap-6">
                    <img
                        src="/LogoCorpEnel.png"
                        alt="Enel Logo"
                        className="h-16 object-contain"
                    />
                </div>
                <div className="text-right">
                    <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-tight">
                        {data.titulo || 'ACTA DE CARGO Y ASIGNACIÓN'}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Documento Interno de Operaciones</p>
                </div>
            </div>

            {/* Document Traceability */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="col-span-3 bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <span className="text-[9px] font-black text-orange-600 uppercase block tracking-widest mb-1">Entidad Emisora</span>
                        <span className="text-sm font-bold opacity-90 uppercase">Enel Generación Chile S.A.</span>
                    </div>
                    <div className="h-8 w-px bg-slate-300" />
                    <div>
                        <span className="text-[9px] font-black text-orange-600 uppercase block tracking-widest mb-1">Fecha Emisión</span>
                        <span className="text-sm font-bold opacity-90">{data.fecha}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-300" />
                    <div className="text-right">
                        <span className="text-[9px] font-black text-orange-600 uppercase block tracking-widest mb-1">Estado</span>
                        <span className="text-xs font-black text-slate-900">CERTIFICADA</span>
                    </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-center items-center">
                    <span className="text-[9px] font-black text-orange-400 uppercase block tracking-widest mb-1">Folio</span>
                    <span className="text-base font-mono font-black text-slate-900 truncate w-full text-center">
                        {data.documentoId || `AC-${Math.floor(Date.now() / 10000)}`}
                    </span>
                </div>
            </div>

            {/* Legal Clause - More Compact */}
            <div className="mb-10 px-4 border-l-2 border-orange-500">
                <p className="text-base text-slate-700 leading-tight">
                    El receptor declara haber recibido el recurso detallado a continuación en óptimas condiciones. Se asume la **total responsabilidad** por su custodia y uso exclusivo en actividades laborales de **Enel Chile**.
                </p>
            </div>

            {/* Content Sections - Side by Side */}
            <div className="grid grid-cols-2 gap-10 mb-10">
                {/* Column 1: Holder */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <User className="w-5 h-5 text-orange-600" />
                        <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">Identificación del Receptor</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Nombre Completo</label>
                            <p className="text-lg font-black text-slate-900">{data.responsable}</p>
                        </div>
                        <div>
                            <label className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Cargo / Rol</label>
                            <p className="text-sm font-bold text-slate-600">{data.cargo || 'Personal Autorizado'}</p>
                        </div>
                    </div>
                </div>

                {/* Column 2: Equipment */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                        <Package className="w-5 h-5 text-orange-600" />
                        <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">Detalles del Equipo</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Elemento / Recurso</label>
                            <p className="text-lg font-black text-slate-900 uppercase">{data.equipo}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Marca / Modelo</label>
                                <p className="text-xs font-bold text-slate-600">{data.marca || '-'} / {data.modelo || '-'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] uppercase font-black text-slate-400 block mb-0.5">ID / Patente</label>
                                <p className="text-xs font-mono font-black text-orange-600">{data.patente || data.serie || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Condition Box - Compact */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-10 relative">
                <FileText className="absolute top-4 right-6 w-10 h-10 text-slate-100" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Observaciones de Entrega</h4>
                <p className="text-sm text-slate-600 font-medium italic leading-snug">
                    "{data.observaciones || 'Se entrega en perfectas condiciones operativas y estéticas al momento de este acto.'}"
                </p>
            </div>

            {/* Legal Obligations - Fine Print */}
            <div className="grid grid-cols-2 gap-8 mb-12 text-[9px] text-slate-400 font-bold uppercase">
                <div className="flex gap-3">
                    <Shield className="w-6 h-6 text-slate-200 shrink-0" />
                    <p>El daño por negligencia podrá ser sancionado según reglamento interno.</p>
                </div>
                <div className="flex gap-3">
                    <MapPin className="w-6 h-6 text-slate-200 shrink-0" />
                    <p>Traslados fuera de zona autorizada requieren validación previa.</p>
                </div>
            </div>

            {/* Footer / Signatures - Higher Placement */}
            <div className="grid grid-cols-2 gap-32 px-10 mb-10">
                <div className="text-center">
                    <div className="h-0.5 bg-slate-300 w-full mb-3" />
                    <p className="text-xs font-black uppercase text-slate-900">{data.responsable}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Firma del Receptor</p>
                </div>
                <div className="text-center">
                    <div className="h-0.5 bg-slate-300 w-full mb-3" />
                    <p className="text-xs font-black uppercase text-slate-900">Dpto. Control Activos</p>
                    <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest mt-1">Enel Chile</p>
                </div>
            </div>

            {/* System Info Footnote */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[7px] font-black text-slate-300 uppercase tracking-widest">
                <span>GESTIÓN DE ACTIVOS ENEL V4.0</span>
                <span>ORIGINAL - ARCHIVO OPERACIONES</span>
            </div>
        </div>
    );
});

PrintableCargoForm.displayName = 'PrintableCargoForm';

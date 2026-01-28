import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { DashboardModule } from '@/components/modules/DashboardModule';
import { ConsumoModule } from '@/components/modules/ConsumoModule';
import { EstanquesModule } from '@/components/modules/EstanquesModule';
import { CargasModule } from '@/components/modules/CargasModule';
import { ActivosModule } from '@/components/modules/ActivosModule';
import { VehiculosModule } from '@/components/modules/VehiculosModule';
import { UsuariosModule } from '@/components/modules/UsuariosModule';
import { AlertasModule } from '@/components/modules/AlertasModule';
import { ReportesModule } from '@/components/modules/ReportesModule';
import { AlmacenesModule } from '@/components/modules/AlmacenesModule';
import { MantencionesModule } from '@/components/modules/MantencionesModule';
import { PerfilModule } from '@/components/modules/PerfilModule';
import { ConfiguracionModule } from '@/components/modules/ConfiguracionModule';
import { PersonasModule } from '@/components/modules/PersonasModule';
import { AuditoriaModule } from '@/components/modules/AuditoriaModule';
import ActasModule from '@/components/modules/ActasModule';

const moduleConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Vista general del sistema' },
  consumo: { title: 'Consumo de Combustible', subtitle: 'Registro y control de consumo por vehículo' },
  estanques: { title: 'Estanques', subtitle: 'Control de stock y estados' },
  cargas: { title: 'Cargas de Estanques', subtitle: 'Registro de recargas y compras' },
  vehiculos: { title: 'Gestión de Vehículos', subtitle: 'Flota de camionetas y vehículos' },
  activos: { title: 'Inventario de Activos', subtitle: 'Equipos y maquinaria registrados' },
  almacenes: { title: 'Almacenes e Inventario', subtitle: 'Gestión de bodegas e insumos' },
  personas: { title: 'Gestión de Personal', subtitle: 'Listado de personas vinculadas a la operación' },
  usuarios: { title: 'Gestión de Usuarios', subtitle: 'Administración de cuentas y roles' },
  alertas: { title: 'Centro de Alertas', subtitle: 'Notificaciones y avisos del sistema' },
  reportes: { title: 'Reportes e Informes', subtitle: 'Generación y descarga de documentos' },
  mantenciones: { title: 'Control de Mantenciones', subtitle: 'Gestión de reparaciones y servicios' },
  perfil: { title: 'Mi Perfil', subtitle: 'Información personal y configuración de cuenta' },
  configuracion: { title: 'Configuración', subtitle: 'Ajustes y preferencias del sistema' },
  auditoria: { title: 'Auditoría del Sistema', subtitle: 'Registro de acciones y cambios en el sistema' },
  actas: { title: 'Actas de Cargo', subtitle: 'Historial de asignaciones y documentos' },
};

const Index = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'consumo':
        return <ConsumoModule />;
      case 'estanques':
        return <EstanquesModule />;
      case 'cargas':
        return <CargasModule />;
      case 'vehiculos':
        return <VehiculosModule />;
      case 'activos':
        return <ActivosModule />;
      case 'almacenes':
        return <AlmacenesModule globalSearch={globalSearch} />;
      case 'personas':
        return <PersonasModule />;
      case 'usuarios':
        return <UsuariosModule />;
      case 'alertas':
        return <AlertasModule />;
      case 'reportes':
        return <ReportesModule />;
      case 'mantenciones':
        return <MantencionesModule />;
      case 'perfil':
        return <PerfilModule />;
      case 'configuracion':
        return <ConfiguracionModule />;
      case 'auditoria':
        return <AuditoriaModule />;
      case 'actas':
        return <ActasModule />;
      default:
        return <DashboardModule />;
    }
  };

  const config = moduleConfig[activeModule] || moduleConfig.dashboard;

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col md:flex-row">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          title={config.title}
          subtitle={config.subtitle}
          onModuleChange={setActiveModule}
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {renderModule()}
        </main>

        <MobileNav activeModule={activeModule} onModuleChange={setActiveModule} />
      </div>
    </div>
  );
};

export default Index;

import type { ViewKey } from '../types';
import DashboardPage from '../pages/Dashboard';
import ClientesPage from '../pages/Clientes';
import ComentariosPage from '../pages/Comentarios';
import AnalisisNLPPage from '../pages/AnalisisNPL';
import MetricasPage from '../pages/Metricas';
import ReportesPage from '../pages/Reportes';
import ConfiguracionPage from '../pages/Configuracion';

export const renderPage = (view: ViewKey, onSelectView: (view: ViewKey) => void) => {
  const props = { activeView: view, onSelectView };

  switch (view) {
    case 'dashboard':
      return <DashboardPage {...props} />;
    case 'clientes':
      return <ClientesPage {...props} />;
    case 'comentarios':
      return <ComentariosPage {...props} />;
    case 'analisisNLP':
      return <AnalisisNLPPage {...props} />;
    case 'metricas':
      return <MetricasPage {...props} />;
    case 'reportes':
      return <ReportesPage {...props} />;
    case 'configuracion':
      return <ConfiguracionPage {...props} />;
    default:
      return <DashboardPage {...props} />;
  }
};

import { AppLayout } from '../layouts/AppLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import type { ViewKey } from '../types';
import { ExportMenu, exportRows, type ExportFormat } from '../utils/exports';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

export default function ReportesPage({ activeView = 'reportes', onSelectView = () => undefined }: PageProps) {
  const { kpis, metrics, reload } = useDashboardData();
  const reportRows = kpis.map((item) => ({ name: item.label, value: item.value, change: item.trend || 'Actual' }));
  const exportar = (format: ExportFormat) => exportRows([['Indicador', 'Valor', 'Cambio'], ...reportRows.map((row) => [row.name, row.value, row.change])], format, 'reporte');
  return (
    <AppLayout activeView={activeView} onSelectView={onSelectView}>
      <header className="header-bar">
        <div>
          <div className="eyebrow">Executive</div>
          <h1>Reportes</h1>
        </div>
        <div className="header-actions">
          <ExportMenu onExport={exportar} />
          <button type="button" className="chip highlight" onClick={reload}>Actualizar informe</button>
        </div>
      </header>

      <div className="stats-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="tool-card tool-blue">
            <div className="tool-title">{metric.label}</div>
            <p>{metric.value}% de objetivo alcanzado</p>
          </article>
        ))}
      </div>

      <div className="content-stack">
        <section className="panel">
          <div className="panel-header">
            <h3>RESUMEN EJECUTIVO</h3>
          </div>

          <div className="report-list">
            {reportRows.map((row) => (
              <div key={row.name} className="report-row">
                <span>{row.name}</span>
                <strong>{row.value}</strong>
                <em>{row.change}</em>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

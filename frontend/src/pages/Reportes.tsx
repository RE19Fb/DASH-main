import { AppLayout } from '../layouts/AppLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import type { ViewKey } from '../types';
import { ExportMenu, exportRows, type ExportFormat } from '../utils/exports';
import { ListLimit } from '../components/ui/ListLimit';
import { useVisibleRecords } from '../hooks/useVisibleRecords';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

export default function ReportesPage({ activeView = 'reportes', onSelectView = () => undefined }: PageProps) {
  const { data, kpis, metrics, categories, activity, trend, reload } = useDashboardData();
  const visibleCategories = useVisibleRecords(categories);
  const reportRows = kpis.map((item) => ({ name: item.label, value: item.value, change: item.trend || 'Actual' }));
  const donutTotal = categories.reduce((total, item) => total + item.value, 0) || 1;
  let donutOffset = 0;
  const donutBackground = `conic-gradient(${categories.map((item) => { const start = donutOffset; donutOffset += item.value / donutTotal * 360; return `${item.color} ${start}deg ${donutOffset}deg`; }).join(', ')})`;
  const exportar = (format: ExportFormat) => exportRows([
    ['Indicador', 'Valor', 'Cambio'],
    ...reportRows.map((row) => [row.name, row.value, row.change]),
    [],
    ['Categoría', 'Porcentaje'],
    ...categories.map((item) => [item.name, `${item.value}%`]),
    [],
    ['Tabla', 'Registros'],
    ...Object.entries(data?.tablas ?? {}).map(([name, value]) => [name, String(value)]),
  ], format, 'reporte-completo');
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

      <section className="report-visual-grid">
        <section className="panel report-donut-panel">
          <div className="panel-header"><div><h3>DISTRIBUCIÓN DE CATEGORÍAS</h3><p className="panel-subtitle">Participación del volumen categorizado</p></div></div>
          <div className="report-donut-layout">
            <div className="report-donut" style={{ background: donutBackground }}><div><strong>{data?.comentarios ?? 0}</strong><span>comentarios</span></div></div>
            <div className="report-legend">{visibleCategories.visibleRecords.map((item) => <div className="report-legend-row" key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}<ListLimit total={categories.length} label="categorías" onChange={visibleCategories.setShowAll} /></div>
          </div>
        </section>
        <section className="panel report-bars-panel">
          <div className="panel-header"><div><h3>OBJETIVOS DE RENDIMIENTO</h3><p className="panel-subtitle">Cobertura actual frente al objetivo</p></div></div>
          <div className="report-bars">{metrics.map((metric) => <div className="report-bar-row" key={metric.label}><div><span>{metric.label}</span><strong>{metric.value}%</strong></div><div className="track"><i style={{ width: `${Math.min(metric.value, 100)}%` }} /></div></div>)}</div>
        </section>
      </section>

      <section className="report-visual-grid">
        <section className="panel report-trend-panel">
          <div className="panel-header"><div><h3>TENDENCIA DE TIEMPOS</h3><p className="panel-subtitle">Últimos registros de atención</p></div></div>
          <div className="report-trend-chart">{(trend.length ? trend : [0]).map((value, index) => <div className="report-trend-column" key={`${value}-${index}`}><span>{value}</span><i style={{ height: `${Math.max(value ? 10 : 0, value / Math.max(...trend, 1) * 100)}%` }} /></div>)}</div>
        </section>
        <section className="panel report-inventory-panel">
          <div className="panel-header"><div><h3>INVENTARIO DEL SISTEMA</h3><p className="panel-subtitle">Registros disponibles en Supabase</p></div></div>
          <div className="report-inventory">{Object.entries(data?.tablas ?? {}).map(([name, value]) => <div key={name}><span>{name.replaceAll('_', ' ')}</span><strong>{value.toLocaleString('es-ES')}</strong></div>)}</div>
        </section>
      </section>

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
        <section className="panel">
          <div className="panel-header"><div><h3>ACTIVIDAD RECIENTE</h3><p className="panel-subtitle">Últimos eventos recibidos desde la API</p></div></div>
          <div className="report-activity">{activity.map((item) => <div key={item.id}><span className={`activity-bullet ${item.type}`} /><div><strong>{item.title}</strong><span>{item.detail}</span></div><small>{item.time}</small></div>)}</div>
        </section>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '../layouts/AppLayout';
import { useMetrics } from '../hooks/useMetrics';
import type { ViewKey } from '../types';
import { ExportMenu, exportRows, type ExportFormat } from '../utils/exports';
import OptimizacionPage from './Oprimización';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

export default function MetricasPage({ activeView = 'metricas', onSelectView = () => undefined }: PageProps) {
  const { snapshots, summary, times, distribution, reload } = useMetrics();
  const chartValues = times.length ? times.slice(-12) : Array.from({ length: 8 }, () => 0);
  const chartMaximum = Math.max(...chartValues, 1);
  const distributionMaximum = Math.max(...distribution, 1);
  const exportar = (format: ExportFormat) => exportRows([['Métrica', 'Valor', 'Descripción'], ...snapshots.map((item) => [item.label, item.value, item.description])], format, 'metricas');
  return (
    <AppLayout activeView={activeView} onSelectView={onSelectView}>
      <header className="header-bar">
        <div>
          <div className="eyebrow">Scientific data</div>
          <h1>Métricas</h1>
        </div>
        <div className="header-actions"><button type="button" className="chip highlight" onClick={reload}>Actualizar datos</button></div>
      </header>
      <div className="dashboard-export"><ExportMenu onExport={exportar} /></div>
      <section className="panel analytics-panel">
        <div className="panel-header"><div><h3>ANÁLISIS SCIPY</h3><p className="panel-subtitle">Indicadores calculados con los tiempos registrados en Supabase</p></div></div>
        <div className="scientific-chart"><div className="scientific-bars">{chartValues.map((value, index) => <div className={`scientific-bar ${value === 0 ? 'is-empty' : ''}`} key={`${value}-${index}`} title={value ? `${value} minutos` : 'Sin datos'} style={{ height: `${value ? Math.max(8, value / chartMaximum * 100) : 0}%` }}><span>{value || 0}</span></div>)}</div></div>
        <div className="distribution-chart"><div className="panel-header"><h3>DISTRIBUCIÓN ESTADÍSTICA</h3><span className="card-detail">Mínimo · P25 · Mediana · P75 · Máximo</span></div><div className="distribution-bars">{distribution.map((value, index) => <div className={`distribution-bar ${value === 0 ? 'is-empty' : ''}`} key={`${index}-${value}`}><span>{value.toFixed(2)}</span><i style={{ height: `${value ? Math.max(8, value / distributionMaximum * 100) : 0}%` }} /><small>{['Mín.', 'P25', 'Mediana', 'P75', 'Máx.'][index]}</small></div>)}</div></div>
        <div className="bars-stack metric-bars">{summary.map((metric) => <div className="bar-track" key={metric.label}><span>{metric.label}</span><div className="track"><i style={{ width: `${metric.value}%` }} /></div><strong>{metric.value}%</strong></div>)}</div>
      </section>

      <div className="stats-grid metric-grid">
        {snapshots.map((metric) => (
          <article key={metric.label} className="stat-card metric-card">
            <div className="card-label">{metric.label}</div>
            <div className="card-value">{metric.value}</div>
            <span className="card-detail">{metric.description}</span>
          </article>
        ))}
      </div>
      <section className="scientific-section"><div className="section-heading"><span className="eyebrow">Scientific data</span><h2>Optimización de recursos</h2><p>Calcula escenarios con SciPy usando los datos ingresados.</p></div><OptimizacionPage embedded activeView={activeView} onSelectView={onSelectView} /></section>
    </AppLayout>
  );
}

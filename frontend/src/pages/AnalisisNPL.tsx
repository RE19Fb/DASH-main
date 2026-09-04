import { AppLayout } from '../layouts/AppLayout';
import { useNlpAnalysis } from '../hooks/useNlpAnalysis';
import { useComentarios } from '../hooks/useComentarios';
import type { ViewKey } from '../types';
import { ExportMenu, exportRows, type ExportFormat } from '../utils/exports';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

export default function AnalisisNLPPage({ activeView = 'analisisNLP', onSelectView = () => undefined }: PageProps) {
  const { categories, words, reload: reloadNlp } = useNlpAnalysis();
  const { comentarios, reload: reloadComments } = useComentarios();
	const processedRate = comentarios.length ? Math.round(comentarios.filter((item) => item.category !== 'Consulta').length / comentarios.length * 100) : 0;
	const dominantCategory = categories[0]?.value ?? 0;
  const statusCounts = comentarios.reduce<Record<string, number>>((result, item) => { const key = item.status ?? 'sin estado'; result[key] = (result[key] ?? 0) + 1; return result; }, {});
  const channelCounts = comentarios.reduce<Record<string, number>>((result, item) => { result[item.source] = (result[item.source] ?? 0) + 1; return result; }, {});
  const responseTimes = comentarios.map((item) => Number.parseFloat(item.responseTime)).filter(Number.isFinite);
  const averageResponse = responseTimes.length ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length : 0;
  const exportar = (format: ExportFormat) => exportRows([['Categoría', 'Distribución'], ...categories.map((item) => [item.name, `${item.value}%`])], format, 'analisis-nlp');
  return (
    <AppLayout activeView={activeView} onSelectView={onSelectView}>
      <header className="header-bar">
        <div>
          <div className="eyebrow">Inteligencia</div>
          <h1>Análisis NLP</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="chip highlight" onClick={() => { reloadNlp(); reloadComments(); }}>Actualizar análisis</button>
        </div>
      </header>
      <div className="dashboard-export"><ExportMenu onExport={exportar} /></div>

      <div className="stats-grid">
        <article className="stat-card">
          <div className="card-icon positive">C</div>
          <div className="card-text">
            <div className="card-label">Precisión</div>
            <div className="card-value">{processedRate}%</div>
            <div className="card-detail-row"><span className="card-detail">Distribución actual</span></div>
          </div>
        </article>

        <article className="stat-card">
          <div className="card-icon neutral">V</div>
          <div className="card-text">
            <div className="card-label">Volumen</div>
            <div className="card-value">{comentarios.length}</div>
            <div className="card-detail-row"><span className="card-detail">comentarios</span></div>
          </div>
        </article>

        <article className="stat-card">
          <div className="card-icon warning">T</div>
          <div className="card-text">
            <div className="card-label">Tendencia</div>
            <div className="card-value">{dominantCategory}%</div>
            <div className="card-detail-row"><span className="card-detail">semana</span></div>
          </div>
        </article>
      </div>

      <div className="two-col-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>PALABRAS FRECUENTES</h3>
          </div>

          <div className="word-cloud compact">
            {words.map((item) => (
              <span
                key={item.word}
                style={{ fontSize: `${Math.min(0.9 + item.size * 0.32, 1.15)}rem` }}
              >
                {item.word}
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>CATEGORIZACIÓN</h3>
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <div key={item.name} className="category-row">
                <div className="category-name-wrap">
                  <span className="category-dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                </div>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="two-col-grid analytics-grid">
        <section className="panel"><div className="panel-header"><h3>ESTADO DE LOS COMENTARIOS</h3></div><div className="analytics-bars">{Object.entries(statusCounts).map(([label, count]) => <div className="analytics-row" key={label}><span>{label}</span><div className="track"><i style={{ width: `${comentarios.length ? count / comentarios.length * 100 : 0}%` }} /></div><strong>{comentarios.length ? Math.round(count / comentarios.length * 100) : 0}%</strong></div>)}</div></section>
        <section className="panel"><div className="panel-header"><h3>CANALES / TIPO</h3></div><div className="analytics-bars">{Object.entries(channelCounts).map(([label, count]) => <div className="analytics-row" key={label}><span>{label}</span><div className="track"><i style={{ width: `${comentarios.length ? count / comentarios.length * 100 : 0}%` }} /></div><strong>{count}</strong></div>)}</div></section>
      </section>

      <section className="panel analytics-summary"><div><span>Tiempo medio de comentarios</span><strong>{averageResponse.toFixed(2)} min</strong></div><div><span>Comentarios analizados</span><strong>{comentarios.filter((item) => item.status === 'resuelto' || item.status === 'procesado').length}</strong></div><div><span>Palabras detectadas</span><strong>{words.length}</strong></div></section>

      <section className="panel">
        <div className="panel-header">
          <h3>INSIGHTS POR TEMA</h3>
        </div>

        <div className="insight-grid">
          {categories.map((item) => (
            <article key={item.name} className="insight-card">
              <div className="insight-head">
                <strong>{item.name}</strong>
                <span className="sentiment-pill neutral">Categoría</span>
              </div>
              <div className="insight-metric">
                <span>{Math.round(item.value * comentarios.length / 100)}</span>
                <small>{item.value}%</small>
              </div>
              <div className="track small-track"><i style={{ width: `${item.value}%` }} /></div>
              <small>Distribución: {item.value}%</small>
            </article>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

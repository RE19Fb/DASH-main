import { AppLayout } from '../layouts/AppLayout';
import { useComentarios } from '../hooks/useComentarios';
import { CommentFilters } from '../components/comentarios/CommentFilters';
import type { ViewKey } from '../types';
import { ExportMenu, exportRows, type ExportFormat } from '../utils/exports';
import { createComment } from '../services/backend';
import { useEffect, useState, type FormEvent } from 'react';
import { fetchClients, createAttentionTime, fetchAttentionTimes, updateAttentionTime, updateComment } from '../services/backend';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

export default function ComentariosPage({ activeView = 'comentarios', onSelectView = () => undefined }: PageProps) {
  const { comentarios, filters, setFilters, counts, reload } = useComentarios();
  const [clients, setClients] = useState<Array<{ id: number; nombre: string }>>([]);
  const [newComment, setNewComment] = useState({ contenido: '', canal: 'web', cliente_id: '', estado: 'pendiente', tiempo_minutos: '', operador: '' });
  const [commentMessage, setCommentMessage] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [attentionTimes, setAttentionTimes] = useState<Array<{ id: number; cliente_id?: number; comentario_id?: number; tiempo_minutos: number; fecha: string; operador?: string }>>([]);
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);
  const [editingTime, setEditingTime] = useState({ tiempo_minutos: '', operador: '' });
  useEffect(() => { void fetchClients().then((items) => setClients(items.map((item) => ({ id: item.id, nombre: item.name })))).catch(() => setClients([])); }, []);
  const loadAttentionTimes = () => { void fetchAttentionTimes().then(setAttentionTimes).catch(() => setAttentionTimes([])); };
  useEffect(() => { loadAttentionTimes(); }, []);
  const saveComment = (event: FormEvent) => {
    event.preventDefault();
    if (!newComment.contenido.trim()) {
      setCommentMessage('Escribe el comentario antes de guardar.');
      return;
    }
    if (newComment.tiempo_minutos && Number(newComment.tiempo_minutos) < 0) {
      setCommentMessage('El tiempo de atención no puede ser negativo.');
      return;
    }

    void createComment({
      contenido: newComment.contenido.trim(),
      canal: newComment.canal,
      cliente_id: newComment.cliente_id ? Number(newComment.cliente_id) : undefined,
      estado: newComment.estado,
    }).then((created: { id: number }) => {
      if (newComment.tiempo_minutos) {
        return createAttentionTime({
          cliente_id: newComment.cliente_id ? Number(newComment.cliente_id) : undefined,
          comentario_id: created.id,
          tiempo_minutos: Number(newComment.tiempo_minutos),
          operador: newComment.operador.trim() || undefined,
        }).then(() => created);
      }
      return created;
    }).then(() => {
      setCommentMessage('Comentario guardado, procesado por NLTK y registrado en Atención.');
      setNewComment({ contenido: '', canal: 'web', cliente_id: '', estado: 'pendiente', tiempo_minutos: '', operador: '' });
      setShowCommentForm(false);
      loadAttentionTimes();
      return reload();
    }).catch(() => setCommentMessage('No se pudo guardar el comentario o su tiempo.'));
  };
  const saveAttentionTime = (id: number) => { void updateAttentionTime(id, { tiempo_minutos: Number(editingTime.tiempo_minutos), operador: editingTime.operador.trim() || undefined }).then(() => { setEditingTimeId(null); loadAttentionTimes(); setCommentMessage('Tiempo de atención actualizado.'); }).catch(() => setCommentMessage('No se pudo actualizar el tiempo de atención.')); };
  const exportar = (format: ExportFormat) => exportRows([['Cliente', 'Categoría', 'Sentimiento', 'Comentario'], ...comentarios.map((item) => [item.client, item.category, item.sentiment, item.text])], format, 'comentarios');
  return (
    <AppLayout activeView={activeView} onSelectView={onSelectView}>
      <header className="header-bar">
        <div>
          <div className="eyebrow">Atención</div>
          <h1>Comentarios</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="chip" onClick={() => setFilters({ sentiment: 'all', category: 'all', search: '', dateFrom: '', dateTo: '' })}>Limpiar filtros</button>
          <ExportMenu onExport={exportar} />
        </div>
      </header>

      <div className="stats-grid">
        <article className="stat-card">
          <div className="card-icon positive">P</div>
          <div className="card-text">
            <div className="card-label">Positivos</div>
            <div className="card-value">{counts.total ? `${Math.round(counts.positivos / counts.total * 100)}%` : '0%'}</div>
            <div className="card-detail-row"><span className="card-detail">De los comentarios cargados</span></div>
          </div>
        </article>

        <article className="stat-card">
          <div className="card-icon neutral">N</div>
          <div className="card-text">
            <div className="card-label">Neutral</div>
            <div className="card-value">{counts.total ? `${Math.round(counts.neutrales / counts.total * 100)}%` : '0%'}</div>
            <div className="card-detail-row"><span className="card-detail">{counts.neutrales} casos</span></div>
          </div>
        </article>

        <article className="stat-card">
          <div className="card-icon warning">R</div>
          <div className="card-text">
            <div className="card-label">Negativos</div>
            <div className="card-value">{counts.total ? `${Math.round(counts.negativos / counts.total * 100)}%` : '0%'}</div>
            <div className="card-detail-row"><span className="card-detail">{counts.negativos} casos</span></div>
          </div>
        </article>
      </div>

      <div className="content-stack">
        {showCommentForm && <form className="panel attention-form" onSubmit={saveComment}>
          <div className="panel-header">
            <h3>NUEVO REGISTRO DE ATENCIÓN</h3>
            <span className="form-note">El estado del comentario se clasifica automáticamente.</span>
          </div>

          <div className="attention-form-grid">
            <div className="field-group full-width">
              <label htmlFor="comentario-texto">Comentario del cliente</label>
              <textarea id="comentario-texto" placeholder="Describe la experiencia, caso o solicitud del cliente" value={newComment.contenido} onChange={(event) => setNewComment({ ...newComment, contenido: event.target.value })} rows={4} required />
            </div>

            <div className="field-group">
              <label htmlFor="comentario-cliente">Cliente</label>
              <select id="comentario-cliente" value={newComment.cliente_id} onChange={(event) => setNewComment({ ...newComment, cliente_id: event.target.value })}><option value="">Sin cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}</select>
            </div>

            <div className="field-group">
              <label htmlFor="comentario-canal">Canal</label>
              <select id="comentario-canal" value={newComment.canal} onChange={(event) => setNewComment({ ...newComment, canal: event.target.value })}><option value="web">Web</option><option value="email">Email</option><option value="chat">Chat</option><option value="whatsapp">WhatsApp</option></select>
            </div>

            <div className="field-group">
              <label htmlFor="comentario-estado">Estado</label>
              <select id="comentario-estado" value={newComment.estado} onChange={(event) => setNewComment({ ...newComment, estado: event.target.value })}><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option><option value="resuelto">Resuelto</option><option value="cancelado">Cancelado</option></select>
            </div>

            <div className="field-group">
              <label htmlFor="comentario-tiempo">Nuevo tiempo de atención (min)</label>
              <input id="comentario-tiempo" type="number" min="0" step="0.01" placeholder="Ej. 12.5" value={newComment.tiempo_minutos} onChange={(event) => setNewComment({ ...newComment, tiempo_minutos: event.target.value })} />
            </div>

            <div className="field-group">
              <label htmlFor="comentario-operador">Operador</label>
              <input id="comentario-operador" placeholder="Nombre del operador" value={newComment.operador} onChange={(event) => setNewComment({ ...newComment, operador: event.target.value })} />
            </div>
          </div>

          <div className="attention-actions">
            <button type="submit" className="mini-btn primary">Guardar atención</button><button type="button" className="mini-btn" onClick={() => setShowCommentForm(false)}>Cancelar</button>
            {commentMessage && <span className="card-detail">{commentMessage}</span>}
          </div>
        </form>}
        <section className="panel table-panel">
          <div className="panel-header"><h3>TIEMPOS DE ATENCIÓN REGISTRADOS</h3><div className="header-actions"><button type="button" className="mini-btn primary" onClick={() => setShowCommentForm(true)}>Nuevo registro de atención</button><button type="button" className="mini-btn" onClick={loadAttentionTimes}>Actualizar</button></div></div>
          <table className="data-table"><thead><tr><th>ID</th><th>Cliente</th><th>Comentario</th><th>Tiempo registrado</th><th>Operador</th><th>Fecha de creación</th><th>Acciones</th></tr></thead><tbody>{attentionTimes.map((time) => <tr key={time.id}><td>{time.id}</td><td>{time.cliente_id ?? 'N/D'}</td><td>{time.comentario_id ?? 'N/D'}</td><td>{editingTimeId === time.id ? <><span className="inline-label">Editar tiempo de atención</span><input aria-label={`Editar tiempo de atención ${time.id}`} type="number" min="0" step="0.01" value={editingTime.tiempo_minutos} onChange={(event) => setEditingTime({ ...editingTime, tiempo_minutos: event.target.value })} /></> : `${time.tiempo_minutos} min`}</td><td>{editingTimeId === time.id ? <input aria-label={`Editar operador ${time.id}`} value={editingTime.operador} onChange={(event) => setEditingTime({ ...editingTime, operador: event.target.value })} /> : time.operador || 'N/D'}</td><td>{time.fecha ? new Date(time.fecha).toLocaleDateString('es-ES') : 'N/D'}</td><td>{editingTimeId === time.id ? <><button type="button" className="mini-btn primary" onClick={() => saveAttentionTime(time.id)}>Guardar modificación</button><button type="button" className="mini-btn" onClick={() => setEditingTimeId(null)}>Cancelar</button></> : <button type="button" className="mini-btn" onClick={() => { setEditingTimeId(time.id); setEditingTime({ tiempo_minutos: String(time.tiempo_minutos), operador: time.operador ?? '' }); }}>Editar registro</button>}</td></tr>)}</tbody></table>{attentionTimes.length === 0 && <div className="empty-state"><h4>No hay tiempos registrados</h4><p>Los tiempos guardados aparecerán aquí.</p></div>}
        </section>
        <CommentFilters
          {...filters}
          onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}
          onSentimentChange={(sentiment) => setFilters((current) => ({ ...current, sentiment }))}
          onCategoryChange={(category) => setFilters((current) => ({ ...current, category }))}
          onDateFromChange={(dateFrom) => setFilters((current) => ({ ...current, dateFrom }))}
          onDateToChange={(dateTo) => setFilters((current) => ({ ...current, dateTo }))}
        />
        <section className="panel table-panel">
          <div className="panel-header">
            <h3>HISTORIAL DE COMENTARIOS</h3>
            <button type="button" className="mini-btn" onClick={() => setFilters((current) => ({ ...current, search: '' }))}>Limpiar</button>
          </div>

          <div className="comment-list">
            {comentarios.map((comment) => (
              <article key={comment.id} className="comment-card">
                <div className="comment-header">
                  <div>
                    <strong>{comment.client}</strong>
                    <span>{comment.category}</span>
                  </div>
                  <div className="comment-actions">
                    <span className={`sentiment-pill ${comment.sentiment.toLowerCase()}`}>{comment.sentiment}</span>
                    <span className="rating-pill">★ {comment.rating}/5</span>
                  </div>
                </div>
                <p>{comment.text}</p>
                <div className="comment-meta">
                  <span>Fuente: {comment.source}</span>
                  <span>Estado: {comment.status}</span>
                  <span>Fecha: {comment.date ? new Date(comment.date).toLocaleString('es-ES') : 'Sin fecha'}</span>
                  <span>Prioridad: {comment.priority}</span>
                  <select value={comment.status ?? 'pendiente'} onChange={(event) => void updateComment(comment.id, { estado: event.target.value }).then(reload)} aria-label={`Estado del comentario ${comment.id}`}><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option><option value="resuelto">Resuelto</option><option value="cancelado">Cancelado</option></select>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

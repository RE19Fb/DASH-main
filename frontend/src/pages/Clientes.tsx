import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { useClientes } from '../hooks/useClientes';
import { createClient, deleteClient, fetchAudit, updateClient } from '../services/backend';
import { ExportMenu, exportRows, type ExportFormat } from '../utils/exports';
import type { ViewKey } from '../types';
import { ListLimit } from '../components/ui/ListLimit';
import { useVisibleRecords } from '../hooks/useVisibleRecords';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

type ClientForm = { nombre: string; email: string; telefono: string; empresa: string };
type AuditEntry = { id: number; accion: string; registro_id?: number; detalles?: Record<string, string | number | null>; created_at: string };

const emptyForm: ClientForm = { nombre: '', email: '', telefono: '', empresa: '' };

export default function ClientesPage({ activeView = 'clientes', onSelectView = () => undefined }: PageProps) {
  const { clientes, query, setQuery, status, setStatus, reload } = useClientes();
  const visibleClients = useVisibleRecords(clientes);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [message, setMessage] = useState('');
  const visibleHistory = useVisibleRecords(history);

  const loadHistory = () => fetchAudit().then((items) => setHistory(items.filter((item) => item.tabla === 'clientes'))).catch(() => setHistory([]));
  useEffect(() => { void loadHistory(); }, []);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim() || !form.empresa.trim()) {
      setMessage('Todos los campos del cliente son obligatorios.');
      return;
    }
    const operation = editingId === null ? createClient(form) : updateClient(editingId, form);
    void operation.then(() => { setMessage(editingId === null ? 'Cliente creado.' : 'Cliente actualizado.'); setForm(emptyForm); setEditingId(null); reload(); return loadHistory(); }).catch(() => setMessage('No se pudo guardar el cliente.'));
  };

  const remove = (id: number) => {
    if (!window.confirm('¿Eliminar este cliente? Quedará registrado en el historial.')) return;
    void deleteClient(id).then(() => { setMessage('Cliente eliminado y archivado en el historial.'); reload(); return loadHistory(); }).catch(() => setMessage('No se pudo eliminar el cliente.'));
  };

  const exportar = (format: ExportFormat) => exportRows([['ID', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Activo'], ...clientes.map((item) => [String(item.id), item.name, item.email, item.telefono, item.company, item.status])], format, 'clientes');

  return <AppLayout activeView={activeView} onSelectView={onSelectView}>
    <header className="header-bar"><div><div className="eyebrow">Gestión</div><h1>Clientes</h1></div><div className="header-actions"><input className="chip" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" /><select className="chip" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Todos</option><option value="Activo">Activos</option><option value="Pendiente">Pendientes</option></select></div></header>

    <>
      <section className="stats-grid"><article className="stat-card"><div className="card-icon positive">C</div><div className="card-text"><div className="card-label">Clientes activos</div><div className="card-value">{clientes.filter((item) => item.status === 'Activo').length}</div><div className="card-detail">De Supabase</div></div></article><article className="stat-card"><div className="card-icon neutral">S</div><div className="card-text"><div className="card-label">Satisfacción</div><div className="card-value">{clientes.length ? `${Math.round(clientes.reduce((total, item) => total + item.satisfaction, 0) / clientes.length)}%` : '0%'}</div><div className="card-detail">Calculada de los registros</div></div></article><article className="stat-card"><div className="card-icon warning">R</div><div className="card-text"><div className="card-label">Riesgo alto</div><div className="card-value">{clientes.filter((item) => item.risk === 'Alto').length}</div><div className="card-detail">Registros actuales</div></div></article></section>
      {showForm && <form className="panel config-form" onSubmit={save}><h3>{editingId === null ? 'NUEVO CLIENTE' : `EDITAR CLIENTE #${editingId}`}</h3>{editingId !== null && <label>ID: <strong>{editingId}</strong></label>}<input required placeholder="Nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /><input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><input required placeholder="Teléfono" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} /><input required placeholder="Empresa" value={form.empresa} onChange={(event) => setForm({ ...form, empresa: event.target.value })} /><button type="submit" className="mini-btn">{editingId === null ? 'Guardar cliente' : 'Guardar cambios'}</button><button type="button" className="mini-btn" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(false); }}>Cancelar</button>{message && <span className="card-detail">{message}</span>}</form>}
      <section className="panel table-panel"><div className="panel-header"><h3>LISTA DE CLIENTES</h3><div className="header-actions"><button type="button" className="mini-btn primary" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>Nuevo cliente</button><ExportMenu onExport={exportar} /></div></div><table className="data-table"><thead><tr><th>ID</th><th>Cliente</th><th>Email</th><th>Teléfono</th><th>Empresa</th><th>Activo</th><th>Creado</th><th>Actualizado</th><th>Acciones</th></tr></thead><tbody>{visibleClients.visibleRecords.map((client) => <tr key={client.id}><td>{client.id}</td><td>{client.name}</td><td>{client.email || 'Sin email'}</td><td>{client.telefono || 'Sin teléfono'}</td><td>{client.company}</td><td><span className={`status-pill ${client.status.toLowerCase()}`}>{client.status}</span></td><td>{client.createdAt ? new Date(client.createdAt).toLocaleString('es-ES') : 'N/D'}</td><td>{client.updatedAt ? new Date(client.updatedAt).toLocaleString('es-ES') : 'N/D'}</td><td><button type="button" className="mini-btn" onClick={() => { setEditingId(client.id); setForm({ nombre: client.name, email: client.email, telefono: client.telefono ?? '', empresa: client.company }); setShowForm(true); }}>Editar</button><button type="button" className="mini-btn danger-btn" onClick={() => remove(client.id)}>Eliminar</button></td></tr>)}</tbody></table><ListLimit total={clientes.length} label="clientes" onChange={visibleClients.setShowAll} />{clientes.length === 0 && <div className="empty-state"><h4>No hay clientes registrados</h4><p>Los nuevos registros de Supabase aparecerán aquí.</p></div>}</section>
      <section className="panel table-panel"><div className="panel-header"><h3>HISTORIAL DE REGISTROS Y ELIMINADOS</h3><button type="button" className="mini-btn" onClick={() => void loadHistory()}>Actualizar</button></div><table className="data-table"><thead><tr><th>Acción</th><th>ID cliente</th><th>Datos registrados</th><th>Fecha</th></tr></thead><tbody>{visibleHistory.visibleRecords.map((entry) => <tr key={entry.id}><td><span className={`status-pill ${entry.accion.toLowerCase()}`}>{entry.accion}</span></td><td>{entry.registro_id ?? 'N/D'}</td><td>{entry.detalles ? Object.entries(entry.detalles).map(([key, value]) => `${key}: ${value ?? ''}`).join(' · ') : 'Sin detalles'}</td><td>{new Date(entry.created_at).toLocaleString('es-ES')}</td></tr>)}</tbody></table><ListLimit total={history.length} label="movimientos" onChange={visibleHistory.setShowAll} />{history.length === 0 && <div className="empty-state"><h4>No hay movimientos registrados</h4><p>Las próximas altas, ediciones y eliminaciones quedarán aquí.</p></div>}</section>
    </>
  </AppLayout>;
}

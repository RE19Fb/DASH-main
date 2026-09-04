import { AppLayout } from '../layouts/AppLayout';
import { createCategory, createUser, fetchAudit, fetchCategories, fetchUsers, updateCategory, updateUser } from '../services/backend';
import { useEffect, useState } from 'react';
import type { ViewKey } from '../types';

interface PageProps {
  activeView?: ViewKey;
  onSelectView?: (view: ViewKey) => void;
}

export default function ConfiguracionPage({ activeView = 'configuracion', onSelectView = () => undefined }: PageProps) {
  const [users, setUsers] = useState<Array<{ id: number; nombre: string; rol: string; activo: boolean }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; nombre: string; descripcion?: string | null; activo: boolean }>>([]);
  const [audit, setAudit] = useState<Array<{ id: number; accion: string; tabla?: string; created_at: string }>>([]);
  const [newCategory, setNewCategory] = useState({ nombre: '', descripcion: '' });
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password_hash: '', rol: 'USUARIO', activo: true });
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const load = () => Promise.all([fetchUsers(), fetchCategories(), fetchAudit()]).then(([loadedUsers, loadedCategories, loadedAudit]) => { setUsers(loadedUsers); setCategories(loadedCategories); setAudit(loadedAudit); }).catch(() => { setUsers([]); setCategories([]); setAudit([]); });
  useEffect(() => {
    void load();
  }, []);
  const roles = (role: string) => users.filter((user) => user.rol === role).length;
  return (
    <AppLayout activeView={activeView} onSelectView={onSelectView}>
      <header className="header-bar">
        <div>
          <div className="eyebrow">Configuración</div>
          <h1>Configuración</h1>
        </div>
      </header>

      <div className="content-stack">
        <section className="panel">
          <div className="panel-header">
            <h3>USUARIOS</h3>
            <div className="header-actions"><button type="button" className="mini-btn primary" onClick={() => setShowUserForm(true)}>Nuevo usuario</button><button type="button" className="mini-btn" onClick={() => void load()}>Actualizar</button></div>
          </div>
          {showUserForm && <form className="config-form" onSubmit={(event) => { event.preventDefault(); if (!newUser.nombre.trim() || !newUser.email.trim() || !newUser.password_hash.trim()) return; void createUser({ nombre: newUser.nombre.trim(), email: newUser.email.trim(), password_hash: newUser.password_hash, rol: newUser.rol, activo: newUser.activo }).then(() => { setNewUser({ nombre: '', email: '', password_hash: '', rol: 'USUARIO', activo: true }); setShowUserForm(false); return load(); }); }}>
            <input required placeholder="Nombre" value={newUser.nombre} onChange={(event) => setNewUser({ ...newUser, nombre: event.target.value })} />
            <input required type="email" placeholder="Email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
            <input required type="password" placeholder="Contraseña" value={newUser.password_hash} onChange={(event) => setNewUser({ ...newUser, password_hash: event.target.value })} />
            <select value={newUser.rol} onChange={(event) => setNewUser({ ...newUser, rol: event.target.value })}><option>ADMIN</option><option>ANALISTA</option><option>SUPERVISOR</option><option>USUARIO</option></select>
            <label className="checkbox-row"><input type="checkbox" checked={newUser.activo} onChange={(event) => setNewUser({ ...newUser, activo: event.target.checked })} /> Activo</label>
            <button type="submit" className="mini-btn">Agregar usuario</button>
            <button type="button" className="mini-btn" onClick={() => setShowUserForm(false)}>Cancelar</button>
          </form>}
          <div className="category-list">{users.map((user) => <div key={user.id} className="category-row"><span>{user.nombre} · {user.rol} · {user.activo ? 'Activo' : 'Inactivo'}</span><button type="button" className="mini-btn" onClick={() => void updateUser(user.id, { activo: !user.activo }).then(load)}>{user.activo ? 'Desactivar' : 'Activar'}</button></div>)}</div>

          <div className="summary-cards">
            <div className="summary-card">
              <span>Administradores</span>
              <strong>{roles('ADMIN')}</strong>
            </div>
            <div className="summary-card">
              <span>Operadores</span>
              <strong>{users.filter((user) => user.rol !== 'ADMIN').length}</strong>
            </div>
            <div className="summary-card">
              <span>Auditores</span>
              <strong>{users.filter((user) => user.activo).length}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>CATEGORÍAS</h3>
            <button type="button" className="mini-btn primary" onClick={() => setShowCategoryForm(true)}>Nueva categoría</button>
          </div>
          {showCategoryForm && <form className="config-form" onSubmit={(event) => { event.preventDefault(); if (!newCategory.nombre.trim()) return; void createCategory({ nombre: newCategory.nombre.trim(), descripcion: newCategory.descripcion.trim() || undefined }).then(() => { setNewCategory({ nombre: '', descripcion: '' }); setShowCategoryForm(false); return load(); }); }}>
            <input required placeholder="Nueva categoría" value={newCategory.nombre} onChange={(event) => setNewCategory({ ...newCategory, nombre: event.target.value })} />
            <input placeholder="Descripción" value={newCategory.descripcion} onChange={(event) => setNewCategory({ ...newCategory, descripcion: event.target.value })} />
            <button type="submit" className="mini-btn">Agregar categoría</button>
            <button type="button" className="mini-btn" onClick={() => setShowCategoryForm(false)}>Cancelar</button>
          </form>}
          <div className="category-list">
            {categories.map((category) => (
              <div key={category.id} className="category-row">
                <span>{category.nombre}{category.descripcion ? ` · ${category.descripcion}` : ''}{` · ${category.activo ? 'Activo' : 'Inactivo'}`}</span>
                <button type="button" className="mini-btn" onClick={() => void updateCategory(category.id, { activo: !category.activo }).then(load)}>{category.activo ? 'Desactivar' : 'Activar'}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><h3>AUDITORÍA</h3><button type="button" className="mini-btn" onClick={() => void load()}>Actualizar</button></div>
          <div className="category-list">{audit.map((entry) => <div key={entry.id} className="category-row"><span>{entry.accion} {entry.tabla ? `· ${entry.tabla}` : ''}</span><strong>{new Date(entry.created_at).toLocaleString('es-ES')}</strong></div>)}</div>
        </section>
      </div>
    </AppLayout>
  );
}

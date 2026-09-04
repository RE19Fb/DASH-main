import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { createCategory, createUser, deleteCategory, deleteUser, fetchAudit, fetchCategories, fetchUsers, updateCategory, updateUser } from '../services/backend';
import type { ViewKey } from '../types';
import { ListLimit } from '../components/ui/ListLimit';
import { useVisibleRecords } from '../hooks/useVisibleRecords';

interface PageProps { activeView?: ViewKey; onSelectView?: (view: ViewKey) => void; }
type UserRecord = { id: number; nombre: string; email?: string; rol: string; activo: boolean };
type CategoryRecord = { id: number; nombre: string; descripcion?: string | null; activo: boolean };
type AuditRecord = { id: number; accion: string; tabla?: string; created_at: string };
type UserForm = { nombre: string; email: string; password_hash: string; rol: string; activo: boolean };
type CategoryForm = { nombre: string; descripcion: string };

const emptyUser: UserForm = { nombre: '', email: '', password_hash: '', rol: 'USUARIO', activo: true };
const emptyCategory: CategoryForm = { nombre: '', descripcion: '' };

export default function ConfiguracionPage({ activeView = 'configuracion', onSelectView = () => undefined }: PageProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [userForm, setUserForm] = useState<UserForm>(emptyUser);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const visibleUsers = useVisibleRecords(users);
  const visibleCategories = useVisibleRecords(categories);
  const visibleAudit = useVisibleRecords(audit);
  const load = () => Promise.all([fetchUsers(), fetchCategories(), fetchAudit()]).then(([loadedUsers, loadedCategories, loadedAudit]) => { setUsers(loadedUsers); setCategories(loadedCategories); setAudit(loadedAudit); }).catch(() => { setUsers([]); setCategories([]); setAudit([]); });
  useEffect(() => { void load(); }, []);

  const saveUser = (event: FormEvent) => {
    event.preventDefault();
    if (!userForm.nombre.trim() || !userForm.email.trim() || (editingUserId === null && !userForm.password_hash.trim())) return;
    const operation = editingUserId === null ? createUser(userForm) : updateUser(editingUserId, { nombre: userForm.nombre.trim(), email: userForm.email.trim(), ...(userForm.password_hash.trim() ? { password_hash: userForm.password_hash } : {}), rol: userForm.rol, activo: userForm.activo });
    void operation.then(() => { setUserForm(emptyUser); setEditingUserId(null); setShowUserForm(false); return load(); });
  };
  const saveCategory = (event: FormEvent) => {
    event.preventDefault();
    if (!categoryForm.nombre.trim()) return;
    const operation = editingCategoryId === null ? createCategory({ nombre: categoryForm.nombre.trim(), descripcion: categoryForm.descripcion.trim() || undefined }) : updateCategory(editingCategoryId, { nombre: categoryForm.nombre.trim(), descripcion: categoryForm.descripcion.trim() || undefined });
    void operation.then(() => { setCategoryForm(emptyCategory); setEditingCategoryId(null); setShowCategoryForm(false); return load(); });
  };
  const editUser = (user: UserRecord) => { setEditingUserId(user.id); setUserForm({ nombre: user.nombre, email: user.email ?? '', password_hash: '', rol: user.rol, activo: user.activo }); setShowUserForm(true); };
  const editCategory = (category: CategoryRecord) => { setEditingCategoryId(category.id); setCategoryForm({ nombre: category.nombre, descripcion: category.descripcion ?? '' }); setShowCategoryForm(true); };
  const removeUser = (id: number) => { if (window.confirm('¿Eliminar este usuario?')) void deleteUser(id).then(load); };
  const removeCategory = (id: number) => { if (window.confirm('¿Eliminar esta categoría?')) void deleteCategory(id).then(load); };

  return <AppLayout activeView={activeView} onSelectView={onSelectView}>
    <header className="header-bar"><div><div className="eyebrow">Configuración</div><h1>Configuración</h1></div><button type="button" className="chip" onClick={() => void load()}>Actualizar</button></header>
    <section className="config-grid">
      <section className="panel config-panel">
        <div className="panel-header"><h3>USUARIOS</h3><button type="button" className="mini-btn primary" onClick={() => { setEditingUserId(null); setUserForm(emptyUser); setShowUserForm(true); }}>Nuevo usuario</button></div>
        {showUserForm && <form className="config-form compact-form" onSubmit={saveUser}><input required placeholder="Nombre" value={userForm.nombre} onChange={(event) => setUserForm({ ...userForm, nombre: event.target.value })} /><input required type="email" placeholder="Email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} /><input type="password" placeholder={editingUserId === null ? 'Contraseña' : 'Nueva contraseña (opcional)'} required={editingUserId === null} value={userForm.password_hash} onChange={(event) => setUserForm({ ...userForm, password_hash: event.target.value })} /><select value={userForm.rol} onChange={(event) => setUserForm({ ...userForm, rol: event.target.value })}><option>ADMIN</option><option>ANALISTA</option><option>SUPERVISOR</option><option>USUARIO</option></select><label className="checkbox-row"><input type="checkbox" checked={userForm.activo} onChange={(event) => setUserForm({ ...userForm, activo: event.target.checked })} /> Activo</label><button type="submit" className="mini-btn">{editingUserId === null ? 'Agregar' : 'Guardar'}</button><button type="button" className="mini-btn" onClick={() => setShowUserForm(false)}>Cancelar</button></form>}
        <div className="category-list compact-list">{visibleUsers.visibleRecords.map((user) => <div key={user.id} className="category-row config-row"><span>{user.nombre} · {user.rol} · {user.activo ? 'Activo' : 'Inactivo'}</span><div className="row-actions"><button type="button" className="mini-btn" onClick={() => editUser(user)}>Editar</button><button type="button" className="mini-btn" onClick={() => void updateUser(user.id, { activo: !user.activo }).then(load)}>{user.activo ? 'Desactivar' : 'Activar'}</button><button type="button" className="mini-btn danger-btn" onClick={() => removeUser(user.id)}>Eliminar</button></div></div>)}</div>
        <ListLimit total={users.length} label="usuarios" onChange={visibleUsers.setShowAll} />
        <div className="summary-cards compact-summary"><div className="summary-card"><span>Administradores</span><strong>{users.filter((user) => user.rol === 'ADMIN').length}</strong></div><div className="summary-card"><span>Operadores</span><strong>{users.filter((user) => user.rol !== 'ADMIN').length}</strong></div><div className="summary-card"><span>Activos</span><strong>{users.filter((user) => user.activo).length}</strong></div></div>
      </section>
      <section className="panel config-panel">
        <div className="panel-header"><h3>CATEGORÍAS</h3><button type="button" className="mini-btn primary" onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategory); setShowCategoryForm(true); }}>Nueva categoría</button></div>
        {showCategoryForm && <form className="config-form compact-form" onSubmit={saveCategory}><input required placeholder="Nombre de categoría" value={categoryForm.nombre} onChange={(event) => setCategoryForm({ ...categoryForm, nombre: event.target.value })} /><input placeholder="Descripción" value={categoryForm.descripcion} onChange={(event) => setCategoryForm({ ...categoryForm, descripcion: event.target.value })} /><button type="submit" className="mini-btn">{editingCategoryId === null ? 'Agregar' : 'Guardar'}</button><button type="button" className="mini-btn" onClick={() => setShowCategoryForm(false)}>Cancelar</button></form>}
        <div className="category-list compact-list">{visibleCategories.visibleRecords.map((category) => <div key={category.id} className="category-row config-row"><span>{category.nombre}{category.descripcion ? ` · ${category.descripcion}` : ''} · {category.activo ? 'Activo' : 'Inactivo'}</span><div className="row-actions"><button type="button" className="mini-btn" onClick={() => editCategory(category)}>Editar</button><button type="button" className="mini-btn" onClick={() => void updateCategory(category.id, { activo: !category.activo }).then(load)}>{category.activo ? 'Desactivar' : 'Activar'}</button><button type="button" className="mini-btn danger-btn" onClick={() => removeCategory(category.id)}>Eliminar</button></div></div>)}</div>
        <ListLimit total={categories.length} label="categorías" onChange={visibleCategories.setShowAll} />
      </section>
    </section>
    <section className="panel audit-panel"><div className="panel-header"><div><h3>AUDITORÍA</h3><p className="panel-subtitle">Actividad administrativa registrada</p></div><button type="button" className="mini-btn" onClick={() => void load()}>Actualizar</button></div><div className="category-list compact-list">{visibleAudit.visibleRecords.map((entry) => <div key={entry.id} className="category-row"><span>{entry.accion} {entry.tabla ? `· ${entry.tabla}` : ''}</span><strong>{new Date(entry.created_at).toLocaleString('es-ES')}</strong></div>)}</div><ListLimit total={audit.length} label="eventos" onChange={visibleAudit.setShowAll} /></section>
  </AppLayout>;
}
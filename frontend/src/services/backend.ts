import type { ActivityItem, CategoryMetric, ClientRecord, CommentRecord, MetricBar, MetricSnapshot, WordCloudItem } from '../types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

type ApiClient = { id: number; nombre: string; email?: string; telefono?: string; empresa?: string; activo: boolean; created_at?: string; updated_at?: string };
type ApiComment = { id: number; cliente_id?: number; contenido: string; canal: string; categoria?: string; procesado: boolean; estado: string; fecha: string };

const categoryToUi = (category?: string): CommentRecord['category'] => {
  const values: Record<string, CommentRecord['category']> = {
    SOPORTE: 'Soporte', VENTAS: 'Ventas', RECLAMO: 'Reclamo', FELICITACION: 'Felicitación', CONSULTA: 'Consulta',
  };
  return values[category ?? ''] ?? 'Consulta';
};

export async function fetchClients(): Promise<ClientRecord[]> {
  const clients = await request<ApiClient[]>('/clientes/');
  return clients.map((client) => ({
    id: client.id,
    name: client.nombre,
    company: client.empresa ?? 'Sin empresa',
    email: client.email ?? '',
    telefono: client.telefono ?? '',
    createdAt: client.created_at,
    updatedAt: client.updated_at,
    status: client.activo ? 'Activo' : 'Pendiente',
    satisfaction: 0,
    segment: 'General',
    owner: 'Sin asignar',
    lastInteraction: 'Sin actividad',
    risk: 'Bajo',
    tenure: 'Nuevo',
  }));
}

export function createClient(payload: { nombre: string; email?: string; telefono?: string; empresa?: string }) {
  return request('/clientes/', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateClient(id: number, payload: { nombre?: string; email?: string; telefono?: string; empresa?: string; activo?: boolean }) {
  return request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteClient(id: number) {
  return request<void>(`/clientes/${id}`, { method: 'DELETE' });
}

export async function fetchComments(): Promise<CommentRecord[]> {
  const [comments, clients, times] = await Promise.all([request<ApiComment[]>('/comentarios/'), request<ApiClient[]>('/clientes/'), fetchAttentionTimes()]);
  const clientNames = new Map(clients.map((client) => [client.id, client.nombre]));
  const responseTimes = new Map(times.filter((item) => item.comentario_id).map((item) => [item.comentario_id, item.tiempo_minutos]));
  return comments.map((comment) => ({
    id: comment.id,
    client: comment.cliente_id ? clientNames.get(comment.cliente_id) ?? `Cliente #${comment.cliente_id}` : 'Sin cliente',
    sentiment: comment.categoria === 'RECLAMO' ? 'Negativo' : comment.categoria === 'FELICITACION' ? 'Positivo' : 'Neutral',
    category: categoryToUi(comment.categoria),
    text: comment.contenido,
    rating: 0,
    source: comment.canal,
    priority: comment.categoria === 'RECLAMO' ? 'Alta' : 'Media',
    status: comment.estado,
    date: comment.fecha,
    responseTime: responseTimes.has(comment.id) ? `${responseTimes.get(comment.id)} min` : 'Sin registrar',
  }));
}

export function createComment(payload: { contenido: string; canal: string; cliente_id?: number; estado?: string }): Promise<{ id: number }> {
  return request<{ id: number }>('/comentarios/', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateComment(id: number, payload: { estado?: string; canal?: string }) {
  return request(`/comentarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function createAttentionTime(payload: { cliente_id?: number; comentario_id?: number; tiempo_minutos: number; operador?: string }) {
  return request('/tiempos-atencion/', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateAttentionTime(id: number, payload: { tiempo_minutos?: number; operador?: string; fecha?: string }) {
  return request(`/tiempos-atencion/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function analyzeText(texto: string) {
  return request('/nltk/analizar', { method: 'POST', body: JSON.stringify({ texto }) });
}

export function calculateStatistics(valores: number[]) {
  return request('/scipy/estadisticas', { method: 'POST', body: JSON.stringify({ valores }) });
}

export function fetchAttentionMetrics() {
  return request<{ cantidad: number; media: number; mediana: number; desviacion_estandar: number; minimo: number; maximo: number; percentil_25: number; percentil_75: number }>('/metricas-atencion/');
}

export function interpolate(x_puntos: number[], y_puntos: number[], x_nuevo: number[]) {
  return request<{ x_nuevo: number[]; y_interpolado: number[] }>('/scipy/interpolacion', { method: 'POST', body: JSON.stringify({ x_puntos, y_puntos, x_nuevo }) });
}

export function optimizeScenario(nombre: string, recursos: Record<string, number>) {
  return request('/scipy/optimizacion', { method: 'POST', body: JSON.stringify({ nombre, recursos }) });
}

export interface DashboardSummary {
  clientes: number;
  comentarios: number;
  porcentaje_procesados: number;
  tiempo_promedio: number;
  categorias: CategoryMetric[];
  tendencia_tiempos: number[];
  palabras: WordCloudItem[];
  actividad: ActivityItem[];
  metricas: MetricBar[];
  tablas: { usuarios: number; auditoria: number; optimizaciones: number; tiempos_atencion: number; analisis_nlp: number };
}

export async function fetchAttentionTimes() {
  return request<Array<{ id: number; comentario_id?: number; cliente_id?: number; tiempo_minutos: number; fecha: string; operador?: string }>>('/tiempos-atencion/');
}

export async function fetchOptimizations() {
  return request<Array<{ id: number; nombre: string; descripcion?: string; estado: string; resultado?: { ahorro_porcentual?: number; roi?: number } }>>('/optimizaciones/');
}

export async function fetchUsers() {
  return request<Array<{ id: number; nombre: string; rol: string; activo: boolean }>>('/usuarios/');
}

export async function fetchCategories() {
  return request<Array<{ id: number; nombre: string; descripcion?: string | null; activo: boolean }>>('/categorias/');
}

export function createUser(payload: { nombre: string; email: string; password_hash: string; rol: string; activo?: boolean }) {
  return request('/usuarios/', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateUser(id: number, payload: { nombre?: string; email?: string; password_hash?: string; rol?: string; activo?: boolean }) {
  return request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteUser(id: number) {
  return request<void>(`/usuarios/${id}`, { method: 'DELETE' });
}

export function createCategory(payload: { nombre: string; descripcion?: string }) {
  return request('/categorias/', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateCategory(id: number, payload: { nombre?: string; descripcion?: string; activo?: boolean }) {
  return request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteCategory(id: number) {
  return request<void>(`/categorias/${id}`, { method: 'DELETE' });
}

export async function fetchAudit() {
  return request<Array<{ id: number; accion: string; tabla?: string; registro_id?: number; detalles?: Record<string, string | number | null>; ip?: string; created_at: string }>>('/auditoria/');
}

export function fetchDashboardSummary() {
  return request<DashboardSummary>('/metricas/resumen');
}

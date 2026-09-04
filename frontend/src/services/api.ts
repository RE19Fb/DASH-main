import type { ViewKey } from '../types';

export const menuItems: Array<{ key: ViewKey; label: string; icon: string; accent: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: '▣', accent: '#92e0b3' },
  { key: 'clientes', label: 'Clientes', icon: '◍', accent: '#a9d4ff' },
  { key: 'comentarios', label: 'Atención', icon: '☰', accent: '#ffd899' },
  { key: 'analisisNLP', label: 'Inteligencia NLP', icon: '✦', accent: '#b7d4ff' },
  { key: 'metricas', label: 'Scientific Data', icon: '◔', accent: '#9edfc7' },
  { key: 'reportes', label: 'Reportes', icon: '▤', accent: '#ffb9b9' },
  { key: 'configuracion', label: 'Configuración', icon: '⚙', accent: '#f7c3a5' },
];

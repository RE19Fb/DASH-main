import { useEffect, useState } from 'react';
import { fetchDashboardSummary } from '../services/backend';
import type { DashboardSummary } from '../services/backend';
import type { KpiCard } from '../types';

export function useDashboardData() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    void fetchDashboardSummary().then((summary) => { setData(summary); setError(null); }).catch(() => setError('No se pudo cargar el resumen del dashboard.'));
  };

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchDashboardSummary().then((summary) => { if (active) { setData(summary); setError(null); } }).catch(() => { if (active) setError('No se pudo cargar el resumen del dashboard.'); });
    };
    load();
    const interval = window.setInterval(load, 15000);
    window.addEventListener('focus', load);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', load); };
  }, []);

  const kpis: KpiCard[] = data ? [
    { label: 'Clientes', value: data.clientes.toLocaleString('es-ES'), detail: 'Total registrado', trend: '', tone: 'positive' },
    { label: 'Comentarios', value: data.comentarios.toLocaleString('es-ES'), detail: 'Total registrado', trend: '', tone: 'positive' },
    { label: 'Tiempo medio', value: `${data.tiempo_promedio} min`, detail: 'Atención registrada', trend: '', tone: 'neutral' },
    { label: 'Procesados', value: `${data.porcentaje_procesados}%`, detail: 'Cobertura actual', trend: '', tone: 'positive' },
  ] : [];

  return { data, error, kpis, categories: data?.categorias ?? [], activity: data?.actividad ?? [], metrics: data?.metricas ?? [], words: data?.palabras ?? [], trend: data?.tendencia_tiempos ?? [], reload };
}

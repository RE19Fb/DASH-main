interface TrendChartProps {
  values: number[];
  onDetail?: () => void;
}

export function TrendChart({ values = [], onDetail }: TrendChartProps) {
  const chartValues = values.length ? values : Array.from({ length: 8 }, () => 0);
  const maximum = Math.max(...chartValues, 1);
  const bars = chartValues.map((value) => value ? Math.max(8, value / maximum * 100) : 0);

  return (
    <div className="panel large-panel">
      <div className="panel-header">
        <h3>TIEMPOS DE ATENCIÓN</h3>
        <button type="button" className="mini-btn" onClick={onDetail}>Ver detalle</button>
      </div>

      <div className="chart-box">
        <div className="grid-lines" />
        <div className="bars">
          {bars.map((height, index) => (
            <span key={index} className={height === 0 ? 'is-empty' : ''} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

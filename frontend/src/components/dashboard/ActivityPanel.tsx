import type { ActivityItem } from '../../types';

interface ActivityPanelProps {
  items: ActivityItem[];
  onRefresh?: () => void;
}

export function ActivityPanel({ items, onRefresh }: ActivityPanelProps) {
  return (
    <div className="panel activity-panel">
      <div className="panel-header">
        <h3>ACTIVIDAD RECIENTE</h3>
        <button type="button" className="mini-btn" onClick={onRefresh}>Actualizar</button>
      </div>

      <div className="activity-list">
        {items.map((item) => (
          <div key={item.id} className={`activity-item ${item.type}`}>
            <div className="activity-bullet" />
            <div className="activity-copy">
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </div>
            <small>{item.time}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

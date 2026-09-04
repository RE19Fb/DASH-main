import type { ActivityItem } from '../../types';
import { useVisibleRecords } from '../../hooks/useVisibleRecords';
import { ListLimit } from '../ui/ListLimit';

interface ActivityPanelProps {
  items: ActivityItem[];
  onRefresh?: () => void;
}

export function ActivityPanel({ items, onRefresh }: ActivityPanelProps) {
  const { visibleRecords, setShowAll } = useVisibleRecords(items);
  return (
    <div className="panel activity-panel">
      <div className="panel-header">
        <h3>ACTIVIDAD RECIENTE</h3>
        <button type="button" className="mini-btn" onClick={onRefresh}>Actualizar</button>
      </div>

      <div className="activity-list">
        {visibleRecords.map((item) => (
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
      {items.length > 25 && <ListLimit total={items.length} onChange={setShowAll} />}
    </div>
  );
}

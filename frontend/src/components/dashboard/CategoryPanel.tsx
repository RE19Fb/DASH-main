import type { CategoryMetric } from '../../types';
import { useVisibleRecords } from '../../hooks/useVisibleRecords';
import { ListLimit } from '../ui/ListLimit';

interface CategoryPanelProps {
  items: CategoryMetric[];
  onRefresh?: () => void;
}

export function CategoryPanel({ items, onRefresh }: CategoryPanelProps) {
  const { visibleRecords, showAll, setShowAll } = useVisibleRecords(items);
  return (
    <div className="panel small-panel">
      <div className="panel-header">
        <h3>CATEGORÍAS NLP</h3>
        <button type="button" className="mini-btn" onClick={onRefresh}>Actualizar</button>
      </div>

      <div className="category-list">
        {visibleRecords.map((item) => (
          <div key={item.name} className="category-row">
            <div className="category-name-wrap">
              <span className="category-dot" style={{ background: item.color }} />
              <span>{item.name}</span>
            </div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
      {items.length > 25 && <ListLimit total={items.length} onChange={setShowAll} />}
    </div>
  );
}

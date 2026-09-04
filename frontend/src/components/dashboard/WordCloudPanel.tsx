import type { WordCloudItem } from '../../types';
import { useVisibleRecords } from '../../hooks/useVisibleRecords';
import { ListLimit } from '../ui/ListLimit';

interface WordCloudPanelProps {
  items: WordCloudItem[];
}

export function WordCloudPanel({ items }: WordCloudPanelProps) {
  const { visibleRecords, setShowAll } = useVisibleRecords(items);
  return (
    <div className="panel words-panel">
      <div className="panel-header">
        <h3>PALABRAS MÁS FRECUENTES</h3>
      </div>

      <div className="word-cloud">
        {visibleRecords.map((item) => (
          <span
            key={item.word}
            style={{
              fontSize: `${Math.min(0.9 + item.size * 0.32, 1.15)}rem`,
              opacity: 0.92,
            }}
          >
            {item.word}
          </span>
        ))}
      </div>
      {items.length > 25 && <ListLimit total={items.length} label="palabras" onChange={setShowAll} />}
    </div>
  );
}

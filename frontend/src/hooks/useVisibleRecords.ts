import { useState } from 'react';

export function useVisibleRecords<T>(records: T[], limit = 25) {
  const [showAll, setShowAll] = useState(false);
  const visibleRecords = showAll ? records : records.slice(0, limit);
  return { visibleRecords, showAll, setShowAll, limit };
}

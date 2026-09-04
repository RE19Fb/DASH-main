import { useState } from 'react';

interface ListLimitProps {
  total: number;
  label?: string;
  onChange?: (showAll: boolean) => void;
}

export function ListLimit({ total, label = 'registros', onChange }: ListLimitProps) {
  const [showAll, setShowAll] = useState(false);

  if (total <= 25) return null;

  const change = (nextShowAll: boolean) => {
    setShowAll(nextShowAll);
    onChange?.(nextShowAll);
  };

  return (
    <div className="list-limit" aria-label={`Visualización de ${label}`}>
      <span>Mostrando {showAll ? total : 25} de {total} {label}</span>
      <button type="button" className={!showAll ? 'active' : ''} onClick={() => change(false)}>Primeros 25</button>
      <button type="button" className={showAll ? 'active' : ''} onClick={() => change(true)}>Ver todos</button>
    </div>
  );
}

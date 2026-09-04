import type { CommentRecord } from '../../types';

interface CommentFiltersProps {
  search: string;
  sentiment: 'all' | CommentRecord['sentiment'];
  category: 'all' | CommentRecord['category'];
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onSentimentChange: (value: 'all' | CommentRecord['sentiment']) => void;
  onCategoryChange: (value: 'all' | CommentRecord['category']) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

const sentimentOptions: Array<'all' | CommentRecord['sentiment']> = ['all', 'Positivo', 'Neutral', 'Negativo'];
const categoryOptions: Array<'all' | CommentRecord['category']> = ['all', 'Soporte', 'Ventas', 'Reclamo', 'Consulta', 'Felicitación'];

export function CommentFilters({
  search,
  sentiment,
  category,
  dateFrom,
  dateTo,
  onSearchChange,
  onSentimentChange,
  onCategoryChange,
  onDateFromChange,
  onDateToChange,
}: CommentFiltersProps) {
  return (
    <div className="panel comment-filters">
      <div className="panel-header">
        <h3>FILTROS</h3>
      </div>

      <div className="filter-row">
        <label className="filter-field"><span>Buscar</span><input type="text" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar cliente o comentario" /></label>
        <label className="filter-field"><span>Desde</span><input type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} aria-label="Fecha de inicio" /></label>
        <label className="filter-field"><span>Hasta</span><input type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} aria-label="Fecha de fin" /></label>
        <label className="filter-field"><span>Estado del comentario</span><select value={sentiment} onChange={(event) => onSentimentChange(event.target.value as 'all' | CommentRecord['sentiment'])}>{sentimentOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'Todos los estados' : option}</option>)}</select></label>
        <label className="filter-field"><span>Categoría</span><select value={category} onChange={(event) => onCategoryChange(event.target.value as 'all' | CommentRecord['category'])}>{categoryOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'Todas las categorías' : option}</option>)}</select></label>
      </div>
    </div>
  );
}

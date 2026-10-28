import { FORMATS, FORMAT_LABELS } from '../lib/model.js';

const uniq = (xs) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));

export default function Filters({ films, filters, setFilters, hasLetterboxd }) {
  const set = (patch) => setFilters({ ...filters, ...patch });
  const genres = uniq(films.flatMap((f) => f.genres || []));
  const countries = uniq(films.flatMap((f) => f.countries || []));
  const decades = [...new Set(films.filter((f) => f.year).map((f) => Math.floor(f.year / 10) * 10))].sort();
  const toggleFormat = (fm) => {
    const formats = filters.formats.includes(fm) ? filters.formats.filter((x) => x !== fm) : [...filters.formats, fm];
    set({ formats });
  };

  return (
    <div className="toolbar">
      <div className="chips">
        {FORMATS.map((fm) => (
          <button key={fm} className={`chip ${filters.formats.includes(fm) ? 'active' : ''}`} onClick={() => toggleFormat(fm)}>
            {FORMAT_LABELS[fm]}
          </button>
        ))}
      </div>
      {hasLetterboxd && (
        <select value={filters.seen ?? ''} onChange={(e) => set({ seen: e.target.value === '' ? null : e.target.value === 'true' })}>
          <option value="">Vu ou pas</option>
          <option value="true">Vus</option>
          <option value="false">Pas vus</option>
        </select>
      )}
      <select value={filters.genres[0] || ''} onChange={(e) => set({ genres: e.target.value ? [e.target.value] : [] })}>
        <option value="">Tous genres</option>
        {genres.map((g) => <option key={g}>{g}</option>)}
      </select>
      <select value={filters.countries[0] || ''} onChange={(e) => set({ countries: e.target.value ? [e.target.value] : [] })}>
        <option value="">Tous pays</option>
        {countries.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select value={filters.decade ?? ''} onChange={(e) => set({ decade: e.target.value ? Number(e.target.value) : null })}>
        <option value="">Toutes décennies</option>
        {decades.map((d) => <option key={d} value={d}>{d}s</option>)}
      </select>
      {hasLetterboxd && (
        <select value={filters.minRating ?? ''} onChange={(e) => set({ minRating: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Toutes notes</option>
          {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1].map((r) => <option key={r} value={r}>≥ {r}★</option>)}
        </select>
      )}
    </div>
  );
}

export const NO_FILTERS = { query: '', formats: [], seen: null, genres: [], countries: [], decade: null, minRating: null };

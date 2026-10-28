import { useMemo, useState } from 'react';
import { ownedFilms, filterFilms, sortFilms, lbIndex } from '../lib/views.js';
import Filters, { NO_FILTERS } from './Filters.jsx';
import FilmGrid from './FilmGrid.jsx';
import FilmTable from './FilmTable.jsx';
import { Stars } from './format.jsx';

const SORTS = [
  ['shelf', 'Étagère (réalisateur, année)'],
  ['title', 'Titre'],
  ['year', 'Année'],
  ['rating', 'Ma note Letterboxd'],
  ['added', "Date d'ajout"],
  ['runtime', 'Durée'],
];

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(key) || initial; } catch { return initial; }
  });
  const set = (v) => {
    setValue(v);
    try { localStorage.setItem(key, v); } catch { /* stockage indisponible */ }
  };
  return [value, set];
}

export default function OwnedView({ state, openFilm, onAdd }) {
  const [mode, setMode] = usePersisted('owned.mode', 'grid');
  const [sort, setSort] = usePersisted('owned.sort', 'shelf');
  const [filters, setFilters] = useState(NO_FILTERS);
  const all = useMemo(() => ownedFilms(state), [state]);
  const lb = useMemo(() => lbIndex(state), [state]);
  const films = useMemo(() => sortFilms(filterFilms(all, state, filters), state, sort), [all, state, filters, sort]);
  const hasLetterboxd = Boolean(state.letterboxd.importedAt);

  return (
    <>
      <div className="view-header">
        <h1>Possédé</h1>
        <span className="subtitle">{films.length === all.length ? `${all.length} films` : `${films.length} / ${all.length} films`}</span>
        <span className="spacer" />
        <button className="btn primary" onClick={() => onAdd('possede')}>+ Ajouter un film</button>
      </div>
      <div className="toolbar">
        <input type="search" placeholder="Rechercher titre ou réalisateur…" value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <div className="seg">
          <button className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')}>Affiches</button>
          <button className={mode === 'table' ? 'active' : ''} onClick={() => setMode('table')}>Tableau</button>
        </div>
        {filters !== NO_FILTERS && <button className="btn ghost" onClick={() => setFilters(NO_FILTERS)}>Réinitialiser</button>}
      </div>
      <Filters films={all} filters={filters} setFilters={setFilters} hasLetterboxd={hasLetterboxd} />

      {all.length === 0 ? (
        <div className="empty">
          <p>Ta collection est vide.</p>
          <p>Ajoute un film, ou importe ton export Letterboxd pour pré-remplir depuis ta liste « Steelbook &amp; Blu-Ray ».</p>
        </div>
      ) : films.length === 0 ? (
        <div className="empty">Aucun film ne correspond aux filtres.</div>
      ) : mode === 'grid' ? (
        <FilmGrid films={films} grouped={sort === 'shelf'} openFilm={openFilm}
          metaOf={(f) => (lb.get(f.tmdbId)?.rating != null ? <> · <Stars rating={lb.get(f.tmdbId).rating} /></> : null)} />
      ) : (
        <FilmTable films={films} state={state} lb={lb} grouped={sort === 'shelf'} openFilm={openFilm} />
      )}
    </>
  );
}

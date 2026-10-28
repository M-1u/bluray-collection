import { useState } from 'react';
import { errorMessage } from '../state.js';

const thumb = (p) => (p ? `https://image.tmdb.org/t/p/w92${p}` : null);

// Choix manuel de la correspondance TMDB d'un film Letterboxd.
// value : tmdbId choisi, null = ignoré, undefined = pas encore décidé.
export default function MatchPicker({ item, value, onChange }) {
  const [candidates, setCandidates] = useState(item.candidates);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  const search = async (e) => {
    e.preventDefault();
    try {
      setCandidates((await window.api.tmdbSearch(query.trim())).slice(0, 8));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="edition">
      <div className="row">
        <strong>{item.lb.name}</strong><span className="muted">{item.lb.year}</span>
        <span className="spacer" />
        {value === null && <span className="muted small-text">ignoré</span>}
        <button className={`btn small ${value === null ? 'primary' : ''}`} onClick={() => onChange(null)}>Ignorer</button>
      </div>
      <div className="search-results">
        {candidates.map((r) => (
          <button key={r.id} className={`search-result ${value === r.id ? 'selected' : ''}`} onClick={() => onChange(r.id)}>
            {thumb(r.poster_path) ? <img src={thumb(r.poster_path)} alt="" /> : <div className="thumb" />}
            <div>
              <div>{r.original_title}{r.title !== r.original_title && <span className="muted"> [{r.title}]</span>}</div>
              <div className="muted small-text">{r.release_date?.slice(0, 4) || '—'}</div>
            </div>
          </button>
        ))}
        {candidates.length === 0 && <span className="muted small-text">Aucun résultat TMDB pour ce titre.</span>}
      </div>
      <form className="row" onSubmit={search}>
        <input type="search" placeholder="Chercher un autre titre…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1 }} />
        <button className="btn small" disabled={!query.trim()}>Chercher</button>
      </form>
      {error && <span className="error small-text">{error}</span>}
    </div>
  );
}

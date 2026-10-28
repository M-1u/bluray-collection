import { useState } from 'react';
import { addFilm, addEdition } from '../lib/model.js';
import { errorMessage } from '../state.js';
import EditionForm from './EditionForm.jsx';

const thumb = (p) => (p ? `https://image.tmdb.org/t/p/w92${p}` : null);

export default function AddFilm({ state, update, defaultState, onClose, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [edition, setEdition] = useState({
    state: defaultState,
    format: defaultState === 'custom' ? 'Custom' : 'Blu-ray',
    customStatus: defaultState === 'custom' ? 'a_creer' : null,
    note: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const noKey = !state.settings.tmdbApiKey;

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const m = query.trim().match(/^(.*?)\s+\(?((?:19|20)\d\d)\)?$/); // « Titre 1980 » → filtre par année
    setBusy(true); setError(null);
    try {
      setResults(await window.api.tmdbSearch(m ? m[1] : query.trim(), m ? m[2] : undefined));
      setSelected(null);
      setSearched(true);
      setSearched(true);
      setSearched(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const exists = state.films[selected.id];
      const film = exists ? null : await window.api.tmdbDetails(selected.id);
      update((s) => addEdition(film ? addFilm(s, film) : s, { tmdbId: selected.id, ...edition }));
      onAdded(selected.id);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal">
        <div className="row" style={{ marginBottom: 12 }}>
          <h1>Ajouter un film</h1><span className="spacer" />
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>
        {noKey ? (
          <p className="error">Renseigne ta clé API TMDB dans les Réglages pour ajouter des films.</p>
        ) : (
          <form className="row" onSubmit={search}>
            <input type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre du film (ajoute l'année pour affiner : « Suspiria 1977 »)" style={{ flex: 1 }} />
            <button className="btn" disabled={busy}>Rechercher</button>
          </form>
        )}
        {error && <p className="error">{error}</p>}

        <div className="search-results">
          {results.map((r) => (
            <button key={r.id} className={`search-result ${selected?.id === r.id ? 'selected' : ''}`} onClick={() => setSelected(r)}>
              {thumb(r.poster_path) ? <img src={thumb(r.poster_path)} alt="" /> : <div className="thumb" />}
              <div>
                <div>{r.original_title}{r.title !== r.original_title && <span className="muted"> [{r.title}]</span>}</div>
                <div className="muted small-text">{r.release_date?.slice(0, 4) || '—'}{state.films[r.id] ? ' · déjà dans ta collection' : ''}</div>
              </div>
            </button>
          ))}
          {!busy && searched && results.length === 0 && <p className="muted small-text">Aucun résultat TMDB.</p>}
        </div>

        {selected && (
          <div className="section">
            <h3>Édition</h3>
            <EditionForm value={edition} onChange={setEdition} />
            <div className="row">
              <button className="btn primary" disabled={busy} onClick={submit}>
                {state.films[selected.id] ? 'Ajouter cette édition' : 'Ajouter le film'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import { advanceCustom, CUSTOM_STATUS_LABELS } from '../lib/model.js';
import { customEditions } from '../lib/views.js';
import { displayTitle } from '../lib/titles.js';
import Poster from './Poster.jsx';

const NEXT_LABEL = { a_creer: 'Pochette créée →', creee: 'Imprimée →', imprimee_attente_boitier: 'Terminée ✓' };

export default function CustomView({ state, update, openFilm, onAdd }) {
  const groups = customEditions(state);
  const total = Object.values(groups).flat().length;
  return (
    <>
      <div className="view-header">
        <h1>Custom</h1>
        <span className="subtitle">{total} en cours</span>
        <span className="spacer" />
        <button className="btn primary" onClick={() => onAdd('custom')}>+ Nouvelle custom</button>
      </div>
      <div className="board">
        {Object.entries(groups).map(([status, items]) => (
          <section key={status} className="column">
            <div className="column-head"><h3>{CUSTOM_STATUS_LABELS[status]}</h3><span className="muted">{items.length}</span></div>
            {items.map(({ edition, film }) => (
              <div key={edition.id} className="mini-card">
                <Poster film={film} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="title" onClick={() => openFilm(film.tmdbId)}>{displayTitle(film)}</div>
                  <div className="muted small-text">{film.year}{edition.note ? ` · ${edition.note}` : ''}</div>
                  <div><button className="btn small" onClick={() => update((s) => advanceCustom(s, edition.id))}>{NEXT_LABEL[status]}</button></div>
                </div>
              </div>
            ))}
            {items.length === 0 && <span className="muted small-text">Rien ici.</span>}
          </section>
        ))}
      </div>
    </>
  );
}

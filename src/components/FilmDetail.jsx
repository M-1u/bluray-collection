import { useState } from 'react';
import { addEdition, updateEdition, deleteEdition, setSortKeyOverride, STATE_LABELS, CUSTOM_STATUS_LABELS } from '../lib/model.js';
import { editionsOf, lbFor } from '../lib/views.js';
import { displayTitle } from '../lib/titles.js';
import { sortKey } from '../lib/sortKey.js';
import Poster from './Poster.jsx';
import EditionForm from './EditionForm.jsx';
import { Stars, FormatBadge, directorNames } from './format.jsx';

function Edition({ edition, update }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(edition);
  if (editing) {
    return (
      <div className="edition">
        <EditionForm value={draft} onChange={setDraft} />
        <div className="row">
          <button className="btn primary small" onClick={() => {
            const { format, state, customStatus, note } = draft;
            update((s) => updateEdition(s, edition.id, { format, state, customStatus, note }));
            setEditing(false);
          }}>Enregistrer</button>
          <button className="btn small" onClick={() => { setDraft(edition); setEditing(false); }}>Annuler</button>
        </div>
      </div>
    );
  }
  return (
    <div className="edition">
      <div className="row">
        <FormatBadge format={edition.format} />
        <span>{STATE_LABELS[edition.state]}</span>
        {edition.state === 'custom' && <span className="muted">· {CUSTOM_STATUS_LABELS[edition.customStatus]}</span>}
        <span className="spacer" />
        <button className="btn small" onClick={() => { setDraft(edition); setEditing(true); }}>Modifier</button>
        <button className="btn small danger" onClick={() => {
          if (confirm('Supprimer cette édition ?')) update((s) => deleteEdition(s, edition.id));
        }}>Supprimer</button>
      </div>
      {edition.note && <div className="muted small-text">{edition.note}</div>}
    </div>
  );
}

export default function FilmDetail({ state, update, tmdbId, onClose }) {
  const film = state.films[tmdbId];
  const editions = editionsOf(state, tmdbId);
  const lb = lbFor(state, tmdbId);
  const [newEdition, setNewEdition] = useState(null);
  const [keyDraft, setKeyDraft] = useState(film.sortKeyOverride || '');

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="spacer" />
          <button className="btn ghost" onClick={onClose}>Fermer ✕</button>
        </div>
        <div className="detail-head">
          <Poster film={film} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1>{displayTitle(film)}</h1>
            <div className="muted">{film.year} · {directorNames(film) || 'Réalisateur inconnu'}</div>
            <dl className="kv">
              {film.runtime ? <><dt>Durée</dt><dd>{film.runtime} min</dd></> : null}
              {film.genres?.length ? <><dt>Genres</dt><dd>{film.genres.join(', ')}</dd></> : null}
              {film.countries?.length ? <><dt>Pays</dt><dd>{film.countries.join(', ')}</dd></> : null}
            </dl>
          </div>
        </div>
        {film.overview && <p className="muted" style={{ lineHeight: 1.5 }}>{film.overview}</p>}

        <div className="section">
          <div className="row"><h3>Éditions</h3><span className="spacer" />
            {!newEdition && (
              <button className="btn small" onClick={() => setNewEdition({ state: 'possede', format: 'Blu-ray', note: '' })}>
                + Ajouter une édition
              </button>
            )}
          </div>
          {editions.map((e) => <Edition key={e.id} edition={e} update={update} />)}
          {newEdition && (
            <div className="edition">
              <EditionForm value={newEdition} onChange={setNewEdition} />
              <div className="row">
                <button className="btn primary small" onClick={() => {
                  update((s) => addEdition(s, { tmdbId, ...newEdition }));
                  setNewEdition(null);
                }}>Ajouter</button>
                <button className="btn small" onClick={() => setNewEdition(null)}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        <div className="section">
          <h3>Letterboxd</h3>
          {lb ? (
            <>
              <dl className="kv">
                <dt>Vu</dt><dd>{lb.watched ? `Oui · ${lb.watchCount} visionnage${lb.watchCount > 1 ? 's' : ''}` : 'Non'}</dd>
                <dt>Ma note</dt><dd><Stars rating={lb.rating} /></dd>
                {lb.liked && <><dt>Like</dt><dd>♥</dd></>}
                {lb.inWatchlist && <><dt>Watchlist</dt><dd>Oui</dd></>}
                {lb.tags?.length ? <><dt>Tags</dt><dd>{lb.tags.join(', ')}</dd></> : null}
              </dl>
              {lb.reviews.map((r, i) => (
                <div key={i} className="review"><div className="muted small-text">{r.date}</div>{r.text}</div>
              ))}
            </>
          ) : (
            <p className="muted small-text">Aucune donnée Letterboxd liée à ce film.</p>
          )}
        </div>

        <div className="section">
          <h3>Rangement</h3>
          <div className="row">
            <input type="text" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={sortKey({ ...film, sortKeyOverride: null })} style={{ flex: 1 }} />
            <button className="btn small" onClick={() => update((s) => setSortKeyOverride(s, tmdbId, keyDraft.trim()))}>
              Appliquer
            </button>
          </div>
          <span className="muted small-text">Clé actuelle : {sortKey(film)} · vide = automatique (nom du 1er réalisateur)</span>
        </div>
      </aside>
    </>
  );
}

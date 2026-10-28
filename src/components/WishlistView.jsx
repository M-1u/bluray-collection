import { markOwned } from '../lib/model.js';
import { wishlist } from '../lib/views.js';
import { displayTitle } from '../lib/titles.js';
import { FormatBadge, directorNames } from './format.jsx';

export default function WishlistView({ state, update, openFilm, onAdd }) {
  const items = wishlist(state);
  return (
    <>
      <div className="view-header">
        <h1>À acheter</h1>
        <span className="subtitle">{items.length} envies</span>
        <span className="spacer" />
        <button className="btn primary" onClick={() => onAdd('a_acheter')}>+ Ajouter une envie</button>
      </div>
      {items.length === 0 ? (
        <div className="empty">Aucune envie pour l'instant.</div>
      ) : (
        <table>
          <thead><tr><th>Titre</th><th>Année</th><th>Réalisateur</th><th>Format</th><th>Note</th><th /></tr></thead>
          <tbody>
            {items.map(({ edition, film }) => (
              <tr key={edition.id} className="film-row" onClick={() => openFilm(film.tmdbId)}>
                <td>{displayTitle(film)}</td>
                <td>{film.year}</td>
                <td className="muted">{directorNames(film)}</td>
                <td><FormatBadge format={edition.format} /></td>
                <td className="muted">{edition.note}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn small primary" onClick={(e) => { e.stopPropagation(); update((s) => markOwned(s, edition.id)); }}>
                    Je l'ai
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

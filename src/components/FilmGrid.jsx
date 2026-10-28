import { displayTitle } from '../lib/titles.js';
import Poster from './Poster.jsx';

export const firstDirector = (f) => f.directors?.[0]?.name || 'Réalisateur inconnu';
export const groupLabel = (f) => f.sortKeyOverride || firstDirector(f);

// Regroupe les films consécutifs de même réalisateur (liste déjà triée).
export function groupConsecutive(films) {
  const groups = [];
  for (const f of films) {
    const label = groupLabel(f);
    if (groups.at(-1)?.label === label) groups.at(-1).films.push(f);
    else groups.push({ label, films: [f] });
  }
  return groups;
}

function Card({ film, openFilm, metaOf }) {
  return (
    <div className="card" onClick={() => openFilm(film.tmdbId)}>
      <Poster film={film} />
      <div className="title">{displayTitle(film)}</div>
      <div className="meta">{film.year}{metaOf ? metaOf(film) : null}</div>
    </div>
  );
}

export default function FilmGrid({ films, grouped, openFilm, metaOf }) {
  if (!grouped) {
    return <div className="grid">{films.map((f) => <Card key={f.tmdbId} film={f} openFilm={openFilm} metaOf={metaOf} />)}</div>;
  }
  // Étagère : un intercalaire par réalisateur, les groupes s'enchaînent côte à côte.
  return (
    <div className="shelf">
      {groupConsecutive(films).map((g) => (
        <section key={g.label} className="shelf-group">
          <div className="shelf-label" title={g.label}>{g.label}</div>
          <div className="shelf-cards">
            {g.films.map((f) => <Card key={f.tmdbId} film={f} openFilm={openFilm} metaOf={metaOf} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

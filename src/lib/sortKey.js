import { normalize } from './text.js';
import { displayTitle } from './titles.js';

// Clé de rangement : override manuel, sinon « nom, prénom » du 1er réalisateur crédité.
export function sortKey(film) {
  if (film.sortKeyOverride) return normalize(film.sortKeyOverride);
  const first = film.directors?.[0]?.name;
  if (!first) return '~';
  const parts = normalize(first).split(' ');
  const last = parts.pop();
  return parts.length ? `${last}, ${parts.join(' ')}` : last;
}

export function compareFilms(a, b) {
  return (
    sortKey(a).localeCompare(sortKey(b)) ||
    (a.year || 0) - (b.year || 0) ||
    displayTitle(a).localeCompare(displayTitle(b))
  );
}

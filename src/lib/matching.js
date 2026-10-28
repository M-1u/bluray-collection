import { normalize } from './text.js';

// Correspondance Letterboxd → TMDB : automatique seulement si un résultat
// unique a le même titre (traduit ou original) et la même année.
export function pickMatch(lbFilm, results) {
  if (!results.length) return { status: 'none', candidates: [] };
  const name = normalize(lbFilm.name);
  const exact = results.filter(
    (r) =>
      (normalize(r.title) === name || normalize(r.original_title) === name) &&
      String(r.release_date || '').slice(0, 4) === String(lbFilm.year),
  );
  const candidates = results.slice(0, 5);
  if (exact.length === 1) return { status: 'auto', tmdbId: exact[0].id, candidates };
  return { status: 'ambiguous', candidates };
}

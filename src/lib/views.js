// Vues en lecture seule sur l'état : catégories, filtres, tris.
import { CUSTOM_STATUSES, isOwned } from './model.js';
import { compareFilms } from './sortKey.js';
import { displayTitle } from './titles.js';
import { normalize } from './text.js';

const withFilm = (state) => (edition) => ({ edition, film: state.films[edition.tmdbId] });

export function ownedFilms(state) {
  const ids = new Set(state.editions.filter(isOwned).map((e) => e.tmdbId));
  return [...ids].map((id) => state.films[id]).filter(Boolean).sort(compareFilms);
}

export function customEditions(state) {
  const groups = Object.fromEntries(CUSTOM_STATUSES.slice(0, -1).map((s) => [s, []]));
  for (const e of state.editions) {
    if (e.state === 'custom' && groups[e.customStatus]) groups[e.customStatus].push(withFilm(state)(e));
  }
  for (const list of Object.values(groups)) list.sort((a, b) => compareFilms(a.film, b.film));
  return groups;
}

export function wishlist(state) {
  return state.editions
    .filter((e) => e.state === 'a_acheter')
    .map(withFilm(state))
    .sort((a, b) => compareFilms(a.film, b.film));
}

export function editionsOf(state, tmdbId) {
  return state.editions.filter((e) => e.tmdbId === tmdbId);
}

export function lbFor(state, tmdbId) {
  for (const [key, id] of Object.entries(state.matches)) {
    if (id === tmdbId && state.letterboxd.films[key]) return state.letterboxd.films[key];
  }
  return null;
}

// Index tmdbId → fiche Letterboxd, pour éviter un parcours de matches par film.
export function lbIndex(state) {
  const index = new Map();
  for (const [key, id] of Object.entries(state.matches)) {
    if (id != null && state.letterboxd.films[key]) index.set(id, state.letterboxd.films[key]);
  }
  return index;
}

export function filterFilms(films, state, { query, formats, seen, genres, countries, decade, minRating } = {}) {
  const lb = lbIndex(state);
  const q = normalize(query);
  return films.filter((f) => {
    if (q) {
      const hay = normalize([f.originalTitle, f.frenchTitle, ...(f.directors || []).map((d) => d.name)].join(' '));
      if (!hay.includes(q)) return false;
    }
    if (formats?.length) {
      const owned = state.editions.filter((e) => e.tmdbId === f.tmdbId && isOwned(e)).map((e) => e.format);
      if (!owned.some((fm) => formats.includes(fm))) return false;
    }
    const entry = lb.get(f.tmdbId);
    if (seen != null && Boolean(entry?.watched) !== seen) return false;
    if (genres?.length && !(f.genres || []).some((g) => genres.includes(g))) return false;
    if (countries?.length && !(f.countries || []).some((c) => countries.includes(c))) return false;
    if (decade != null && Math.floor((f.year || 0) / 10) * 10 !== decade) return false;
    if (minRating != null && !(entry?.rating >= minRating)) return false;
    return true;
  });
}

export function sortFilms(films, state, by = 'shelf') {
  const lb = lbIndex(state);
  const comparators = {
    shelf: compareFilms,
    title: (a, b) => displayTitle(a).localeCompare(displayTitle(b)),
    year: (a, b) => (a.year || 0) - (b.year || 0) || compareFilms(a, b),
    rating: (a, b) => (lb.get(b.tmdbId)?.rating ?? -1) - (lb.get(a.tmdbId)?.rating ?? -1) || compareFilms(a, b),
    added: (a, b) => String(b.addedAt).localeCompare(String(a.addedAt)),
    runtime: (a, b) => (a.runtime || 0) - (b.runtime || 0) || compareFilms(a, b),
  };
  return [...films].sort(comparators[by] || compareFilms);
}

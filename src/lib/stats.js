// Statistiques de la collection, croisées avec les données Letterboxd.
import { CUSTOM_STATUSES, isOwned } from './model.js';
import { ownedFilms, lbIndex } from './views.js';

const round2 = (n) => Math.round(n * 100) / 100;
const avg = (xs) => (xs.length ? round2(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function countBy(items, keysOf, limit) {
  const counts = new Map();
  for (const item of items) for (const k of keysOf(item)) counts.set(k, (counts.get(k) || 0) + 1);
  const list = [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return limit ? list.slice(0, limit) : list;
}

export function computeStats(state) {
  const films = ownedFilms(state);
  const owned = state.editions.filter(isOwned);
  const lb = lbIndex(state);
  const ownedIds = new Set(films.map((f) => f.tmdbId));
  const entries = films.map((f) => ({ film: f, lb: lb.get(f.tmdbId) }));

  const unseenFilms = entries.filter((e) => !e.lb?.watched).map((e) => e.film);
  const ownedRatings = entries.map((e) => e.lb?.rating).filter((r) => r != null);
  const allLb = Object.values(state.letterboxd.films);

  const matchedOwned = new Set(
    Object.entries(state.matches).filter(([, id]) => ownedIds.has(id)).map(([key]) => key),
  );

  return {
    filmCount: films.length,
    editionCount: owned.length,
    byFormat: countBy(owned, (e) => [e.format]).map(({ name, count }) => ({ format: name, count })),
    topDirectors: countBy(films, (f) => (f.directors?.[0] ? [f.directors[0].name] : []), 10),
    topGenres: countBy(films, (f) => f.genres || [], 10),
    topCountries: countBy(films, (f) => f.countries || [], 10),
    byDecade: countBy(films.filter((f) => f.year), (f) => [String(Math.floor(f.year / 10) * 10)])
      .map(({ name, count }) => ({ decade: Number(name), count }))
      .sort((a, b) => a.decade - b.decade),
    customProgress: CUSTOM_STATUSES.map((status) => ({
      status,
      count: state.editions.filter((e) => e.state === 'custom' && e.customStatus === status).length,
    })),
    seen: { seen: films.length - unseenFilms.length, unseen: unseenFilms.length, unseenFilms },
    avgRatingOwned: avg(ownedRatings),
    avgRatingAll: avg(allLb.map((f) => f.rating).filter((r) => r != null)),
    ratingHistogram: Array.from({ length: 10 }, (_, i) => {
      const rating = (i + 1) / 2;
      return { rating, count: ownedRatings.filter((r) => r === rating).length };
    }),
    topRatedNotOwned: allLb
      .filter((f) => f.rating >= 4.5 && !matchedOwned.has(f.key))
      .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)),
    watchlistOwned: entries.filter((e) => e.lb?.inWatchlist).map((e) => e.film),
    mostRewatched: entries
      .filter((e) => e.lb?.watchCount >= 2)
      .map((e) => ({ film: e.film, watchCount: e.lb.watchCount }))
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 10),
  };
}

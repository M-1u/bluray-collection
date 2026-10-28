// poster://img/<tmdbId>?p=<poster_path TMDB> → { id, posterPath } ; null si invalide.
function parsePosterUrl(raw) {
  const url = new URL(raw);
  const m = url.pathname.match(/^\/(\d+)$/);
  if (url.hostname !== 'img' || !m) return null;
  return { id: m[1], posterPath: url.searchParams.get('p') };
}

module.exports = { parsePosterUrl };

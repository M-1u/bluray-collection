// URL d'affiche servie par le protocole poster:// du process principal.
// L'id va dans le chemin : en hôte, Chromium lirait un nombre comme une IPv4.
export function posterUrl(film) {
  if (!film) return null;
  return `poster://img/${film.tmdbId}${film.posterPath ? `?p=${encodeURIComponent(film.posterPath)}` : ''}`;
}

import { normalize } from './text.js';
import { displayTitle } from './titles.js';

// Noms de famille coréens et chinois que TMDB écrit en tête (« Bong Joon-ho », « Zhang Yimou »).
const EAST_ASIAN_SURNAMES = new Set([
  'bong', 'park', 'wong', 'hong', 'yeon', 'ryoo', 'na', 'jia', 'zhang', 'chen', 'tsui', 'hou',
  'tsai', 'wang', 'liu', 'lou', 'bi', 'diao', 'zhao', 'huang', 'jiang', 'feng', 'xie', 'tian',
]);
// Aussi des prénoms occidentaux (Lee Daniels, Kim Nguyen) : pris comme nom de famille
// seulement devant un prénom à tiret (Lee Chang-dong, Kim Ki-duk).
const AMBIGUOUS_SURNAMES = new Set(['lee', 'kim', 'choi', 'shin', 'yoon', 'jang', 'lim', 'chan', 'ho', 'song', 'lam', 'lau', 'leung', 'cheung', 'yuen', 'tsang']);

// Particules qui font partie du nom de famille (De Palma, Van Sant, del Toro, von Trier).
const PARTICLES = new Set(['de', 'del', 'della', 'di', 'da', 'du', 'van', 'von', 'der', 'den', 'ter', 'le', 'la', 'dos', 'das']);

function familyNameFirst([first, given]) {
  return EAST_ASIAN_SURNAMES.has(first) || (AMBIGUOUS_SURNAMES.has(first) && given.includes('-'));
}

// Hong Kong : « Ringo Lam Ling-tung » = prénom occidental, nom de famille, prénom chinois.
function hongKongName([, family, chinese]) {
  return (EAST_ASIAN_SURNAMES.has(family) || AMBIGUOUS_SURNAMES.has(family)) && chinese.includes('-');
}

// Clé de rangement : override manuel, sinon « nom, prénom » du 1er réalisateur crédité.
export function sortKey(film) {
  if (film.sortKeyOverride) return normalize(film.sortKeyOverride);
  const first = film.directors?.[0]?.name;
  if (!first) return '~';
  const parts = normalize(first).split(' ');
  if (parts.length === 2 && familyNameFirst(parts)) return `${parts[0]}, ${parts[1]}`;
  if (parts.length === 3 && hongKongName(parts)) return `${parts[1]}, ${parts[0]} ${parts[2]}`;
  const particle = parts.findIndex((p, i) => i > 0 && i < parts.length - 1 && PARTICLES.has(p));
  if (particle !== -1) return `${parts.slice(particle).join(' ')}, ${parts.slice(0, particle).join(' ')}`;
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

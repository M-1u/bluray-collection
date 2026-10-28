// État de la collection et mutations immuables.

export const FORMATS = ['1080p', '4K', 'DVD', 'Blu-ray', 'Steelbook', 'Custom', 'a_preciser'];
export const STATES = ['possede', 'a_acheter', 'custom'];
export const CUSTOM_STATUSES = ['a_creer', 'creee', 'imprimee_attente_boitier', 'terminee'];

export const FORMAT_LABELS = {
  '1080p': '1080p', '4K': '4K', DVD: 'DVD', 'Blu-ray': 'Blu-ray',
  Steelbook: 'Steelbook', Custom: 'Custom', a_preciser: 'À préciser',
};
export const STATE_LABELS = { possede: 'Possédé', a_acheter: 'À acheter', custom: 'Custom' };
export const CUSTOM_STATUS_LABELS = {
  a_creer: 'Pochette à créer', creee: 'Pochette créée',
  imprimee_attente_boitier: 'Imprimée, attend boîtier', terminee: 'Terminée',
};

export function emptyState() {
  return {
    version: 1,
    films: {},
    editions: [],
    letterboxd: { films: {}, importedAt: null },
    matches: {},
    settings: { tmdbApiKey: '' },
    seededFromLetterboxdList: false,
  };
}

const now = () => new Date().toISOString();

export function addFilm(state, film) {
  if (state.films[film.tmdbId]) return state;
  return {
    ...state,
    films: { ...state.films, [film.tmdbId]: { sortKeyOverride: null, addedAt: now(), ...film } },
  };
}

export function addEdition(state, { tmdbId, format, state: edState, customStatus, note }) {
  const edition = {
    id: crypto.randomUUID(),
    tmdbId,
    format,
    state: edState,
    customStatus: edState === 'custom' ? customStatus || 'a_creer' : null,
    note: note || '',
    createdAt: now(),
    updatedAt: now(),
  };
  return { ...state, editions: [...state.editions, edition] };
}

export function updateEdition(state, id, patch) {
  return {
    ...state,
    editions: state.editions.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: now() } : e)),
  };
}

export function deleteEdition(state, id) {
  const edition = state.editions.find((e) => e.id === id);
  if (!edition) return state;
  const editions = state.editions.filter((e) => e.id !== id);
  if (editions.some((e) => e.tmdbId === edition.tmdbId)) return { ...state, editions };
  const films = { ...state.films };
  delete films[edition.tmdbId];
  return { ...state, editions, films };
}

export function advanceCustom(state, id) {
  const edition = state.editions.find((e) => e.id === id);
  if (!edition || edition.state !== 'custom') return state;
  const i = CUSTOM_STATUSES.indexOf(edition.customStatus);
  if (i === CUSTOM_STATUSES.length - 1) return state;
  return updateEdition(state, id, { customStatus: CUSTOM_STATUSES[i + 1] });
}

export function markOwned(state, id) {
  return updateEdition(state, id, { state: 'possede', customStatus: null });
}

export function setSortKeyOverride(state, tmdbId, value) {
  const film = state.films[tmdbId];
  if (!film) return state;
  return { ...state, films: { ...state.films, [tmdbId]: { ...film, sortKeyOverride: value || null } } };
}

export function isOwned(edition) {
  return edition.state === 'possede' || (edition.state === 'custom' && edition.customStatus === 'terminee');
}

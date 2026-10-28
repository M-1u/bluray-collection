// Pré-remplissage unique de [POSSÉDÉ] depuis la liste Letterboxd « Steelbook & Blu-Ray ».
import { addEdition, addFilm } from './model.js';

const SEED_FORMATS = { 'blu-ray': 'Blu-ray', bluray: 'Blu-ray', steelbook: 'Steelbook', '4k': '4K', dvd: 'DVD' };

export function seedFormat(description) {
  return SEED_FORMATS[String(description || '').trim().toLowerCase()] || 'a_preciser';
}

export function seedFromList(state, items) {
  if (state.seededFromLetterboxdList) throw new Error('Pré-remplissage déjà effectué');
  let s = state;
  const matches = { ...s.matches };
  for (const { lbKey, tmdbId, film, description } of items) {
    s = addFilm(s, film);
    s = addEdition(s, { tmdbId, format: seedFormat(description), state: 'possede' });
    matches[lbKey] = tmdbId;
  }
  return { ...s, matches, seededFromLetterboxdList: true };
}

// Pré-remplissage unique de [POSSÉDÉ] depuis la liste Letterboxd « Steelbook & Blu-Ray ».
import { addEdition, addFilm, isOwned } from './model.js';

const SEED_FORMATS = { 'blu-ray': 'Blu-ray', bluray: 'Blu-ray', steelbook: 'Steelbook', '4k': '4K', dvd: 'DVD' };

export function seedFormat(description) {
  return SEED_FORMATS[String(description || '').trim().toLowerCase()] || 'a_preciser';
}

export function seedFromList(state, items) {
  // Appelé dans un updater React : ne lève pas, renvoie l'état tel quel.
  if (state.seededFromLetterboxdList) return state;
  let s = state;
  const matches = { ...s.matches };
  for (const { lbKey, tmdbId, film, description } of items) {
    matches[lbKey] = tmdbId;
    if (s.editions.some((e) => e.tmdbId === tmdbId && isOwned(e))) continue; // pas de doublon
    s = addFilm(s, film);
    s = addEdition(s, { tmdbId, format: seedFormat(description), state: 'possede' });
  }
  return { ...s, matches, seededFromLetterboxdList: true };
}

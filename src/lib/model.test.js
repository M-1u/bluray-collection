import { describe, it, expect } from 'vitest';
import {
  emptyState, addFilm, addEdition, updateEdition, deleteEdition, advanceCustom,
  markOwned, setSortKeyOverride, isOwned,
} from './model.js';

const shining = { tmdbId: 694, originalTitle: 'The Shining', frenchTitle: 'Shining', year: 1980,
  directors: [{ id: 240, name: 'Stanley Kubrick' }], genres: ['Horreur'], countries: ['United Kingdom'], runtime: 144 };

describe('model', () => {
  it('addFilm deux fois = un seul film', () => {
    const s = addFilm(addFilm(emptyState(), shining), { ...shining, originalTitle: 'autre' });
    expect(Object.keys(s.films)).toEqual(['694']);
    expect(s.films[694].originalTitle).toBe('The Shining');
    expect(s.films[694].addedAt).toBeTruthy();
  });

  it('addEdition custom démarre à a_creer', () => {
    const s = addEdition(addFilm(emptyState(), shining), { tmdbId: 694, format: 'Custom', state: 'custom' });
    expect(s.editions[0]).toMatchObject({ format: 'Custom', state: 'custom', customStatus: 'a_creer', note: '' });
    expect(s.editions[0].id).toBeTruthy();
  });

  it('advanceCustom suit les statuts puis reste sur terminee', () => {
    let s = addEdition(addFilm(emptyState(), shining), { tmdbId: 694, format: 'Custom', state: 'custom' });
    const id = s.editions[0].id;
    const seen = [];
    for (let i = 0; i < 4; i++) { s = advanceCustom(s, id); seen.push(s.editions[0].customStatus); }
    expect(seen).toEqual(['creee', 'imprimee_attente_boitier', 'terminee', 'terminee']);
    expect(isOwned(s.editions[0])).toBe(true);
  });

  it('markOwned passe une envie en possédée', () => {
    let s = addEdition(addFilm(emptyState(), shining), { tmdbId: 694, format: '4K', state: 'a_acheter' });
    s = markOwned(s, s.editions[0].id);
    expect(s.editions[0].state).toBe('possede');
  });

  it('updateEdition applique le patch', () => {
    let s = addEdition(addFilm(emptyState(), shining), { tmdbId: 694, format: 'a_preciser', state: 'possede' });
    s = updateEdition(s, s.editions[0].id, { format: 'Steelbook', note: 'Fnac' });
    expect(s.editions[0]).toMatchObject({ format: 'Steelbook', note: 'Fnac' });
  });

  it('deleteEdition de la dernière édition retire le film', () => {
    let s = addFilm(emptyState(), shining);
    s = addEdition(s, { tmdbId: 694, format: 'Blu-ray', state: 'possede' });
    s = addEdition(s, { tmdbId: 694, format: '4K', state: 'a_acheter' });
    s = deleteEdition(s, s.editions[0].id);
    expect(s.films[694]).toBeTruthy();
    s = deleteEdition(s, s.editions[0].id);
    expect(s.films[694]).toBeUndefined();
  });

  it('setSortKeyOverride pose et retire la clé', () => {
    let s = setSortKeyOverride(addFilm(emptyState(), shining), 694, 'Kubrick, S');
    expect(s.films[694].sortKeyOverride).toBe('Kubrick, S');
    s = setSortKeyOverride(s, 694, '');
    expect(s.films[694].sortKeyOverride).toBeNull();
  });

  it('les fonctions ne mutent pas l\'état', () => {
    const s0 = addFilm(emptyState(), shining);
    const snap = JSON.stringify(s0);
    addEdition(s0, { tmdbId: 694, format: 'DVD', state: 'possede' });
    expect(JSON.stringify(s0)).toBe(snap);
  });
});

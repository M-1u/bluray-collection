import { describe, it, expect } from 'vitest';
import { isNonLatin, directorsToRomanize, renameDirectors } from './directorNames.js';

const state = {
  films: {
    1: { tmdbId: 1, directors: [{ id: 55785, name: '岩井俊二' }] },
    2: { tmdbId: 2, directors: [{ id: 31073, name: '深作健太' }, { id: 31074, name: 'Kinji Fukasaku' }] },
    3: { tmdbId: 3, directors: [{ id: 55785, name: '岩井俊二' }] },
    4: { tmdbId: 4, directors: [{ id: 9, name: 'Éric Rohmer' }] },
  },
};

describe('directorNames', () => {
  it('reconnaît les noms hors alphabet latin, pas les accents', () => {
    expect(isNonLatin('豊田利晃')).toBe(true);
    expect(isNonLatin('Кэнта')).toBe(true);
    expect(isNonLatin('Éric Rohmer')).toBe(false);
    expect(isNonLatin('Pedro Almodóvar')).toBe(false);
  });
  it('liste chaque réalisateur à renommer une seule fois', () => {
    expect(directorsToRomanize(state)).toEqual([55785, 31073]);
  });
  it('renomme dans tous les films et laisse les autres intacts', () => {
    const next = renameDirectors(state, { 55785: 'Shunji Iwai', 31073: 'Kenta Fukasaku' });
    expect(next.films[1].directors[0].name).toBe('Shunji Iwai');
    expect(next.films[3].directors[0].name).toBe('Shunji Iwai');
    expect(next.films[2].directors.map((d) => d.name)).toEqual(['Kenta Fukasaku', 'Kinji Fukasaku']);
    expect(next.films[4]).toBe(state.films[4]);
  });
  it('ne change rien sans nom latin utilisable', () => {
    expect(renameDirectors(state, { 55785: '岩井俊二' })).toBe(state);
    expect(renameDirectors(state, {})).toBe(state);
  });
});

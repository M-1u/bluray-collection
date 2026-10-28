import { describe, it, expect } from 'vitest';
import { pickMatch } from './matching.js';
import { buildImportPreview, applyImport } from './importFlow.js';
import { seedFormat, seedFromList } from './seed.js';
import { emptyState, addFilm, addEdition } from './model.js';

const lb = (name, year, extra = {}) => ({ key: `${name.toLowerCase()}|${year}`, name, year, rating: null, ...extra });
const r = (id, title, original_title, release_date) => ({ id, title, original_title, release_date });

describe('pickMatch', () => {
  it('exact : un seul résultat même titre même année', () => {
    const m = pickMatch(lb('Parasite', 2019), [r(496243, 'Parasite', '기생충', '2019-05-30'), r(9, 'Parasite', 'Parasite', '1982-03-12')]);
    expect(m).toMatchObject({ status: 'auto', tmdbId: 496243 });
  });
  it('remake : même titre autre année → pas auto', () => {
    const m = pickMatch(lb('Suspiria', 2018), [r(1, 'Suspiria', 'Suspiria', '1977-02-01')]);
    expect(m.status).toBe('ambiguous');
    expect(m.candidates).toHaveLength(1);
  });
  it('titre original seul correspond', () => {
    const m = pickMatch(lb('Le Mépris', 1963), [r(266, 'Le Mépris', 'Le Mépris', '1963-12-20')]);
    expect(m).toMatchObject({ status: 'auto', tmdbId: 266 });
  });
  it('titre traduit (anglais Letterboxd ≠ titre fr TMDB) mais original identique', () => {
    const m = pickMatch(lb('Hiroshima Mon Amour', 1959), [r(5000, 'Hiroshima mon amour', 'Hiroshima mon amour', '1959-06-10')]);
    expect(m.status).toBe('auto');
  });
  it('deux résultats identiques → ambigu', () => {
    const m = pickMatch(lb('Dune', 2021), [r(1, 'Dune', 'Dune', '2021-09-15'), r(2, 'Dune', 'Dune', '2021-01-01')]);
    expect(m.status).toBe('ambiguous');
  });
  it('aucun résultat', () => {
    expect(pickMatch(lb('Zzz', 2000), [])).toEqual({ status: 'none', candidates: [] });
  });
  it('limite à 5 candidats', () => {
    const many = Array.from({ length: 8 }, (_, i) => r(i, `X${i}`, `X${i}`, '2000-01-01'));
    expect(pickMatch(lb('Y', 2000), many).candidates).toHaveLength(5);
  });
});

function stateWithCollection() {
  let s = addFilm(emptyState(), { tmdbId: 694, originalTitle: 'The Shining', frenchTitle: 'Shining', year: 1980, directors: [] });
  s = addEdition(s, { tmdbId: 694, format: 'Steelbook', state: 'possede' });
  s.matches = { 'the shining|1980': 694 };
  s.letterboxd = {
    importedAt: '2026-10-23T00:00:00.000Z',
    films: {
      'the shining|1980': lb('The Shining', 1980, { rating: 3 }),
      'old film|1950': lb('Old Film', 1950),
    },
  };
  return s;
}
const newData = () => ({
  films: {
    'the shining|1980': lb('The Shining', 1980, { rating: 3.5 }),
    'parasite|2019': lb('Parasite', 2019, { rating: 4 }),
  },
  lists: {},
});

describe('import', () => {
  it('buildImportPreview détecte nouveaux, notes modifiées, retirés, à faire correspondre', () => {
    const p = buildImportPreview(stateWithCollection(), newData());
    expect(p.newFilms.map((f) => f.name)).toEqual(['Parasite']);
    expect(p.changedRatings).toEqual([{ lb: newData().films['the shining|1980'], before: 3, after: 3.5 }]);
    expect(p.removed).toEqual(['old film|1950']);
    expect(p.toMatch.map((f) => f.name)).toEqual(['Parasite']);
  });

  it('applyImport replaces letterboxd only', () => {
    const before = stateWithCollection();
    const after = applyImport(before, newData(), { 'parasite|2019': 496243 });
    expect(after.letterboxd.films).toEqual(newData().films);
    expect(after.letterboxd.films['old film|1950']).toBeUndefined();
    expect(after.letterboxd.importedAt).not.toBe(before.letterboxd.importedAt);
    expect(after.films).toEqual(before.films);
    expect(after.editions).toEqual(before.editions);
    expect(after.matches).toEqual({ 'the shining|1980': 694, 'parasite|2019': 496243 });
  });

  it('applyImport garde null pour un film ignoré', () => {
    const after = applyImport(stateWithCollection(), newData(), { 'parasite|2019': null });
    expect(after.matches['parasite|2019']).toBeNull();
    expect(buildImportPreview(after, newData()).toMatch).toEqual([]);
  });
});

describe('seed', () => {
  it('seedFormat', () => {
    expect(seedFormat('Blu-Ray')).toBe('Blu-ray');
    expect(seedFormat('steelbook')).toBe('Steelbook');
    expect(seedFormat('4K')).toBe('4K');
    expect(seedFormat('DVD')).toBe('DVD');
    expect(seedFormat('')).toBe('a_preciser');
    expect(seedFormat('autre chose')).toBe('a_preciser');
  });

  const film = { tmdbId: 1, originalTitle: 'Twin Peaks', frenchTitle: '', year: 1992, directors: [] };
  it('seedFromList ajoute films, éditions possédées et correspondances', () => {
    const s = seedFromList(emptyState(), [{ lbKey: 'twin peaks|1992', tmdbId: 1, film, description: 'Steelbook' }]);
    expect(s.films[1]).toBeTruthy();
    expect(s.editions).toHaveLength(1);
    expect(s.editions[0]).toMatchObject({ tmdbId: 1, format: 'Steelbook', state: 'possede' });
    expect(s.matches['twin peaks|1992']).toBe(1);
    expect(s.seededFromLetterboxdList).toBe(true);
  });
  it('seedFromList deux fois ne refait rien', () => {
    const s = seedFromList(emptyState(), [{ lbKey: 'twin peaks|1992', tmdbId: 1, film, description: '' }]);
    expect(seedFromList(s, [{ lbKey: 'x|2000', tmdbId: 2, film: { ...film, tmdbId: 2 }, description: '' }])).toBe(s);
  });
});

import { describe, it, expect } from 'vitest';
import { runPool, matchFilms, seedCandidates } from './importRunner.js';
import { emptyState } from './model.js';

const lb = (name, year) => ({ key: `${name.toLowerCase()}|${year}`, name, year });

describe('runPool', () => {
  it('traite tout, en respectant la concurrence, et rapporte la progression', async () => {
    let active = 0, maxActive = 0;
    const progress = [];
    const out = await runPool([1, 2, 3, 4, 5], async (x) => {
      active++; maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return x * 2;
    }, 2, (done, total) => progress.push(`${done}/${total}`));
    expect(out).toEqual([2, 4, 6, 8, 10]);
    expect(maxActive).toBe(2);
    expect(progress.at(-1)).toBe('5/5');
  });

  it('propage la première erreur', async () => {
    await expect(runPool([1, 2], async () => { throw new Error('Clé TMDB invalide'); }, 2)).rejects.toThrow('Clé TMDB invalide');
  });
});

describe('matchFilms', () => {
  it('sépare auto et à valider', async () => {
    const search = async (name, year) => (name === 'Parasite'
      ? [{ id: 496243, title: 'Parasite', original_title: '기생충', release_date: '2019-05-30' }]
      : [{ id: 1, title: 'Autre', original_title: 'Autre', release_date: `${year}-01-01` }]);
    const res = await matchFilms([lb('Parasite', 2019), lb('Inconnu', 2000)], search);
    expect(res.auto).toEqual({ 'parasite|2019': 496243 });
    expect(res.pending.map((p) => [p.lb.name, p.status])).toEqual([['Inconnu', 'ambiguous']]);
  });

  it('cherche par nom et année', async () => {
    const calls = [];
    await matchFilms([lb('Dune', 2021)], async (...args) => { calls.push(args); return []; });
    expect(calls).toEqual([['Dune', 2021]]);
  });
});

describe('seedCandidates', () => {
  const list = { name: 'Steelbook & Blu-Ray', items: [
    { position: 1, name: 'Twin Peaks: Fire Walk with Me', year: 1992, description: 'Steelbook' },
    { position: 2, name: 'La La Land', year: 2016, description: 'Blu-Ray' },
  ] };

  it('null si pas de liste ou déjà fait', () => {
    expect(seedCandidates(emptyState(), {})).toBeNull();
    expect(seedCandidates({ ...emptyState(), seededFromLetterboxdList: true }, { 'steelbook-blu-ray': list })).toBeNull();
  });

  it('renvoie les éléments de la liste avec leur clé', () => {
    const items = seedCandidates(emptyState(), { 'steelbook-blu-ray': list });
    expect(items).toEqual([
      { lbKey: 'twin peaks: fire walk with me|1992', name: 'Twin Peaks: Fire Walk with Me', year: 1992, description: 'Steelbook' },
      { lbKey: 'la la land|2016', name: 'La La Land', year: 2016, description: 'Blu-Ray' },
    ]);
  });
});

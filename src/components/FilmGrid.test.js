import { describe, it, expect } from 'vitest';
import { groupConsecutive } from './FilmGrid.jsx';

const f = (id, name, o) => ({ tmdbId: id, directors: [{ name }], sortKeyOverride: o });

describe('groupConsecutive', () => {
  it('regroupe les films consécutifs du même réalisateur', () => {
    const g = groupConsecutive([f(1, 'A'), f(2, 'A'), f(3, 'B'), f(4, 'C', 'Wong, Kar-wai')]);
    expect(g.map((x) => [x.label, x.films.map((y) => y.tmdbId)])).toEqual([
      ['A', [1, 2]], ['B', [3]], ['Wong, Kar-wai', [4]],
    ]);
  });
});

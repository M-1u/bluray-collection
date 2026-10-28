import { describe, it, expect } from 'vitest';
import { computeStats } from './stats.js';
import { emptyState, addFilm, addEdition } from './model.js';

const film = (tmdbId, year, director, extra = {}) => ({
  tmdbId, originalTitle: `F${tmdbId}`, frenchTitle: '', year, directors: [{ name: director }],
  genres: ['Drame'], countries: ['France'], runtime: 100, ...extra,
});
const lbf = (key, extra) => ({ key, name: key, watched: true, rating: null, watchCount: 1, inWatchlist: false, ...extra });

function fixture() {
  let s = emptyState();
  s = addFilm(s, film(1, 1971, 'Stanley Kubrick'));
  s = addFilm(s, film(2, 1980, 'Stanley Kubrick', { genres: ['Horreur'] }));
  s = addFilm(s, film(3, 1986, 'Éric Rohmer'));
  s = addFilm(s, film(4, 2001, 'Joel Coen'));
  s = addFilm(s, film(5, 2010, 'X Y'));
  s = addEdition(s, { tmdbId: 1, format: 'Blu-ray', state: 'possede' });
  s = addEdition(s, { tmdbId: 2, format: 'Steelbook', state: 'possede' });
  s = addEdition(s, { tmdbId: 2, format: '4K', state: 'possede' });
  s = addEdition(s, { tmdbId: 3, format: 'DVD', state: 'possede' });
  s = addEdition(s, { tmdbId: 4, format: '4K', state: 'a_acheter' });
  s = addEdition(s, { tmdbId: 5, format: 'Custom', state: 'custom', customStatus: 'creee' });
  s.letterboxd.films = {
    a: lbf('a', { rating: 3, watchCount: 3 }),
    b: lbf('b', { rating: 4.5, inWatchlist: false }),
    c: lbf('c', { watched: false, inWatchlist: true }),
    top: lbf('top', { rating: 5 }),
    other: lbf('other', { rating: 1 }),
  };
  s.matches = { a: 1, b: 2, c: 3 };
  return s;
}

describe('computeStats', () => {
  it('compteurs de la collection', () => {
    const st = computeStats(fixture());
    expect(st.filmCount).toBe(3);
    expect(st.editionCount).toBe(4);
    expect(st.byFormat).toHaveLength(4);
    expect(st.byFormat).toEqual(expect.arrayContaining([
      { format: 'Blu-ray', count: 1 }, { format: 'Steelbook', count: 1 }, { format: 'DVD', count: 1 },
    ]));
    expect(st.byFormat.find((f) => f.format === '4K').count).toBe(1); // l'envie 4K n'est pas comptée
    expect(st.topDirectors[0]).toEqual({ name: 'Stanley Kubrick', count: 2 });
    expect(st.byDecade).toEqual([{ decade: 1970, count: 1 }, { decade: 1980, count: 2 }]);
    expect(st.customProgress).toEqual([
      { status: 'a_creer', count: 0 }, { status: 'creee', count: 1 },
      { status: 'imprimee_attente_boitier', count: 0 }, { status: 'terminee', count: 0 },
    ]);
  });

  it('croisement Letterboxd', () => {
    const st = computeStats(fixture());
    expect(st.seen.seen).toBe(2);
    expect(st.seen.unseen).toBe(1);
    expect(st.seen.unseenFilms.map((f) => f.tmdbId)).toEqual([3]);
    expect(st.avgRatingOwned).toBe(3.75);
    expect(st.avgRatingAll).toBe(3.38);
    expect(st.ratingHistogram).toHaveLength(10);
    expect(st.ratingHistogram.reduce((a, h) => a + h.count, 0)).toBe(2);
    expect(st.ratingHistogram.find((h) => h.rating === 4.5).count).toBe(1);
    expect(st.topRatedNotOwned.map((f) => f.key)).toEqual(['top']);
    expect(st.watchlistOwned.map((f) => f.tmdbId)).toEqual([3]);
    expect(st.mostRewatched).toEqual([{ film: expect.objectContaining({ tmdbId: 1 }), watchCount: 3 }]);
  });

  it('état vide', () => {
    const st = computeStats(emptyState());
    expect(st.filmCount).toBe(0);
    expect(st.editionCount).toBe(0);
    expect(st.seen).toEqual({ seen: 0, unseen: 0, unseenFilms: [] });
    expect(st.avgRatingOwned).toBeNull();
    expect(st.avgRatingAll).toBeNull();
    expect(st.topRatedNotOwned).toEqual([]);
  });
});

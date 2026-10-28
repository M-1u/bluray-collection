import { describe, it, expect } from 'vitest';
import { emptyState, addFilm, addEdition, advanceCustom } from './model.js';
import { ownedFilms, customEditions, wishlist, lbFor, filterFilms, sortFilms } from './views.js';

const film = (tmdbId, originalTitle, frenchTitle, year, director, extra = {}) => ({
  tmdbId, originalTitle, frenchTitle, year, directors: [{ name: director }],
  genres: [], countries: [], runtime: 100, ...extra,
});

function fixture() {
  let s = emptyState();
  s = addFilm(s, film(694, 'The Shining', 'Shining', 1980, 'Stanley Kubrick', { genres: ['Horreur'] }));
  s = addFilm(s, film(185, 'A Clockwork Orange', 'Orange mécanique', 1971, 'Stanley Kubrick'));
  s = addFilm(s, film(1, 'Le Rayon vert', 'Le Rayon vert', 1986, 'Éric Rohmer', { countries: ['France'] }));
  s = addFilm(s, film(2, 'Custom Film', '', 2000, 'Joel Coen'));
  s = addEdition(s, { tmdbId: 694, format: 'Blu-ray', state: 'possede' });
  s = addEdition(s, { tmdbId: 694, format: '4K', state: 'a_acheter' });
  s = addEdition(s, { tmdbId: 185, format: 'Steelbook', state: 'possede' });
  s = addEdition(s, { tmdbId: 1, format: 'DVD', state: 'possede' });
  s = addEdition(s, { tmdbId: 2, format: 'Custom', state: 'custom' });
  s.letterboxd.films = {
    'the shining|1980': { key: 'the shining|1980', watched: true, rating: 4.5 },
    'le rayon vert|1986': { key: 'le rayon vert|1986', watched: true, rating: 3 },
  };
  s.matches = { 'the shining|1980': 694, 'le rayon vert|1986': 1, 'x|1': null };
  return s;
}

describe('views', () => {
  it('un film possédé en Blu-ray et à acheter en 4K est dans les deux vues', () => {
    const s = fixture();
    expect(ownedFilms(s).map((f) => f.tmdbId)).toContain(694);
    expect(wishlist(s).map((w) => w.film.tmdbId)).toEqual([694]);
  });

  it('ownedFilms trié par étagère', () => {
    expect(ownedFilms(fixture()).map((f) => f.tmdbId)).toEqual([185, 694, 1]);
  });

  it('une custom terminée passe de CUSTOM à POSSÉDÉ', () => {
    let s = fixture();
    expect(customEditions(s).a_creer).toHaveLength(1);
    expect(ownedFilms(s).map((f) => f.tmdbId)).not.toContain(2);
    const id = s.editions.find((e) => e.tmdbId === 2).id;
    for (let i = 0; i < 3; i++) s = advanceCustom(s, id);
    expect(ownedFilms(s).map((f) => f.tmdbId)).toContain(2);
    expect(Object.values(customEditions(s)).flat()).toHaveLength(0);
    expect(Object.keys(customEditions(s))).toEqual(['a_creer', 'creee', 'imprimee_attente_boitier']);
  });

  it('lbFor retrouve la fiche Letterboxd via matches', () => {
    const s = fixture();
    expect(lbFor(s, 694).rating).toBe(4.5);
    expect(lbFor(s, 185)).toBeNull();
  });

  it('filterFilms query sur titre français et réalisateur sans accents', () => {
    const s = fixture();
    const films = ownedFilms(s);
    expect(filterFilms(films, s, { query: 'orange meca' }).map((f) => f.tmdbId)).toEqual([185]);
    expect(filterFilms(films, s, { query: 'rohmer' }).map((f) => f.tmdbId)).toEqual([1]);
    expect(filterFilms(films, s, { query: 'eric' }).map((f) => f.tmdbId)).toEqual([1]);
  });

  it('filterFilms seen:false renvoie les possédés non vus', () => {
    const s = fixture();
    expect(filterFilms(ownedFilms(s), s, { seen: false }).map((f) => f.tmdbId)).toEqual([185]);
    expect(filterFilms(ownedFilms(s), s, { seen: true }).map((f) => f.tmdbId)).toEqual([694, 1]);
  });

  it('filterFilms par format possédé, genre, pays, décennie, note', () => {
    const s = fixture();
    const films = ownedFilms(s);
    const ids = (o) => filterFilms(films, s, o).map((f) => f.tmdbId);
    expect(ids({ formats: ['Steelbook', 'DVD'] })).toEqual([185, 1]);
    expect(ids({ formats: ['4K'] })).toEqual([]); // 4K seulement à acheter
    expect(ids({ genres: ['Horreur'] })).toEqual([694]);
    expect(ids({ countries: ['France'] })).toEqual([1]);
    expect(ids({ decade: 1970 })).toEqual([185]);
    expect(ids({ minRating: 4 })).toEqual([694]);
  });

  it('sortFilms', () => {
    const s = fixture();
    const films = ownedFilms(s);
    const ids = (by) => sortFilms(films, s, by).map((f) => f.tmdbId);
    expect(ids('year')).toEqual([185, 694, 1]);
    expect(ids('title')).toEqual([185, 1, 694]);
    expect(ids('rating')).toEqual([694, 1, 185]); // non notés en fin
    expect(ids('shelf')).toEqual([185, 694, 1]);
  });
});

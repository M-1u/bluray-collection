import { describe, it, expect } from 'vitest';
import { lbKey, parseLetterboxdFiles, parseListCsv } from './letterboxd.js';

// Extraits inventés, au format exact de l'export Letterboxd.
const watched = `Date,Name,Year,Letterboxd URI
2023-05-05,Parasite,2019,https://boxd.it/hTha
2024-01-02,"Crazy, Stupid, Love.",2011,https://boxd.it/1ErW
2024-02-01,Suspiria,1977,https://boxd.it/2a46
2024-02-02,Suspiria,2018,https://boxd.it/flkA
`;
const ratings = `Date,Name,Year,Letterboxd URI,Rating
2025-07-04,Parasite,2019,https://boxd.it/hTha,3.5
2024-02-01,Suspiria,1977,https://boxd.it/2a46,4
2024-02-02,Suspiria,2018,https://boxd.it/flkA,2.5
`;
const diary = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2023-05-05,Parasite,2019,https://boxd.it/4tMUCT,3.5,,"bluray, cinema",2023-05-05
2025-07-04,Parasite,2019,https://boxd.it/9fOEPv,3.5,Yes,4k,2025-07-03
`;
const reviews = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review,Tags,Watched Date
2024-01-02,"Crazy, Stupid, Love.",2011,https://boxd.it/cW5Paz,2,,"Première ligne, avec virgule
deuxième ligne ""citée""",,2024-01-01
2025-07-04,Parasite,2019,https://boxd.it/9fOEPv,3.5,Yes,Toujours bien,,2025-07-03
`;
const watchlist = `Date,Name,Year,Letterboxd URI
2026-10-22,Eat Drink Man Woman,1994,https://boxd.it/1Wem
2026-10-22,Parasite,2019,https://boxd.it/hTha
`;
const likes = `Date,Name,Year,Letterboxd URI
2024-03-24,Parasite,2019,https://boxd.it/hTha
`;
const steelbookList = `Letterboxd list export v7
Date,Name,Tags,URL,Description
2025-07-22,Steelbook & Blu-Ray,allstats,https://boxd.it/LxEaq,

Position,Name,Year,URL,Description
1,Twin Peaks: Fire Walk with Me,1992,https://boxd.it/27Qw,Steelbook
2,"The Gangster, the Cop, the Devil",2019,https://boxd.it/XGY,Blu-Ray
3,The Silence of the Lambs,1991,https://boxd.it/2aHW,
`;

const all = {
  'watched.csv': watched,
  'ratings.csv': ratings,
  'diary.csv': diary,
  'reviews.csv': reviews,
  'watchlist.csv': watchlist,
  'likes/films.csv': likes,
  'lists/steelbook-blu-ray.csv': steelbookList,
};

describe('parseLetterboxdFiles', () => {
  it('parses quoted commas and multiline reviews', () => {
    const { films } = parseLetterboxdFiles(all);
    const f = films[lbKey('Crazy, Stupid, Love.', 2011)];
    expect(f.name).toBe('Crazy, Stupid, Love.');
    expect(f.reviews).toEqual([
      { date: '2024-01-02', text: 'Première ligne, avec virgule\ndeuxième ligne "citée"' },
    ]);
  });

  it('merges entries across files by name+year', () => {
    const { films } = parseLetterboxdFiles(all);
    const p = films[lbKey('Parasite', 2019)];
    expect(Object.values(films).filter((x) => x.name === 'Parasite')).toHaveLength(1);
    expect(p).toMatchObject({
      uri: 'https://boxd.it/hTha',
      watched: true,
      rating: 3.5,
      watchCount: 2,
      watchDates: ['2023-05-05', '2025-07-03'],
      liked: true,
      inWatchlist: true,
    });
    expect(p.reviews).toHaveLength(1);
    expect(p.tags.sort()).toEqual(['4k', 'bluray', 'cinema']);
  });

  it('keeps remakes separate', () => {
    const { films } = parseLetterboxdFiles(all);
    expect(films[lbKey('Suspiria', 1977)].rating).toBe(4);
    expect(films[lbKey('Suspiria', 2018)].rating).toBe(2.5);
  });

  it('watchlist only film is not watched', () => {
    const { films } = parseLetterboxdFiles(all);
    expect(films[lbKey('Eat Drink Man Woman', 1994)]).toMatchObject({
      watched: false, rating: null, watchCount: 0, inWatchlist: true,
    });
  });

  it('watched without diary counts one viewing', () => {
    const { films } = parseLetterboxdFiles(all);
    expect(films[lbKey('Suspiria', 1977)].watchCount).toBe(1);
  });

  it('missing optional files', () => {
    const { films, lists } = parseLetterboxdFiles({ 'watched.csv': watched });
    expect(Object.keys(films)).toHaveLength(4);
    expect(films[lbKey('Parasite', 2019)].liked).toBe(false);
    expect(lists).toEqual({});
  });

  it('missing watched.csv throws', () => {
    expect(() => parseLetterboxdFiles({ 'ratings.csv': ratings })).toThrow('Fichier manquant : watched.csv');
  });

  it('exposes lists by slug', () => {
    const { lists } = parseLetterboxdFiles(all);
    expect(lists['steelbook-blu-ray'].items).toHaveLength(3);
  });
});

describe('parseListCsv', () => {
  it('parseListCsv reads steelbook list', () => {
    const list = parseListCsv(steelbookList);
    expect(list.name).toBe('Steelbook & Blu-Ray');
    expect(list.items.map((i) => i.description)).toEqual(['Steelbook', 'Blu-Ray', '']);
    expect(list.items[1]).toEqual({
      position: 2, name: 'The Gangster, the Cop, the Devil', year: 2019, description: 'Blu-Ray',
    });
  });
});

describe('lbKey', () => {
  it('normalise le nom et garde l\'année', () => {
    expect(lbKey('Amélie ', '2001')).toBe('amelie|2001');
  });
});

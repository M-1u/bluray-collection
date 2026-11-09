import { describe, it, expect } from 'vitest';
import { sortKey, compareFilms } from './sortKey.js';

const f = (names, year, o, originalTitle = 'x') =>
  ({ directors: names.map((name) => ({ name })), year, sortKeyOverride: o, originalTitle, frenchTitle: '' });

describe('sortKey', () => {
  it('nom, prénom du réalisateur', () => {
    expect(sortKey(f(['Stanley Kubrick'], 1971))).toBe('kubrick, stanley');
  });
  it('ne prend que le 1er réalisateur', () => {
    expect(sortKey(f(['Joel Coen', 'Ethan Coen'], 1996))).toBe('coen, joel');
  });
  it('utilise la clé manuelle normalisée', () => {
    expect(sortKey(f(['Wong Kar-wai'], 2000, 'Wong, Kar-wai'))).toBe('wong, kar-wai');
  });
  it('retire les accents', () => {
    expect(sortKey(f(['Éric Rohmer'], 1986))).toBe('rohmer, eric');
  });
  it("noms d'Asie de l'Est : nom de famille en premier", () => {
    expect(sortKey(f(['Bong Joon-ho'], 2019))).toBe('bong, joon-ho');
    expect(sortKey(f(['Park Chan-wook'], 2003))).toBe('park, chan-wook');
    expect(sortKey(f(['Wong Kar-wai'], 2000))).toBe('wong, kar-wai');
    expect(sortKey(f(['Lee Chang-dong'], 2018))).toBe('lee, chang-dong');
    expect(sortKey(f(['Zhang Yimou'], 2002))).toBe('zhang, yimou');
  });
  it('garde l\'ordre occidental quand le nom est déjà « prénom nom »', () => {
    expect(sortKey(f(['Spike Lee'], 1989))).toBe('lee, spike');
    expect(sortKey(f(['Lee Daniels'], 2009))).toBe('daniels, lee');
    expect(sortKey(f(['Ang Lee'], 2000))).toBe('lee, ang');
    expect(sortKey(f(['Hirokazu Kore-eda'], 2018))).toBe('kore-eda, hirokazu');
    expect(sortKey(f(['Kim Nguyen'], 2012))).toBe('nguyen, kim');
  });
  it('place les films sans réalisateur en fin', () => {
    expect(sortKey(f([], 1990))).toBe('~');
  });
});

describe('compareFilms', () => {
  it('même réalisateur : ordre par année', () => {
    const shining = f(['Stanley Kubrick'], 1980, null, 'The Shining');
    const orange = f(['Stanley Kubrick'], 1971, null, 'A Clockwork Orange');
    expect([shining, orange].sort(compareFilms).map((x) => x.originalTitle))
      .toEqual(['A Clockwork Orange', 'The Shining']);
  });
  it('réalisateurs différents : ordre par nom', () => {
    const k = f(['Stanley Kubrick'], 1971);
    const c = f(['Joel Coen'], 1996);
    expect([k, c].sort(compareFilms)).toEqual([c, k]);
  });
});

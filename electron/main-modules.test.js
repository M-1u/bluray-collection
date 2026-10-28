import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { zipSync, strToU8 } from 'fflate';

const require = createRequire(import.meta.url);
const { createStore, resolveDataDir, CorruptDataError } = require('./store.cjs');
const { createTmdb } = require('./tmdb.cjs');
const { readZip } = require('./zip.cjs');

const tmp = () => mkdtempSync(join(tmpdir(), 'bluray-test-'));

describe('store', () => {
  it('save puis load renvoie le même état, sans .tmp résiduel', () => {
    const dir = tmp();
    const store = createStore(dir);
    expect(store.load()).toBeNull();
    store.save({ version: 1, films: { 1: { tmdbId: 1 } } });
    expect(store.load()).toEqual({ version: 1, films: { 1: { tmdbId: 1 } } });
    expect(readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('JSON invalide → CorruptDataError', () => {
    const dir = tmp();
    writeFileSync(join(dir, 'collection.json'), '{oops');
    expect(() => createStore(dir).load()).toThrow(CorruptDataError);
  });

  it('backup copie le fichier dans backups/ et restore le relit', () => {
    const dir = tmp();
    const store = createStore(dir);
    expect(store.backup()).toBeNull();
    store.save({ version: 1, n: 1 });
    const file = store.backup();
    expect(existsSync(file)).toBe(true);
    expect(store.listBackups()).toHaveLength(1);
    store.save({ version: 1, n: 2 });
    expect(store.restore(store.listBackups()[0])).toEqual({ version: 1, n: 1 });
    expect(store.load()).toEqual({ version: 1, n: 1 });
  });

  it('posterPath dans posters/', () => {
    const dir = tmp();
    expect(createStore(dir).posterPath(694)).toBe(join(dir, 'posters', '694.jpg'));
  });

  it('resolveDataDir respecte BLURAY_DATA_DIR', () => {
    const app = { getPath: () => '/default' };
    const old = process.env.BLURAY_DATA_DIR;
    process.env.BLURAY_DATA_DIR = '/custom';
    expect(resolveDataDir(app)).toBe('/custom');
    delete process.env.BLURAY_DATA_DIR;
    expect(resolveDataDir(app)).toBe('/default');
    if (old) process.env.BLURAY_DATA_DIR = old;
  });
});

const fakeFetch = (routes, calls = []) => async (url, opts = {}) => {
  calls.push({ url: String(url), opts });
  const u = new URL(url);
  const body = routes[u.pathname];
  if (body === 401) return { ok: false, status: 401, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => body, arrayBuffer: async () => new ArrayBuffer(3) };
};

const details = {
  id: 694, title: 'Shining', original_title: 'The Shining', release_date: '1980-05-23', runtime: 144,
  overview: 'Jack…', poster_path: '/p.jpg',
  genres: [{ id: 27, name: 'Horreur' }],
  production_countries: [{ iso_3166_1: 'GB', name: 'Royaume-Uni' }],
  credits: { crew: [
    { id: 1, name: 'Someone', job: 'Producer' },
    { id: 240, name: 'Stanley Kubrick', job: 'Director' },
    { id: 9, name: 'Co Director', job: 'Director' },
  ] },
};

describe('tmdb', () => {
  it('details mappe titres, réalisateurs dans l\'ordre, pays, genres', async () => {
    const calls = [];
    const tmdb = createTmdb({ apiKey: 'a'.repeat(32), fetch: fakeFetch({ '/3/movie/694': details }, calls) });
    expect(await tmdb.details(694)).toEqual({
      tmdbId: 694, originalTitle: 'The Shining', frenchTitle: 'Shining', year: 1980,
      directors: [{ id: 240, name: 'Stanley Kubrick' }, { id: 9, name: 'Co Director' }],
      genres: ['Horreur'], countries: ['Royaume-Uni'], runtime: 144, overview: 'Jack…', posterPath: '/p.jpg',
    });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('api_key')).toBe('a'.repeat(32));
    expect(url.searchParams.get('language')).toBe('fr-FR');
    expect(url.searchParams.get('append_to_response')).toBe('credits');
  });

  it('jeton v4 → en-tête Bearer', async () => {
    const calls = [];
    const tmdb = createTmdb({ apiKey: 'eyJ.long.token', fetch: fakeFetch({ '/3/search/movie': { results: [] } }, calls) });
    await tmdb.search('Dune', 2021);
    expect(calls[0].opts.headers.Authorization).toBe('Bearer eyJ.long.token');
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('api_key')).toBeNull();
    expect(url.searchParams.get('query')).toBe('Dune');
    expect(url.searchParams.get('year')).toBe('2021');
  });

  it('401 → « Clé TMDB invalide »', async () => {
    const tmdb = createTmdb({ apiKey: 'x'.repeat(32), fetch: fakeFetch({ '/3/search/movie': 401 }) });
    await expect(tmdb.search('a')).rejects.toThrow('Clé TMDB invalide');
  });

  it('erreur réseau → « TMDB injoignable »', async () => {
    const tmdb = createTmdb({ apiKey: 'x'.repeat(32), fetch: async () => { throw new TypeError('fetch failed'); } });
    await expect(tmdb.search('a')).rejects.toThrow('TMDB injoignable');
  });

  it('sans clé → message clair', async () => {
    const tmdb = createTmdb({ apiKey: '', fetch: fakeFetch({}) });
    await expect(tmdb.search('a')).rejects.toThrow('Clé TMDB manquante');
  });
});

describe('readZip', () => {
  it('renvoie les .csv avec leur chemin', () => {
    const buf = zipSync({
      'watched.csv': strToU8('Date,Name\n'),
      'lists/x.csv': strToU8('é'),
      'readme.txt': strToU8('nope'),
    });
    expect(readZip(Buffer.from(buf))).toEqual({ 'watched.csv': 'Date,Name\n', 'lists/x.csv': 'é' });
  });
});

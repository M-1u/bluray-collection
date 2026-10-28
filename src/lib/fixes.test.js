import { describe, it, expect, vi } from 'vitest';
import { parseListCsv } from './letterboxd.js';
import { seedFromList } from './seed.js';
import { emptyState, addFilm, addEdition } from './model.js';
import { posterUrl } from './poster.js';
import { createSaver } from './saver.js';

describe('I1 poster URL', () => {
  it('met l\'id dans le chemin (pas dans l\'hôte, lu comme IPv4)', () => {
    expect(posterUrl({ tmdbId: 267, posterPath: '/a b.jpg' })).toBe('poster://img/267?p=%2Fa%20b.jpg');
    expect(posterUrl({ tmdbId: 2817, posterPath: null })).toBe('poster://img/2817');
  });
});

describe('I2 parseListCsv', () => {
  it('description de liste sur plusieurs lignes', () => {
    const text = `Letterboxd list export v7
Date,Name,Tags,URL,Description
2025-07-22,Steelbook & Blu-Ray,allstats,https://boxd.it/LxEaq,"Ligne 1
Ligne 2, avec virgule
Ligne 3"

Position,Name,Year,URL,Description
1,Twin Peaks: Fire Walk with Me,1992,https://boxd.it/27Qw,Steelbook
2,La La Land,2016,https://boxd.it/a5fa,
`;
    const list = parseListCsv(text);
    expect(list.name).toBe('Steelbook & Blu-Ray');
    expect(list.items).toEqual([
      { position: 1, name: 'Twin Peaks: Fire Walk with Me', year: 1992, description: 'Steelbook' },
      { position: 2, name: 'La La Land', year: 2016, description: '' },
    ]);
  });
});

describe('I3/I4 seedFromList', () => {
  const film = { tmdbId: 1, originalTitle: 'Alien', frenchTitle: '', year: 1979, directors: [] };
  it('pas de 2e édition possédée pour un film déjà possédé', () => {
    let s = addEdition(addFilm(emptyState(), film), { tmdbId: 1, format: '4K', state: 'possede' });
    s = seedFromList(s, [{ lbKey: 'alien|1979', tmdbId: 1, film, description: 'Blu-Ray' }]);
    expect(s.editions).toHaveLength(1);
    expect(s.matches['alien|1979']).toBe(1);
  });
  it('dédoublonne deux entrées de liste vers le même film', () => {
    const s = seedFromList(emptyState(), [
      { lbKey: 'alien|1979', tmdbId: 1, film, description: 'Blu-Ray' },
      { lbKey: 'alien (director cut)|1979', tmdbId: 1, film, description: 'Steelbook' },
    ]);
    expect(s.editions).toHaveLength(1);
  });
  it('déjà pré-rempli : renvoie l\'état inchangé sans lever', () => {
    const s = { ...emptyState(), seededFromLetterboxdList: true };
    expect(seedFromList(s, [{ lbKey: 'alien|1979', tmdbId: 1, film, description: '' }])).toBe(s);
  });
});

describe('I5 saver', () => {
  it('garde l\'état en attente et signale l\'erreur si la sauvegarde échoue', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    let fail = true;
    const save = vi.fn(async () => { if (fail) throw new Error('EACCES'); });
    const saver = createSaver({ save, onError, delay: 300 });
    saver.schedule({ n: 1 });
    await vi.advanceTimersByTimeAsync(300);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'EACCES' }));
    expect(saver.pending()).toEqual({ n: 1 });
    fail = false;
    saver.schedule({ n: 2 });
    await vi.advanceTimersByTimeAsync(300);
    expect(saver.pending()).toBeNull();
    expect(save).toHaveBeenLastCalledWith({ n: 2 });
    vi.useRealTimers();
  });
  it('ne perd pas un état planifié pendant une sauvegarde en cours', async () => {
    vi.useFakeTimers();
    let resolve;
    const save = vi.fn(() => new Promise((r) => { resolve = r; }));
    const saver = createSaver({ save, onError: () => {}, delay: 10 });
    saver.schedule({ n: 1 });
    await vi.advanceTimersByTimeAsync(10);
    saver.schedule({ n: 2 });
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(saver.pending()).toEqual({ n: 2 });
    vi.useRealTimers();
  });
});

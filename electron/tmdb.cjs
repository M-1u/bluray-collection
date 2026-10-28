// Client TMDB minimal (v3). Accepte une clé API v3 (32 caractères) ou un jeton v4.
const fs = require('node:fs');
const path = require('node:path');

const API = 'https://api.themoviedb.org/3';
const IMAGES = 'https://image.tmdb.org/t/p/w342';

const RETRIES = 3;
const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createTmdb({ apiKey, fetch = globalThis.fetch, sleep = defaultSleep }) {
  const isV3 = (apiKey || '').length === 32;

  async function get(pathname, params = {}) {
    if (!apiKey) throw new Error('Clé TMDB manquante : renseigne-la dans les Réglages');
    const url = new URL(API + pathname);
    for (const [k, v] of Object.entries({ language: 'fr-FR', ...params })) {
      if (v != null && v !== '') url.searchParams.set(k, String(v));
    }
    const headers = { Accept: 'application/json' };
    if (isV3) url.searchParams.set('api_key', apiKey);
    else headers.Authorization = `Bearer ${apiKey}`;
    // Réessaie les erreurs réseau, 429 et 5xx (Retry-After respecté), jamais les 4xx.
    let res;
    for (let attempt = 1; ; attempt++) {
      try {
        res = await fetch(url.toString(), { headers });
      } catch {
        if (attempt >= RETRIES) throw new Error('TMDB injoignable : vérifie ta connexion');
        await sleep(1000 * attempt);
        continue;
      }
      if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
        const retryAfter = Number(res.headers?.get?.('Retry-After'));
        await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * attempt);
        continue;
      }
      break;
    }
    if (res.status === 401) throw new Error('Clé TMDB invalide');
    if (!res.ok) throw new Error(`Erreur TMDB (${res.status})`);
    return res.json();
  }

  async function search(query, year) {
    const data = await get('/search/movie', { query, year });
    return data.results || [];
  }

  async function details(id) {
    const d = await get(`/movie/${id}`, { append_to_response: 'credits' });
    return {
      tmdbId: d.id,
      originalTitle: d.original_title,
      frenchTitle: d.title,
      year: d.release_date ? Number(d.release_date.slice(0, 4)) : null,
      directors: (d.credits?.crew || []).filter((c) => c.job === 'Director').map((c) => ({ id: c.id, name: c.name })),
      genres: (d.genres || []).map((g) => g.name),
      countries: (d.production_countries || []).map((c) => c.name),
      runtime: d.runtime || null,
      overview: d.overview || '',
      posterPath: d.poster_path || null,
    };
  }

  async function downloadPoster(posterPath, dest) {
    let res;
    try {
      res = await fetch(IMAGES + posterPath);
    } catch {
      throw new Error('TMDB injoignable : vérifie ta connexion');
    }
    if (!res.ok) throw new Error(`Affiche indisponible (${res.status})`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }

  return { search, details, downloadPoster };
}

module.exports = { createTmdb };

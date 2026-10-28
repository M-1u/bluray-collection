// Orchestration de l'import : recherches TMDB en lot et candidats au pré-remplissage.
import { pickMatch } from './matching.js';
import { lbKey } from './letterboxd.js';

export const SEED_LIST_SLUG = 'steelbook-blu-ray';

// Exécute `worker` sur chaque élément avec au plus `concurrency` appels simultanés.
export async function runPool(items, worker, concurrency = 6, onProgress) {
  const results = new Array(items.length);
  let next = 0, done = 0, failed = null;
  async function lane() {
    while (next < items.length && !failed) {
      const i = next++;
      try {
        results[i] = await worker(items[i], i);
      } catch (err) {
        failed ||= err;
        return;
      }
      done++;
      onProgress?.(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
  if (failed) throw failed;
  return results;
}

export async function matchFilms(films, search, onProgress) {
  const auto = {};
  const pending = [];
  await runPool(films, async (lb) => {
    const m = pickMatch(lb, await search(lb.name, lb.year));
    if (m.status === 'auto') auto[lb.key] = m.tmdbId;
    else pending.push({ lb, status: m.status, candidates: m.candidates });
  }, 6, onProgress);
  return { auto, pending };
}

export function seedCandidates(state, lists) {
  const list = lists?.[SEED_LIST_SLUG];
  if (!list || state.seededFromLetterboxdList) return null;
  return list.items.map(({ name, year, description }) => ({ lbKey: lbKey(name, year), name, year, description }));
}

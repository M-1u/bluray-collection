import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyState } from './lib/model.js';

// Message d'erreur lisible depuis un appel IPC (retire le préfixe d'Electron).
export function errorMessage(err) {
  return String(err?.message || err).replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');
}

export function posterUrl(film) {
  if (!film) return null;
  return `poster://${film.tmdbId}${film.posterPath ? `?p=${encodeURIComponent(film.posterPath)}` : ''}`;
}

// État de l'app : chargé au démarrage, sauvegardé (différé) à chaque mise à jour.
export function useCollection() {
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const pending = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    window.api.loadState().then((res) => {
      if (res.error) setLoadError(res);
      else setState({ ...emptyState(), ...(res.state || {}) });
    });
    const flush = () => {
      if (pending.current) window.api.saveStateSync(pending.current);
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      if (next !== prev) {
        pending.current = next;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          window.api.saveState(pending.current);
          pending.current = null;
        }, 300);
      }
      return next;
    });
  }, []);

  const restore = useCallback(async (file) => {
    const restored = await window.api.restoreBackup(file);
    setLoadError(null);
    setState({ ...emptyState(), ...restored });
  }, []);

  return { state, update, loadError, restore };
}

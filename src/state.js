import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyState } from './lib/model.js';
import { createSaver } from './lib/saver.js';

// Message d'erreur lisible depuis un appel IPC (retire le préfixe d'Electron).
export function errorMessage(err) {
  return String(err?.message || err).replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');
}

export { posterUrl } from './lib/poster.js';

// État de l'app : chargé au démarrage, sauvegardé (différé) à chaque mise à jour.
export function useCollection() {
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const saver = useRef(null);
  if (!saver.current) {
    saver.current = createSaver({
      save: (s) => window.api.saveState(s),
      onError: (err) => setSaveError(err ? errorMessage(err) : null),
    });
  }

  useEffect(() => {
    window.api.loadState().then((res) => {
      if (res.error) setLoadError(res);
      else setState({ ...emptyState(), ...(res.state || {}) });
    });
    const flush = () => {
      const pending = saver.current.pending();
      if (pending) window.api.saveStateSync(pending);
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  const update = useCallback((fn) => {
    setState((prev) => {
      const next = fn(prev);
      if (next !== prev) saver.current.schedule(next);
      return next;
    });
  }, []);

  const restore = useCallback(async (file) => {
    const restored = await window.api.restoreBackup(file);
    setLoadError(null);
    setState({ ...emptyState(), ...restored });
  }, []);

  return { state, update, loadError, saveError, restore };
}

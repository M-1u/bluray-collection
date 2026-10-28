// Sauvegarde différée : regroupe les mises à jour, ne perd jamais un état non écrit.
export function createSaver({ save, onError, delay = 300 }) {
  let pending = null;
  let timer = null;

  async function run() {
    const state = pending;
    if (!state) return;
    try {
      await save(state);
      if (pending === state) pending = null; // une mise à jour plus récente reste en attente
      onError(null);
    } catch (err) {
      onError(err);
    }
  }

  return {
    schedule(state) {
      pending = state;
      clearTimeout(timer);
      timer = setTimeout(run, delay);
    },
    pending: () => pending,
  };
}

import { useEffect, useState } from 'react';
import { errorMessage } from '../state.js';

export default function Settings({ state, update }) {
  const [key, setKey] = useState(state.settings.tmdbApiKey);
  const [dir, setDir] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { window.api.dataDir().then(setDir); }, []);

  const saveKey = async () => {
    update((s) => ({ ...s, settings: { ...s.settings, tmdbApiKey: key.trim() } }));
    setMsg({ ok: true, text: 'Clé enregistrée.' });
  };

  const testKey = async () => {
    update((s) => ({ ...s, settings: { ...s.settings, tmdbApiKey: key.trim() } }));
    try {
      await window.api.saveState({ ...state, settings: { ...state.settings, tmdbApiKey: key.trim() } });
      await window.api.tmdbSearch('Parasite', 2019);
      setMsg({ ok: true, text: 'Connexion TMDB OK.' });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  };

  const run = async (fn, okText) => {
    try {
      const res = await fn();
      if (res) setMsg({ ok: true, text: okText(res) });
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) });
    }
  };

  return (
    <>
      <div className="view-header"><h1>Réglages</h1></div>
      <div className="form-grid">
        <label htmlFor="tmdb">Clé API TMDB</label>
        <div className="row">
          <input id="tmdb" type="password" value={key} onChange={(e) => setKey(e.target.value)} style={{ flex: 1 }}
            placeholder="Clé API v3 ou jeton de lecture v4" />
          <button className="btn primary" onClick={saveKey}>Enregistrer</button>
          <button className="btn" onClick={testKey} disabled={!key.trim()}>Tester</button>
        </div>
        <span />
        <span className="muted small-text">
          Gratuite sur themoviedb.org → Paramètres → API. Nécessaire pour ajouter des films et faire correspondre l'import Letterboxd.
        </span>

        <span>Dossier de données</span>
        <div className="row">
          <code className="muted small-text" style={{ flex: 1, wordBreak: 'break-all' }}>{dir}</code>
          <button className="btn" onClick={() => window.api.openDataDir()}>Ouvrir</button>
        </div>

        <span>Sauvegarde</span>
        <div className="row">
          <button className="btn" onClick={() => run(window.api.backup, (f) => `Sauvegarde créée : ${f.split(/[\\/]/).pop()}`)}>
            Créer une sauvegarde
          </button>
          <button className="btn" onClick={() => run(window.api.exportJson, (f) => `Exporté vers ${f}`)}>Exporter en JSON</button>
        </div>
      </div>
      {msg && <p className={msg.ok ? 'ok' : 'error'}>{msg.text}</p>}
    </>
  );
}

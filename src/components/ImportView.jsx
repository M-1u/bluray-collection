import { useRef, useState } from 'react';
import { parseLetterboxdFiles } from '../lib/letterboxd.js';
import { buildImportPreview, applyImport } from '../lib/importFlow.js';
import { matchFilms, runPool, seedCandidates } from '../lib/importRunner.js';
import { seedFromList } from '../lib/seed.js';
import { errorMessage } from '../state.js';
import MatchPicker from './MatchPicker.jsx';

function Progress({ label, done, total }) {
  return (
    <div className="section" style={{ maxWidth: 520 }}>
      <span>{label} — {done} / {total}</span>
      <div className="progress"><div style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
    </div>
  );
}

export default function ImportView({ state, update }) {
  const [phase, setPhase] = useState('idle'); // idle | matching | review | applying | done
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [seed, setSeed] = useState(null);
  const [doSeed, setDoSeed] = useState(true);
  const [auto, setAuto] = useState({});
  const [pending, setPending] = useState([]);
  const [choices, setChoices] = useState({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState(null);
  const noKey = !state.settings.tmdbApiKey;
  const running = useRef(false);

  const start = async () => {
    setError(null);
    let files;
    try {
      files = await window.api.pickZip();
      if (!files) return;
      const lbData = parseLetterboxdFiles(files);
      const pv = buildImportPreview(state, lbData);
      const seedItems = seedCandidates(state, lbData.lists);
      setData(lbData); setPreview(pv); setSeed(seedItems); setChoices({});

      // Films à faire correspondre : nouveaux films Letterboxd + films de la liste à pré-remplir.
      const toMatch = [...pv.toMatch];
      const seen = new Set(toMatch.map((f) => f.key));
      for (const it of seedItems || []) {
        if (!(it.lbKey in state.matches) && !seen.has(it.lbKey)) {
          seen.add(it.lbKey);
          toMatch.push({ key: it.lbKey, name: it.name, year: it.year });
        }
      }
      setPhase('matching');
      setProgress({ done: 0, total: toMatch.length });
      const res = await matchFilms(toMatch, window.api.tmdbSearch, (done, total) => setProgress({ done, total }));
      res.pending.sort((a, b) => a.lb.name.localeCompare(b.lb.name));
      setAuto(res.auto); setPending(res.pending);
      setPhase('review');
    } catch (err) {
      setError(errorMessage(err));
      setPhase('idle');
    }
  };

  const validate = async () => {
    if (running.current) return; // double-clic : une seule validation
    running.current = true;
    setPhase('applying');
    try {
      await window.api.backup();
      const decided = Object.fromEntries(Object.entries(choices).filter(([, v]) => v !== undefined));
      const newMatches = { ...auto, ...decided };
      update((s) => applyImport(s, data, newMatches));

      let seeded = 0, skipped = [];
      if (seed && doSeed) {
        const allMatches = { ...state.matches, ...newMatches };
        const ready = seed.filter((it) => allMatches[it.lbKey] != null);
        skipped = seed.filter((it) => allMatches[it.lbKey] == null);
        setProgress({ done: 0, total: ready.length });
        const items = await runPool(ready, async (it) => {
          const tmdbId = allMatches[it.lbKey];
          const film = state.films[tmdbId] || (await window.api.tmdbDetails(tmdbId));
          return { lbKey: it.lbKey, tmdbId, film, description: it.description };
        }, 6, (done, total) => setProgress({ done, total }));
        update((s) => seedFromList(s, items));
        seeded = items.length;
      }
      setSummary({
        films: Object.keys(data.films).length,
        matched: Object.values(newMatches).filter((v) => v != null).length,
        seeded,
        skipped,
      });
      setPhase('done');
    } catch (err) {
      setError(errorMessage(err));
      setPhase('review');
    } finally {
      running.current = false;
    }
  };

  const unresolved = pending.filter((p) => choices[p.lb.key] === undefined).length;

  return (
    <>
      <div className="view-header">
        <h1>Import Letterboxd</h1>
        {state.letterboxd.importedAt && (
          <span className="subtitle">Dernier import : {new Date(state.letterboxd.importedAt).toLocaleString('fr-FR')}</span>
        )}
      </div>
      {error && <p className="error">{error}</p>}

      {phase === 'idle' && (
        <div className="section" style={{ maxWidth: 640 }}>
          <p>
            Choisis le zip exporté depuis Letterboxd (Settings → Data → Export your data). Les données Letterboxd
            (vus, notes, critiques, watchlist) sont <strong>remplacées</strong> ; ta collection n'est jamais modifiée.
            Une sauvegarde est créée avant chaque import.
          </p>
          {noKey && <p className="error">Renseigne d'abord ta clé API TMDB dans les Réglages : elle sert à relier tes films Letterboxd aux fiches TMDB.</p>}
          <div><button className="btn primary" disabled={noKey} onClick={start}>Choisir le fichier zip…</button></div>
        </div>
      )}

      {phase === 'matching' && <Progress label="Recherche des films sur TMDB" {...progress} />}

      {phase === 'review' && preview && (
        <div className="section">
          <div className="tiles">
            <div className="tile"><h3>Films Letterboxd</h3><div className="value">{Object.keys(data.films).length}</div></div>
            <div className="tile"><h3>Nouveaux</h3><div className="value">{preview.newFilms.length}</div></div>
            <div className="tile"><h3>Notes modifiées</h3><div className="value">{preview.changedRatings.length}</div></div>
            <div className="tile"><h3>Retirés</h3><div className="value">{preview.removed.length}</div></div>
            <div className="tile"><h3>Reliés auto.</h3><div className="value">{Object.keys(auto).length}</div></div>
            <div className="tile"><h3>À valider</h3><div className="value">{pending.length}</div>
              <div className="hint">{unresolved} non décidés (reproposés au prochain import)</div></div>
          </div>
          {seed && (
            <label className="row">
              <input type="checkbox" checked={doSeed} onChange={(e) => setDoSeed(e.target.checked)} />
              Pré-remplir POSSÉDÉ avec ta liste « Steelbook &amp; Blu-Ray » ({seed.length} films) — une seule fois
            </label>
          )}
          <div className="row">
            <button className="btn primary" onClick={validate}>Valider l'import</button>
            <button className="btn" onClick={() => setPhase('idle')}>Annuler</button>
          </div>
          {pending.length > 0 && <h3 style={{ marginTop: 10 }}>Correspondances à valider</h3>}
          {pending.map((p) => (
            <MatchPicker key={p.lb.key} item={p} value={choices[p.lb.key]}
              onChange={(v) => setChoices((c) => ({ ...c, [p.lb.key]: v }))} />
          ))}
        </div>
      )}

      {phase === 'applying' && <Progress label="Pré-remplissage de la collection" {...progress} />}

      {phase === 'done' && summary && (
        <div className="section" style={{ maxWidth: 640 }}>
          <p className="ok">Import terminé : {summary.films} films Letterboxd, {summary.matched} nouvelles correspondances.</p>
          {summary.seeded > 0 && <p>{summary.seeded} films ajoutés à POSSÉDÉ depuis ta liste.</p>}
          {summary.skipped.length > 0 && (
            <>
              <p className="muted">Non ajoutés (pas de correspondance TMDB) — à ajouter à la main :</p>
              <div className="link-list">{summary.skipped.map((s) => <span key={s.lbKey}>{s.name} ({s.year})</span>)}</div>
            </>
          )}
          <div><button className="btn" onClick={() => setPhase('idle')}>Nouvel import</button></div>
        </div>
      )}
    </>
  );
}

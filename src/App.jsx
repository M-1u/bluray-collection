import { useEffect, useMemo, useRef, useState } from 'react';
import { useCollection } from './state.js';
import { ownedFilms, customEditions, wishlist } from './lib/views.js';
import { directorsToRomanize, renameDirectors } from './lib/directorNames.js';
import Sidebar from './components/Sidebar.jsx';
import Settings from './components/Settings.jsx';
import OwnedView from './components/OwnedView.jsx';
import CustomView from './components/CustomView.jsx';
import WishlistView from './components/WishlistView.jsx';
import ImportView from './components/ImportView.jsx';
import StatsView from './components/StatsView.jsx';
import FilmDetail from './components/FilmDetail.jsx';
import AddFilm from './components/AddFilm.jsx';
import './styles.css';

function CorruptScreen({ loadError, restore }) {
  return (
    <div className="empty">
      <h1>Fichier de données illisible</h1>
      <p>collection.json est corrompu. Restaure une sauvegarde :</p>
      {loadError.backups?.length ? (
        <div className="link-list" style={{ alignItems: 'center' }}>
          {loadError.backups.map((b) => (
            <button key={b} onClick={() => restore(b)}>{b.split(/[\\/]/).pop()}</button>
          ))}
        </div>
      ) : (
        <p className="error">Aucune sauvegarde disponible.</p>
      )}
    </div>
  );
}

// Une fois par lancement : renomme via TMDB les réalisateurs enregistrés en écriture non latine.
function useRomanizeDirectors(state, update) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !state?.settings?.tmdbApiKey) return;
    done.current = true;
    const ids = directorsToRomanize(state);
    if (!ids.length) return;
    (async () => {
      const names = {};
      for (const id of ids) {
        try { names[id] = await window.api.tmdbPersonName(id); } catch { /* hors ligne : réessai au prochain lancement */ }
      }
      update((s) => renameDirectors(s, names));
    })();
  }, [state, update]);
}

export default function App() {
  const { state, update, loadError, saveError, restore } = useCollection();
  const [view, setView] = useState('owned');
  const [detailId, setDetailId] = useState(null);
  const [navIds, setNavIds] = useState([]); // films de la liste d'où la fiche a été ouverte, dans l'ordre affiché
  const [adding, setAdding] = useState(null); // état par défaut de l'ajout ('possede' | 'custom' | 'a_acheter')

  useRomanizeDirectors(state, update);

  const counts = useMemo(() => state && {
    owned: ownedFilms(state).length,
    custom: Object.values(customEditions(state)).flat().length,
    wishlist: wishlist(state).length,
  }, [state]);

  if (loadError) return <CorruptScreen loadError={loadError} restore={restore} />;
  if (!state) return <div className="empty">Chargement…</div>;

  const openFilm = (id, ids = []) => { setDetailId(id); setNavIds(ids); };
  const props = { state, update, openFilm, onAdd: setAdding };
  const navIndex = navIds.indexOf(detailId);
  const goTo = (offset) => {
    const id = navIds[navIndex + offset];
    if (navIndex !== -1 && id != null && state.films[id]) setDetailId(id);
  };

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} counts={counts} />
      <main className="main">
        {saveError && <div className="save-error">Échec de l'enregistrement : {saveError}. Tes dernières modifications ne sont pas sauvegardées.</div>}
        {view === 'owned' && <OwnedView {...props} />}
        {view === 'custom' && <CustomView {...props} />}
        {view === 'wishlist' && <WishlistView {...props} />}
        {view === 'stats' && <StatsView {...props} goImport={() => setView('import')} />}
        {view === 'import' && <ImportView {...props} />}
        {view === 'settings' && <Settings state={state} update={update} />}
      </main>
      {detailId != null && state.films[detailId] && (
        <FilmDetail key={detailId} state={state} update={update} tmdbId={detailId} onClose={() => setDetailId(null)}
          nav={navIndex === -1 ? null : { index: navIndex, total: navIds.length, goTo }} />
      )}
      {adding && (
        <AddFilm
          state={state}
          update={update}
          defaultState={adding}
          onClose={() => setAdding(null)}
          onAdded={(id) => { setAdding(null); openFilm(id); }}
        />
      )}
    </div>
  );
}

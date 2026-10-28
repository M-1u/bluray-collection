import { useMemo, useState } from 'react';
import { useCollection } from './state.js';
import { ownedFilms, customEditions, wishlist } from './lib/views.js';
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

export default function App() {
  const { state, update, loadError, saveError, restore } = useCollection();
  const [view, setView] = useState('owned');
  const [detailId, setDetailId] = useState(null);
  const [adding, setAdding] = useState(null); // état par défaut de l'ajout ('possede' | 'custom' | 'a_acheter')

  const counts = useMemo(() => state && {
    owned: ownedFilms(state).length,
    custom: Object.values(customEditions(state)).flat().length,
    wishlist: wishlist(state).length,
  }, [state]);

  if (loadError) return <CorruptScreen loadError={loadError} restore={restore} />;
  if (!state) return <div className="empty">Chargement…</div>;

  const props = { state, update, openFilm: setDetailId, onAdd: setAdding };

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
        <FilmDetail state={state} update={update} tmdbId={detailId} onClose={() => setDetailId(null)} />
      )}
      {adding && (
        <AddFilm
          state={state}
          update={update}
          defaultState={adding}
          onClose={() => setAdding(null)}
          onAdded={(id) => { setAdding(null); setDetailId(id); }}
        />
      )}
    </div>
  );
}

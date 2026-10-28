import { useMemo } from 'react';
import { computeStats } from '../lib/stats.js';
import { FORMAT_LABELS, CUSTOM_STATUS_LABELS } from '../lib/model.js';
import { displayTitle } from '../lib/titles.js';
import BarList from './BarList.jsx';

const fmt = (n) => (n == null ? '—' : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }));
const named = (rows) => rows.map((r) => ({ label: r.name, count: r.count }));

function Tile({ title, value, hint }) {
  return <div className="tile"><h3>{title}</h3><div className="value">{value}</div>{hint && <div className="hint">{hint}</div>}</div>;
}

function FilmLinks({ films, openFilm, extra }) {
  if (!films.length) return <span className="muted small-text">Aucun.</span>;
  return (
    <div className="link-list">
      {films.map((f, i) => (
        <button key={f.tmdbId ?? i} onClick={() => openFilm(f.tmdbId)}>
          {displayTitle(f)} <span className="muted">({f.year}){extra ? extra(f, i) : ''}</span>
        </button>
      ))}
    </div>
  );
}

export default function StatsView({ state, openFilm, goImport }) {
  const st = useMemo(() => computeStats(state), [state]);
  const hasLb = Boolean(state.letterboxd.importedAt);

  return (
    <>
      <div className="view-header"><h1>Statistiques</h1></div>
      <div className="tiles">
        <Tile title="Films possédés" value={st.filmCount} />
        <Tile title="Éditions" value={st.editionCount} hint={st.editionCount > st.filmCount ? `+${st.editionCount - st.filmCount} édition(s) en double` : null} />
        {hasLb && <Tile title="Vus" value={st.seen.seen} hint={st.filmCount ? `${Math.round((st.seen.seen / st.filmCount) * 100)} % de la collection` : null} />}
        {hasLb && <Tile title="Pas encore vus" value={st.seen.unseen} />}
        {hasLb && <Tile title="Note moyenne collection" value={`${fmt(st.avgRatingOwned)}★`} hint={`Toutes notes Letterboxd : ${fmt(st.avgRatingAll)}★`} />}
      </div>

      <div className="stats-grid">
        <div className="panel"><h3>Formats</h3>
          <BarList rows={st.byFormat.map((r) => ({ label: FORMAT_LABELS[r.format] || r.format, count: r.count }))} /></div>
        <div className="panel"><h3>Réalisateurs</h3><BarList rows={named(st.topDirectors)} /></div>
        <div className="panel"><h3>Genres</h3><BarList rows={named(st.topGenres)} /></div>
        <div className="panel"><h3>Pays</h3><BarList rows={named(st.topCountries)} /></div>
        <div className="panel"><h3>Décennies</h3><BarList rows={st.byDecade.map((r) => ({ label: `${r.decade}s`, count: r.count }))} /></div>
        <div className="panel"><h3>Customs</h3>
          <BarList rows={st.customProgress.map((r) => ({ label: CUSTOM_STATUS_LABELS[r.status], count: r.count }))} /></div>

        {hasLb ? (
          <>
            <div className="panel"><h3>Mes notes (films possédés)</h3>
              <BarList rows={st.ratingHistogram.map((r) => ({ label: `${fmt(r.rating)}★`, count: r.count }))} /></div>
            <div className="panel"><h3>Possédés pas encore vus</h3><FilmLinks films={st.seen.unseenFilms} openFilm={openFilm} /></div>
            <div className="panel"><h3>Notés ≥ 4,5★ non possédés</h3>
              {st.topRatedNotOwned.length ? (
                <div className="link-list">
                  {st.topRatedNotOwned.map((f) => <span key={f.key}>{f.name} <span className="muted">({f.year}) · {fmt(f.rating)}★</span></span>)}
                </div>
              ) : <span className="muted small-text">Aucun.</span>}
            </div>
            <div className="panel"><h3>Dans ma watchlist et déjà possédés</h3><FilmLinks films={st.watchlistOwned} openFilm={openFilm} /></div>
            <div className="panel"><h3>Les plus revus</h3>
              <FilmLinks films={st.mostRewatched.map((r) => r.film)} openFilm={openFilm}
                extra={(f, i) => ` · ${st.mostRewatched[i].watchCount} fois`} /></div>
          </>
        ) : (
          <div className="panel">
            <h3>Letterboxd</h3>
            <span className="muted">Importe ton export Letterboxd pour voir vus / pas vus, notes et suggestions.</span>
            <div><button className="btn" onClick={goImport}>Aller à l'import</button></div>
          </div>
        )}
      </div>
    </>
  );
}

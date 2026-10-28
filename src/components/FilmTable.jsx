import { Fragment } from 'react';
import { displayTitle } from '../lib/titles.js';
import { isOwned } from '../lib/model.js';
import { firstDirector } from './FilmGrid.jsx';
import { Stars, FormatBadge, directorNames } from './format.jsx';

export default function FilmTable({ films, state, lb, grouped, openFilm }) {
  let last = null;
  return (
    <table>
      <thead>
        <tr><th>Titre</th><th>Année</th><th>Réalisateur</th><th>Éditions</th><th>Vu</th><th>Note</th><th>Durée</th></tr>
      </thead>
      <tbody>
        {films.map((f) => {
          const group = grouped ? (f.sortKeyOverride || firstDirector(f)) : null;
          const header = grouped && group !== last;
          last = group;
          const entry = lb.get(f.tmdbId);
          const editions = state.editions.filter((e) => e.tmdbId === f.tmdbId && isOwned(e));
          return (
            <Fragment key={f.tmdbId}>
              {header && <tr className="group-row"><td colSpan={7}>{group}</td></tr>}
              <tr className="film-row" onClick={() => openFilm(f.tmdbId)}>
                <td>{displayTitle(f)}</td>
                <td>{f.year}</td>
                <td className="muted">{directorNames(f)}</td>
                <td><div className="chips">{editions.map((e) => <FormatBadge key={e.id} format={e.format} />)}</div></td>
                <td>{entry?.watched ? '✓' : ''}</td>
                <td><Stars rating={entry?.rating ?? null} /></td>
                <td className="muted">{f.runtime ? `${f.runtime} min` : ''}</td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

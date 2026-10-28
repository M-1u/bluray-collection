import { Fragment } from 'react';
import { displayTitle } from '../lib/titles.js';
import Poster from './Poster.jsx';

export const firstDirector = (f) => f.directors?.[0]?.name || 'Réalisateur inconnu';

export default function FilmGrid({ films, grouped, openFilm, metaOf }) {
  let last = null;
  return (
    <div className="grid">
      {films.map((f) => {
        const group = grouped ? (f.sortKeyOverride || firstDirector(f)) : null;
        const header = grouped && group !== last;
        last = group;
        return (
          <Fragment key={f.tmdbId}>
            {header && <div className="director-group">{group}</div>}
            <div className="card" onClick={() => openFilm(f.tmdbId)}>
              <Poster film={f} />
              <div className="title">{displayTitle(f)}</div>
              <div className="meta">{f.year}{metaOf ? metaOf(f) : null}</div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

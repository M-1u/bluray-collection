import { useState } from 'react';
import { posterUrl } from '../state.js';
import { displayTitle } from '../lib/titles.js';

export default function Poster({ film, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!film?.posterPath || failed) {
    return <div className={`poster placeholder ${className}`}>{film ? displayTitle(film) : ''}</div>;
  }
  return <img className={`poster ${className}`} src={posterUrl(film)} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

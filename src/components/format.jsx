import { FORMAT_LABELS } from '../lib/model.js';

export function Stars({ rating }) {
  if (rating == null) return <span className="muted">—</span>;
  const full = Math.floor(rating);
  return <span className="stars" title={`${rating}/5`}>{'★'.repeat(full)}{rating % 1 ? '½' : ''}</span>;
}

export function FormatBadge({ format }) {
  return <span className={`badge fmt-${format}`}>{FORMAT_LABELS[format] || format}</span>;
}

export const directorNames = (film) => (film.directors || []).map((d) => d.name).join(', ');

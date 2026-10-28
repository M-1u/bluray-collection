// Aperçu et application d'un import Letterboxd. Seul `letterboxd` est remplacé ;
// la collection et les correspondances existantes ne sont jamais modifiées.

export function buildImportPreview(state, lbData) {
  const old = state.letterboxd.films;
  const incoming = Object.values(lbData.films);
  return {
    newFilms: incoming.filter((f) => !old[f.key]),
    changedRatings: incoming
      .filter((f) => old[f.key] && old[f.key].rating !== f.rating)
      .map((f) => ({ lb: f, before: old[f.key].rating, after: f.rating })),
    removed: Object.keys(old).filter((k) => !lbData.films[k]),
    toMatch: incoming.filter((f) => !(f.key in state.matches)),
  };
}

export function applyImport(state, lbData, newMatches) {
  return {
    ...state,
    letterboxd: { films: lbData.films, importedAt: new Date().toISOString() },
    matches: { ...state.matches, ...newMatches },
  };
}

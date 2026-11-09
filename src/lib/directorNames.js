// Réalisateurs enregistrés avec un nom hors alphabet latin (岩井俊二…), à renommer via TMDB.
const NON_LATIN = /(?!\p{Script=Latin})\p{L}/u;

export const isNonLatin = (name) => NON_LATIN.test(name || '');

// Ids TMDB (uniques) des réalisateurs à renommer.
export function directorsToRomanize(state) {
  const ids = new Set();
  for (const film of Object.values(state.films)) {
    for (const d of film.directors || []) if (d.id != null && isNonLatin(d.name)) ids.add(d.id);
  }
  return [...ids];
}

// Applique les noms trouvés ({ id: nom }) ; ignore ceux restés hors alphabet latin.
export function renameDirectors(state, names) {
  let changed = false;
  const films = {};
  for (const [id, film] of Object.entries(state.films)) {
    let filmChanged = false;
    const directors = (film.directors || []).map((d) => {
      const name = names[d.id];
      if (!name || isNonLatin(name) || name === d.name) return d;
      filmChanged = true;
      return { ...d, name };
    });
    films[id] = filmChanged ? { ...film, directors } : film;
    changed ||= filmChanged;
  }
  return changed ? { ...state, films } : state;
}

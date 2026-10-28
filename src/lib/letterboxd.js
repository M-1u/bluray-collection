import Papa from 'papaparse';
import { normalize } from './text.js';

// Clé d'un film Letterboxd. Pas l'URI : diary.csv et reviews.csv portent
// l'URI de l'entrée de journal, pas celle du film.
export function lbKey(name, year) {
  return `${normalize(name)}|${year}`;
}

function rows(text) {
  if (!text) return [];
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

function splitTags(s) {
  return (s || '').split(',').map((t) => t.trim()).filter(Boolean);
}

// Export de liste : bloc de méta (version, en-têtes, méta — la description peut
// tenir sur plusieurs lignes), puis le tableau qui commence à la ligne « Position,… ».
export function parseListCsv(text) {
  const table = Papa.parse(text.replace(/^\uFEFF/, ''), { skipEmptyLines: true }).data;
  const start = table.findIndex((r) => r[0] === 'Position');
  const meta = Object.fromEntries((table[1] || []).map((h, i) => [h, table[2]?.[i]]));
  const header = table[start] || [];
  const col = (name) => header.indexOf(name);
  const items = start < 0 ? [] : table.slice(start + 1).map((r) => ({
    position: Number(r[col('Position')]),
    name: r[col('Name')],
    year: Number(r[col('Year')]),
    description: r[col('Description')] || '',
  }));
  return { name: meta.Name || '', items };
}

export function parseLetterboxdFiles(files) {
  if (!files['watched.csv']) throw new Error('Fichier manquant : watched.csv');

  const films = {};
  const get = (r) => {
    const key = lbKey(r.Name, r.Year);
    if (!films[key]) {
      films[key] = {
        key, name: r.Name, year: Number(r.Year), uri: null,
        watched: false, rating: null, watchCount: 0, watchDates: [],
        reviews: [], tags: [], liked: false, inWatchlist: false,
      };
    }
    return films[key];
  };
  const addTags = (f, s) => {
    for (const t of splitTags(s)) if (!f.tags.includes(t)) f.tags.push(t);
  };

  for (const r of rows(files['watched.csv'])) {
    const f = get(r);
    f.watched = true;
    f.uri = r['Letterboxd URI'];
  }
  for (const r of rows(files['ratings.csv'])) {
    const f = get(r);
    f.watched = true;
    f.rating = Number(r.Rating);
    f.uri ||= r['Letterboxd URI'];
  }
  for (const r of rows(files['diary.csv'])) {
    const f = get(r);
    f.watched = true;
    f.watchCount += 1;
    f.watchDates.push(r['Watched Date'] || r.Date);
    addTags(f, r.Tags);
  }
  for (const r of rows(files['reviews.csv'])) {
    const f = get(r);
    f.watched = true;
    f.reviews.push({ date: r.Date, text: r.Review });
    addTags(f, r.Tags);
  }
  for (const r of rows(files['watchlist.csv'])) {
    const f = get(r);
    f.inWatchlist = true;
    f.uri ||= r['Letterboxd URI'];
  }
  for (const r of rows(files['likes/films.csv'])) get(r).liked = true;

  for (const f of Object.values(films)) {
    if (f.watched && f.watchCount === 0) f.watchCount = 1;
    f.watchDates.sort();
  }

  const lists = {};
  for (const [path, text] of Object.entries(files)) {
    const m = path.match(/^lists\/(.+)\.csv$/);
    if (m) lists[m[1]] = parseListCsv(text);
  }
  return { films, lists };
}

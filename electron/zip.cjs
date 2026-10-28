const { unzipSync, strFromU8 } = require('fflate');

// Contenu texte des .csv d'un export Letterboxd, indexé par chemin dans le zip.
function readZip(buffer) {
  const entries = unzipSync(new Uint8Array(buffer), { filter: (f) => f.name.endsWith('.csv') });
  const files = {};
  for (const [name, data] of Object.entries(entries)) files[name] = strFromU8(data);
  return files;
}

module.exports = { readZip };

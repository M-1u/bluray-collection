import { normalize } from './text.js';

// « Titre original [Titre français] », sans crochet si les deux sont identiques.
export function displayTitle({ originalTitle, frenchTitle }) {
  const original = originalTitle || frenchTitle || '';
  if (!frenchTitle || normalize(frenchTitle) === normalize(original)) return original;
  return `${original} [${frenchTitle}]`;
}

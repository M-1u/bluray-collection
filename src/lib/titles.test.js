import { describe, it, expect } from 'vitest';
import { displayTitle } from './titles.js';

describe('displayTitle', () => {
  it('omet le crochet quand les titres ne diffèrent que par la casse', () => {
    expect(displayTitle({ originalTitle: 'Le Mépris', frenchTitle: 'Le mépris' })).toBe('Le Mépris');
  });
  it('omet le crochet quand les titres sont identiques', () => {
    expect(displayTitle({ originalTitle: 'In the Mood for Love', frenchTitle: 'In the Mood for Love' }))
      .toBe('In the Mood for Love');
  });
  it('affiche le titre français entre crochets', () => {
    expect(displayTitle({ originalTitle: 'The Silence of the Lambs', frenchTitle: 'Le Silence des agneaux' }))
      .toBe('The Silence of the Lambs [Le Silence des agneaux]');
  });
  it('gère un titre français vide', () => {
    expect(displayTitle({ originalTitle: 'Parasite', frenchTitle: '' })).toBe('Parasite');
  });
});

/**
 * Set Game Logic Engine
 * Card model, validation, and Set finding.
 */

export const ATTRIBUTES = {
  number: { values: ['1', '2', '3'] },
  color: { values: ['Red', 'Green', 'Purple'] },
  shape: { values: ['Diamond', 'Squiggle', 'Oval'] },
  shading: { values: ['Solid', 'Striped', 'Empty'] },
};

export function createCard(number, color, shape, shading) {
  for (const val of [number, color, shape, shading]) {
    if (val < 0 || val > 2 || !Number.isInteger(val)) {
      throw new RangeError(`Attribute value must be 0, 1, or 2. Got: ${val}`);
    }
  }
  return { number, color, shape, shading };
}

export function isValidSet(c1, c2, c3) {
  for (const attr of ['number', 'color', 'shape', 'shading']) {
    if ((c1[attr] + c2[attr] + c3[attr]) % 3 !== 0) {
      return false;
    }
  }
  return true;
}

export function findAllSets(cards) {
  const sets = [];
  const n = cards.length;
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        if (isValidSet(cards[i], cards[j], cards[k])) {
          sets.push([i, j, k]);
        }
      }
    }
  }
  return sets;
}

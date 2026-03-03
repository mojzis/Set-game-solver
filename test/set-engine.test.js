import { describe, it, expect } from 'vitest';
import { createCard, isValidSet, findAllSets, ATTRIBUTES } from '../set-engine.js';

describe('createCard', () => {
  it('creates a card with all four attributes', () => {
    const card = createCard(0, 1, 2, 0);
    expect(card).toEqual({ number: 0, color: 1, shape: 2, shading: 0 });
  });

  it('throws for out-of-range attribute values', () => {
    expect(() => createCard(3, 0, 0, 0)).toThrow();
    expect(() => createCard(0, -1, 0, 0)).toThrow();
    expect(() => createCard(0, 0, 0, 4)).toThrow();
  });
});

describe('isValidSet', () => {
  it('returns true when all attributes are all-same', () => {
    const c1 = createCard(0, 0, 0, 0);
    const c2 = createCard(0, 0, 0, 0);
    const c3 = createCard(0, 0, 0, 0);
    expect(isValidSet(c1, c2, c3)).toBe(true);
  });

  it('returns true when all attributes are all-different', () => {
    const c1 = createCard(0, 0, 0, 0);
    const c2 = createCard(1, 1, 1, 1);
    const c3 = createCard(2, 2, 2, 2);
    expect(isValidSet(c1, c2, c3)).toBe(true);
  });

  it('returns true for a mixed valid set (some same, some different)', () => {
    // number: all different (0,1,2), color: all same (0,0,0),
    // shape: all different (0,1,2), shading: all same (1,1,1)
    const c1 = createCard(0, 0, 0, 1);
    const c2 = createCard(1, 0, 1, 1);
    const c3 = createCard(2, 0, 2, 1);
    expect(isValidSet(c1, c2, c3)).toBe(true);
  });

  it('returns false when one attribute has two same and one different', () => {
    // number: 0, 0, 1 — two same, one different → invalid
    const c1 = createCard(0, 0, 0, 0);
    const c2 = createCard(0, 1, 1, 1);
    const c3 = createCard(1, 2, 2, 2);
    expect(isValidSet(c1, c2, c3)).toBe(false);
  });

  it('returns false when only one attribute fails', () => {
    // number: all different (0,1,2) ✓
    // color: all different (0,1,2) ✓
    // shape: all different (0,1,2) ✓
    // shading: 0, 0, 1 ✗
    const c1 = createCard(0, 0, 0, 0);
    const c2 = createCard(1, 1, 1, 0);
    const c3 = createCard(2, 2, 2, 1);
    expect(isValidSet(c1, c2, c3)).toBe(false);
  });

  it('validates the mod-3 trick: (a+b+c) % 3 === 0 for each attribute', () => {
    // Values 0, 1, 1 → sum=2, 2%3=2 → invalid
    const c1 = createCard(0, 0, 0, 0);
    const c2 = createCard(1, 0, 0, 0);
    const c3 = createCard(1, 0, 0, 0);
    expect(isValidSet(c1, c2, c3)).toBe(false);
  });
});

describe('findAllSets', () => {
  it('returns empty array when fewer than 3 cards', () => {
    const cards = [createCard(0, 0, 0, 0), createCard(1, 1, 1, 1)];
    expect(findAllSets(cards)).toEqual([]);
  });

  it('finds one set among exactly 3 cards that form a set', () => {
    const cards = [
      createCard(0, 0, 0, 0),
      createCard(1, 1, 1, 1),
      createCard(2, 2, 2, 2),
    ];
    const sets = findAllSets(cards);
    expect(sets).toHaveLength(1);
    expect(sets[0]).toEqual([0, 1, 2]); // indices
  });

  it('returns empty when 3 cards do not form a set', () => {
    const cards = [
      createCard(0, 0, 0, 0),
      createCard(0, 1, 1, 1),
      createCard(1, 2, 2, 2),
    ];
    expect(findAllSets(cards)).toEqual([]);
  });

  it('finds multiple sets among 12 cards', () => {
    // Use a known set of 12 cards from the 81-card deck
    const cards = [
      createCard(0, 0, 0, 0), // 1 Red Diamond Solid
      createCard(0, 0, 1, 0), // 1 Red Squiggle Solid
      createCard(0, 0, 2, 0), // 1 Red Oval Solid
      createCard(1, 1, 0, 1), // 2 Green Diamond Striped
      createCard(1, 1, 1, 1), // 2 Green Squiggle Striped
      createCard(1, 1, 2, 1), // 2 Green Oval Striped
      createCard(2, 2, 0, 2), // 3 Purple Diamond Empty
      createCard(2, 2, 1, 2), // 3 Purple Squiggle Empty
      createCard(2, 2, 2, 2), // 3 Purple Oval Empty
      createCard(0, 1, 0, 2), // 1 Green Diamond Empty
      createCard(1, 2, 1, 0), // 2 Purple Squiggle Solid
      createCard(2, 0, 2, 1), // 3 Red Oval Striped
    ];
    const sets = findAllSets(cards);
    expect(sets.length).toBeGreaterThan(1);

    // Verify each returned set is actually valid
    for (const [i, j, k] of sets) {
      expect(isValidSet(cards[i], cards[j], cards[k])).toBe(true);
    }
  });

  it('returns indices in ascending order within each set', () => {
    const cards = [
      createCard(0, 0, 0, 0),
      createCard(1, 1, 1, 1),
      createCard(2, 2, 2, 2),
    ];
    const sets = findAllSets(cards);
    for (const [i, j, k] of sets) {
      expect(i).toBeLessThan(j);
      expect(j).toBeLessThan(k);
    }
  });
});

describe('ATTRIBUTES', () => {
  it('exports attribute labels and value names', () => {
    expect(ATTRIBUTES.number.values).toEqual(['1', '2', '3']);
    expect(ATTRIBUTES.color.values).toEqual(['Red', 'Green', 'Purple']);
    expect(ATTRIBUTES.shape.values).toEqual(['Diamond', 'Squiggle', 'Oval']);
    expect(ATTRIBUTES.shading.values).toEqual(['Solid', 'Striped', 'Empty']);
  });
});

describe('set analysis', () => {
  it('can determine per-attribute status (all same vs all different)', () => {
    const c1 = createCard(0, 0, 0, 1);
    const c2 = createCard(1, 0, 1, 1);
    const c3 = createCard(2, 0, 2, 1);

    // For each attribute, check if all same or all different
    for (const attr of ['number', 'color', 'shape', 'shading']) {
      const vals = [c1[attr], c2[attr], c3[attr]];
      const allSame = vals[0] === vals[1] && vals[1] === vals[2];
      const allDiff = vals[0] !== vals[1] && vals[1] !== vals[2] && vals[0] !== vals[2];
      expect(allSame || allDiff).toBe(true);
    }
  });
});

import { describe, expect, test } from 'vitest';
import { describeTarget } from '../../src/features/preview';

type FakeAtom = { label: string; implicitH: number };

function editorWith(atoms: FakeAtom[], selection: Record<string, number[]> | null = null) {
  const struct = { atoms: new Map(atoms.map((a, i) => [i, a])), bonds: new Map(), sgroups: new Map() };
  return {
    selection: () => selection,
    explicitSelected: () => ({ ...selection, atoms: selection?.atoms ?? [] }),
    structSelected: () => struct,
    struct: () => struct,
  } as never;
}

const ETHANOL: FakeAtom[] = [
  { label: 'C', implicitH: 3 },
  { label: 'C', implicitH: 2 },
  { label: 'O', implicitH: 1 },
];

describe('describeTarget', () => {
  test('summarises the whole canvas when nothing is selected', () => {
    expect(describeTarget(editorWith(ETHANOL))).toEqual({
      scope: 'canvas',
      rows: [
        ['Formula', 'C2H6O'],
        ['Monoisotopic Mass', '46.0419'],
        ['Average Mass', '46.0684'],
      ],
    });
  });

  test('summarises only the selected atoms', () => {
    const summary = describeTarget(editorWith(ETHANOL, { atoms: [2] }));
    expect(summary.scope).toBe('selection');
    expect(summary.rows[0]).toEqual(['Formula', 'HO']);
  });

  test('is empty for an empty canvas, so the card hides', () => {
    expect(describeTarget(editorWith([]))).toEqual({ scope: 'canvas', rows: [] });
  });

  test('explains why the properties cannot be calculated', () => {
    expect(describeTarget(editorWith([{ label: 'R#', implicitH: 0 }]))).toMatchObject({
      scope: 'canvas',
      rows: [],
      error: expect.stringContaining('R#'),
    });
  });

  test('reports a selection without atoms', () => {
    expect(describeTarget(editorWith(ETHANOL, { texts: [0] }))).toMatchObject({
      scope: 'selection',
      error: 'The selection contains no atoms.',
    });
  });
});

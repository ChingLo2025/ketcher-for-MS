import { describe, expect, test, vi } from 'vitest';
import { UserFacingError } from '../../src/errors';
import { getTargetAtoms, getTargetStruct, hasSelection } from '../../src/ketcher/adapter';

interface FakeAtom {
  label: string;
  implicitH?: number;
  charge?: number | null;
  isotope?: number | null;
}

interface FakeGroup {
  atoms: number[];
  contracted: boolean;
}

// CH3-CH2-OH: atoms 0-1-2, bonds 0 (0-1) and 1 (1-2).
const ETHANOL: FakeAtom[] = [
  { label: 'C', implicitH: 3 },
  { label: 'C', implicitH: 2 },
  { label: 'O', implicitH: 1, charge: null, isotope: null },
];
const ETHANOL_BONDS = [
  { begin: 0, end: 1 },
  { begin: 1, end: 2 },
];

function makeEditor({
  atoms = ETHANOL,
  bonds = ETHANOL_BONDS,
  selection = null as Record<string, number[]> | null,
  explicitAtoms = undefined as number[] | undefined,
  groups = [] as FakeGroup[],
} = {}) {
  const clone = { tag: 'clone' };
  const selected = { tag: 'selected' };
  const struct = {
    atoms: new Map(atoms.map((a, i) => [i, a])),
    bonds: new Map(bonds.map((b, i) => [i, b])),
    sgroups: new Map(groups.map((g, i) => [i, { atoms: g.atoms, isContracted: () => g.contracted }])),
    clone: vi.fn(() => clone),
  };
  const editor = {
    selection: vi.fn(() => selection),
    explicitSelected: vi.fn(() => ({ ...selection, atoms: explicitAtoms ?? selection?.atoms ?? [] })),
    structSelected: vi.fn(() => selected),
    struct: vi.fn(() => struct),
  };
  return { editor: editor as never, structSelected: editor.structSelected, clone, selected };
}

describe('hasSelection', () => {
  test('ignores null and empty selections', () => {
    expect(hasSelection(null)).toBe(false);
    expect(hasSelection({ atoms: [], bonds: [] })).toBe(false);
    expect(hasSelection({ bonds: [1] })).toBe(true);
  });
});

describe('getTargetStruct', () => {
  test('uses the selected sub-structure when atoms are selected', () => {
    const { editor, selected } = makeEditor({ selection: { atoms: [0], bonds: [] } });
    expect(getTargetStruct(editor)).toEqual({ struct: selected, scope: 'selection' });
  });

  test('passes the atoms, the bonds between them and other selected objects to Ketcher', () => {
    const { editor, structSelected } = makeEditor({ selection: { atoms: [0, 1], texts: [7] } });
    getTargetStruct(editor);
    expect(structSelected).toHaveBeenCalledWith({ atoms: [0, 1], bonds: [0], texts: [7] });
  });

  test('includes a whole contracted abbreviation, like the properties do', () => {
    const groups = [{ atoms: [1, 2], contracted: true }];
    const { editor, structSelected } = makeEditor({ selection: { atoms: [2] }, groups });
    getTargetStruct(editor);
    expect(structSelected).toHaveBeenCalledWith({ atoms: [2, 1], bonds: [1] });
  });

  test('falls back to a copy of the whole canvas when nothing is selected', () => {
    const { editor, clone } = makeEditor({ selection: { atoms: [], bonds: [] } });
    expect(getTargetStruct(editor)).toEqual({ struct: clone, scope: 'canvas' });
  });

  test('rejects a selection without atoms (e.g. only arrows or text)', () => {
    const { editor } = makeEditor({ selection: { rxnArrows: [0] } });
    expect(() => getTargetStruct(editor)).toThrow(UserFacingError);
  });

  test('rejects an empty canvas', () => {
    const { editor } = makeEditor({ atoms: [], bonds: [] });
    expect(() => getTargetStruct(editor)).toThrow(/canvas is empty/);
  });
});

describe('getTargetAtoms', () => {
  test('returns every atom when nothing is selected', () => {
    const { editor } = makeEditor();
    const { atoms, scope } = getTargetAtoms(editor);
    expect(scope).toBe('canvas');
    expect(atoms.map((a) => [a.label, a.implicitH])).toEqual([['C', 3], ['C', 2], ['O', 1]]);
    expect(atoms[2]).toMatchObject({ charge: 0, isotope: 0 });
  });

  test('keeps hydrogen counts from the full molecule for a partial selection', () => {
    const { editor } = makeEditor({ selection: { atoms: [1, 2] } });
    expect(getTargetAtoms(editor).atoms.map((a) => a.implicitH)).toEqual([2, 1]);
  });

  test('uses the explicit selection, so a selected bond brings its atoms', () => {
    const { editor } = makeEditor({ selection: { bonds: [0] }, explicitAtoms: [0, 1] });
    expect(getTargetAtoms(editor).atoms).toHaveLength(2);
  });

  test('counts a contracted abbreviation as a whole', () => {
    const groups = [
      { atoms: [1, 2], contracted: true },
      { atoms: [0], contracted: false },
    ];
    const { editor } = makeEditor({ selection: { atoms: [2] }, groups });
    expect(getTargetAtoms(editor).atoms.map((a) => a.label)).toEqual(['O', 'C']);
  });

  test('clamps negative hydrogen counts from invalid valences to zero', () => {
    const { editor } = makeEditor({ atoms: [{ label: 'C', implicitH: -1 }], bonds: [] });
    expect(getTargetAtoms(editor).atoms[0].implicitH).toBe(0);
  });
});

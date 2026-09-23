import { describe, expect, test } from 'vitest';
import { UserFacingError } from '../../src/errors';
import { computeComposition, formatProperties, hillFormula, type AtomInfo } from '../../src/features/properties';

const atom = (label: string, implicitH = 0, charge = 0, isotope = 0): AtomInfo => ({ label, implicitH, charge, isotope });

// Aspirin, CC(=O)Oc1ccccc1C(=O)O, with the implicit hydrogens each atom carries.
const ASPIRIN: AtomInfo[] = [
  atom('C', 3), atom('C'), atom('O'), atom('O'),
  atom('C'), atom('C', 1), atom('C', 1), atom('C', 1), atom('C', 1), atom('C'),
  atom('C'), atom('O'), atom('O', 1),
];

const formulaOf = (atoms: AtomInfo[]) => hillFormula(computeComposition(atoms));

describe('formatProperties', () => {
  test('aspirin matches the ChemDraw values (acceptance)', () => {
    expect(formatProperties(computeComposition(ASPIRIN))).toBe(
      'Formula: C9H8O4\nMonoisotopic Mass: 180.0423\nAverage Mass: 180.1574',
    );
  });

  test('a partial selection keeps only the hydrogens its atoms carry', () => {
    const ring = ASPIRIN.slice(4, 10);
    expect(formatProperties(computeComposition(ring))).toBe(
      'Formula: C6H4\nMonoisotopic Mass: 76.0313\nAverage Mass: 76.0960',
    );
  });
});

describe('hillFormula', () => {
  test('puts C and H first, then the rest alphabetically', () => {
    expect(formulaOf([atom('C', 3), atom('S'), atom('O'), atom('C', 3)])).toBe('C2H6OS');
    expect(formulaOf([atom('C'), atom('Cl'), atom('Cl'), atom('Cl'), atom('Cl')])).toBe('CCl4');
  });

  test('is fully alphabetical without carbon', () => {
    expect(formulaOf([atom('S'), atom('O', 1), atom('O', 1), atom('O'), atom('O')])).toBe('H2O4S');
  });

  test('appends the net charge', () => {
    expect(formulaOf([atom('C', 3), atom('C'), atom('O'), atom('O', 0, -1)])).toBe('C2H3O2-');
    expect(formulaOf([atom('N', 4, 1)])).toBe('H4N+');
    expect(formulaOf([atom('C'), atom('C'), atom('O'), atom('O'), atom('O', 0, -1), atom('O', 0, -1)])).toBe(
      'C2O42-',
    );
  });
});

describe('computeComposition', () => {
  test('rejects atoms that are not elements', () => {
    expect(() => computeComposition([atom('C', 3), atom('R#')])).toThrow(UserFacingError);
    expect(() => computeComposition([atom('constructor')])).toThrow(UserFacingError);
  });

  test('rejects isotope-labelled atoms', () => {
    expect(() => computeComposition([atom('C', 3, 0, 13)])).toThrow(/Isotope/);
  });
});

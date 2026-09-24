import { UserFacingError } from '../errors';
import { ELEMENTS } from './elements';

const MASS_DECIMALS = 4;

export interface AtomInfo {
  label: string;
  /** Implicit hydrogens the atom carries in the full molecule (not re-derived for a cut fragment). */
  implicitH: number;
  charge: number;
  isotope: number;
}

export interface Composition {
  counts: ReadonlyMap<string, number>;
  charge: number;
}

export function computeComposition(atoms: readonly AtomInfo[]): Composition {
  const counts = new Map<string, number>();
  const add = (symbol: string, n: number) => {
    if (n > 0) counts.set(symbol, (counts.get(symbol) ?? 0) + n);
  };

  for (const atom of atoms) {
    if (!Object.hasOwn(ELEMENTS, atom.label)) {
      throw new UserFacingError(`Cannot calculate properties for "${atom.label}" atoms.`);
    }
    if (atom.isotope) {
      throw new UserFacingError('Isotope-labelled atoms are not supported yet.');
    }
    add(atom.label, 1);
    add('H', atom.implicitH);
  }

  return { counts, charge: atoms.reduce((sum, atom) => sum + atom.charge, 0) };
}

/** Hill order: C, then H, then the rest alphabetically; without carbon everything is alphabetical. */
function hillOrder(symbols: readonly string[]): string[] {
  const sorted = [...symbols].sort();
  if (!sorted.includes('C')) return sorted;
  return ['C', ...sorted.filter((s) => s === 'H'), ...sorted.filter((s) => s !== 'C' && s !== 'H')];
}

function chargeSuffix(charge: number): string {
  if (charge === 0) return '';
  const sign = charge > 0 ? '+' : '-';
  return Math.abs(charge) === 1 ? sign : `${Math.abs(charge)}${sign}`;
}

export function hillFormula({ counts, charge }: Composition): string {
  const body = hillOrder([...counts.keys()])
    .map((symbol) => {
      const n = counts.get(symbol) ?? 0;
      return n === 1 ? symbol : `${symbol}${n}`;
    })
    .join('');
  return body + chargeSuffix(charge);
}

function sumMasses({ counts }: Composition, column: 0 | 1): number {
  return [...counts].reduce((sum, [symbol, n]) => sum + n * ELEMENTS[symbol][column], 0);
}

export function monoisotopicMass(composition: Composition): number {
  return sumMasses(composition, 0);
}

export function averageMass(composition: Composition): number {
  return sumMasses(composition, 1);
}

export type PropertyRow = readonly [label: string, value: string];

/** The three properties as label/value rows; shared by the copied text and the on-screen preview. */
export function propertyRows(composition: Composition): PropertyRow[] {
  return [
    ['Formula', hillFormula(composition)],
    ['Monoisotopic Mass', monoisotopicMass(composition).toFixed(MASS_DECIMALS)],
    ['Average Mass', averageMass(composition).toFixed(MASS_DECIMALS)],
  ];
}

export function formatProperties(composition: Composition): string {
  return propertyRows(composition)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}

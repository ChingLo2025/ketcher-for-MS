// The only module that touches Ketcher internals (editor selection, struct, formatters).
// Ketcher is pinned to an exact version; re-verify this file whenever it is upgraded.
import { SupportedFormat, type Atom, type EditorSelection, type Ketcher, type Struct } from 'ketcher-core';
import { UserFacingError } from '../errors';
import type { AtomInfo } from '../features/properties';

export type Scope = 'selection' | 'canvas';

type EditorLike = Pick<Ketcher['editor'], 'selection' | 'explicitSelected' | 'structSelected' | 'struct'>;

export function hasSelection(selection: EditorSelection | null): boolean {
  return !!selection && Object.values(selection).some((ids) => Array.isArray(ids) && ids.length > 0);
}

interface Target {
  scope: Scope;
  atomIds: number[];
  /** Ketcher's explicit selection (texts, arrows, ...); null when the whole canvas is used. */
  selection: EditorSelection | null;
}

/**
 * What all three buttons act on: the explicit selection, or every atom when nothing is selected.
 * A contracted abbreviation (e.g. "OTs") counts as a whole when any of its atoms is selected.
 */
function resolveTarget(editor: EditorLike): Target {
  const struct = editor.struct();
  if (hasSelection(editor.selection())) {
    const selection = editor.explicitSelected();
    const atomIds = withContractedGroups(struct, selection.atoms ?? []);
    if (atomIds.length === 0) throw new UserFacingError('The selection contains no atoms.');
    return { scope: 'selection', atomIds, selection };
  }
  const atomIds = [...struct.atoms.keys()];
  if (atomIds.length === 0) throw new UserFacingError('The canvas is empty.');
  return { scope: 'canvas', atomIds, selection: null };
}

/** The target as a sub-structure (for image and molfile), or a copy of the whole canvas. */
export function getTargetStruct(editor: EditorLike): { struct: Struct; scope: Scope } {
  const { scope, atomIds, selection } = resolveTarget(editor);
  const full = editor.struct();
  if (!selection) return { scope, struct: full.clone() };

  const atoms = new Set(atomIds);
  const bonds = [...full.bonds.keys()].filter((id) => {
    const bond = full.bonds.get(id);
    return !!bond && atoms.has(bond.begin) && atoms.has(bond.end);
  });
  // ketcher-react's Editor.structSelected accepts an explicit selection, though the core type omits it.
  const structSelected = editor.structSelected as (selection: EditorSelection) => Struct;
  return { scope, struct: structSelected.call(editor, { ...selection, atoms: atomIds, bonds }) };
}

/**
 * Atoms for formula and masses. Hydrogen counts are read from the full molecule, so atoms at the
 * edge of a partial selection keep only the hydrogens they really carry (aspirin's ring gives C6H4).
 */
export function getTargetAtoms(editor: EditorLike): { atoms: AtomInfo[]; scope: Scope } {
  const { scope, atomIds } = resolveTarget(editor);
  const struct = editor.struct();
  const atoms = atomIds.flatMap((id) => {
    const atom = struct.atoms.get(id);
    return atom ? [toAtomInfo(atom)] : [];
  });
  return { scope, atoms };
}

function withContractedGroups(struct: Struct, atomIds: readonly number[]): number[] {
  const ids = new Set(atomIds);
  struct.sgroups.forEach((sgroup) => {
    const members: number[] = sgroup.atoms;
    if (sgroup.isContracted() && members.some((id) => ids.has(id))) {
      members.forEach((id) => ids.add(id));
    }
  });
  return [...ids];
}

function toAtomInfo(atom: Atom): AtomInfo {
  return {
    label: atom.label,
    implicitH: Math.max(0, atom.implicitH ?? 0),
    charge: atom.charge ?? 0,
    isotope: atom.isotope ?? 0,
  };
}

/**
 * Uses Ketcher's generateImage so the editor's render settings apply. No backgroundColor is passed:
 * Indigo leaves the background transparent when the option is unset (it rejects "transparent").
 */
export async function generateSvg(ketcher: Ketcher, struct: Struct): Promise<string> {
  const ket = await ketcher.formatterFactory.create(SupportedFormat.ket).getStringFromStructureAsync(struct);
  const blob = await ketcher.generateImage(ket, { outputFormat: 'svg' });
  return blob.text();
}

export function generateMolfileV2000(ketcher: Ketcher, struct: Struct): Promise<string> {
  return ketcher.formatterFactory.create(SupportedFormat.mol).getStringFromStructureAsync(struct);
}

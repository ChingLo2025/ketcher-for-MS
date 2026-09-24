import { UserFacingError } from '../errors';
import { getTargetAtoms, hasSelection, type Scope } from '../ketcher/adapter';
import { computeComposition, propertyRows, type PropertyRow } from './properties';

type Editor = Parameters<typeof getTargetAtoms>[0];

export interface TargetSummary {
  scope: Scope;
  /** What "Copy properties" would copy right now; empty for an empty canvas. */
  rows: PropertyRow[];
  /** Why the properties cannot be calculated for the current target. */
  error?: string;
}

export function describeTarget(editor: Editor): TargetSummary {
  const scope: Scope = hasSelection(editor.selection()) ? 'selection' : 'canvas';
  if (editor.struct().atoms.size === 0) return { scope, rows: [] };

  try {
    return { scope, rows: propertyRows(computeComposition(getTargetAtoms(editor).atoms)) };
  } catch (err) {
    if (err instanceof UserFacingError) return { scope, rows: [], error: err.message };
    throw err;
  }
}

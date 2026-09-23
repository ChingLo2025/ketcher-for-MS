import type { Ketcher } from 'ketcher-core';
import { generateMolfileV2000, generateSvg, getTargetAtoms, getTargetStruct, type Scope } from '../ketcher/adapter';
import { PNG_TYPE, TEXT_TYPE, textBlob, writeToClipboard } from '../clipboard';
import { computeComposition, formatProperties } from './properties';
import { svgToPng } from './image';

export type CopyKind = 'image' | 'properties' | 'molfile';

export interface CopyJob {
  scope: Scope;
  done: Promise<void>;
}

/** Must be called synchronously from a click handler so the clipboard write keeps user activation. */
export function startCopy(ketcher: Ketcher, kind: CopyKind): CopyJob {
  if (kind === 'properties') {
    const { atoms, scope } = getTargetAtoms(ketcher.editor);
    const text = formatProperties(computeComposition(atoms));
    return { scope, done: writeToClipboard({ [TEXT_TYPE]: Promise.resolve(textBlob(text)) }) };
  }

  const { struct, scope } = getTargetStruct(ketcher.editor);
  const entries: Record<string, Promise<Blob>> =
    kind === 'molfile'
      ? { [TEXT_TYPE]: generateMolfileV2000(ketcher, struct).then(textBlob) }
      : // PNG only: PowerPoint pasted SVG clipboard data as text.
        { [PNG_TYPE]: generateSvg(ketcher, struct).then((svg) => svgToPng(svg)) };
  return { scope, done: writeToClipboard(entries) };
}

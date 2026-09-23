import type { CopyKind } from '../features/copyActions';
import type { Scope } from '../ketcher/adapter';
import { shortcutLabel } from './shortcuts';

const BUTTONS: { kind: CopyKind; label: string }[] = [
  { kind: 'image', label: 'Copy image' },
  { kind: 'properties', label: 'Copy properties' },
  { kind: 'molfile', label: 'Copy molfile' },
];

interface Props {
  disabled: boolean;
  scope: Scope;
  onCopy: (kind: CopyKind) => void;
}

export function Toolbar({ disabled, scope, onCopy }: Props) {
  return (
    <div className="toolbar">
      {BUTTONS.map(({ kind, label }) => {
        const shortcut = shortcutLabel(kind);
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            onClick={() => onCopy(kind)}
            title={shortcut ? `${label} (${shortcut})` : label}
            data-testid={`copy-${kind}`}
          >
            {label}
            {shortcut && <kbd>{shortcut}</kbd>}
          </button>
        );
      })}
      <span className="scope" data-testid="scope">
        Target: {scope === 'selection' ? 'Selection' : 'Whole canvas'}
      </span>
    </div>
  );
}

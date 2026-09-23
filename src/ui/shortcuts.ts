import { useEffect } from 'react';
import type { CopyKind } from '../features/copyActions';

export interface Shortcut {
  kind: CopyKind;
  /** KeyboardEvent.code: the physical key, so it works with any keyboard layout or an active IME. */
  code: string;
  label: string;
}

// Left-hand keys. Ketcher 3.18.0 only binds Alt+Shift+R among these, and Chrome/Edge leave Alt+Q/R free.
export const SHORTCUTS: readonly Shortcut[] = [
  { kind: 'image', code: 'KeyQ', label: 'Alt+Q' },
  { kind: 'properties', code: 'KeyR', label: 'Alt+R' },
];

export function shortcutLabel(kind: CopyKind): string | undefined {
  return SHORTCUTS.find((s) => s.kind === kind)?.label;
}

type ShortcutEvent = Pick<
  KeyboardEvent,
  'code' | 'altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey' | 'repeat' | 'target' | 'preventDefault' | 'stopPropagation'
>;

// Ketcher keeps focus in a hidden "cliparea" textarea to receive paste events; that is not typing.
const KETCHER_CLIPAREA = 'cliparea';

function isTyping(target: EventTarget | null): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean; classList?: DOMTokenList } | null;
  if (!el || el.classList?.contains(KETCHER_CLIPAREA)) return false;
  return el.isContentEditable === true || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName ?? '');
}

/**
 * Runs the copy action for an exact Alt+<key> shortcut and stops the event so Ketcher never sees it.
 * Every other key, and anything typed into a text field, passes through untouched.
 */
export function handleShortcutKey(event: ShortcutEvent, onCopy: (kind: CopyKind) => void): void {
  const altOnly = event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey;
  if (!altOnly || isTyping(event.target)) return;

  const shortcut = SHORTCUTS.find((s) => s.code === event.code);
  if (!shortcut) return;

  event.preventDefault();
  event.stopPropagation();
  if (!event.repeat) onCopy(shortcut.kind);
}

/** Listens in the capture phase on window, before Ketcher's own key handlers. */
export function useCopyShortcuts(onCopy: (kind: CopyKind) => void): void {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleShortcutKey(event, onCopy);
    window.addEventListener('keydown', listener, { capture: true });
    return () => window.removeEventListener('keydown', listener, { capture: true });
  }, [onCopy]);
}

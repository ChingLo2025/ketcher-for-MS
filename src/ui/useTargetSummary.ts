import { useEffect, useState } from 'react';
import type { Ketcher } from 'ketcher-core';
import { describeTarget, type TargetSummary } from '../features/preview';

const EMPTY: TargetSummary = { scope: 'canvas', rows: [] };
const EVENTS = ['selectionChange', 'change'] as const;

/**
 * The copy target and its properties, kept in sync with the editor. Recomputed in a later task:
 * Ketcher fires "change" before it recalculates implicit hydrogens, and one edit can fire several events.
 */
export function useTargetSummary(ketcher: Ketcher | null): TargetSummary {
  const [summary, setSummary] = useState<TargetSummary>(EMPTY);

  useEffect(() => {
    if (!ketcher) return;
    const editor = ketcher.editor;
    let timer = 0;

    const refresh = () => {
      try {
        setSummary(describeTarget(editor));
      } catch (err) {
        console.error('Property preview failed', err);
        setSummary({ ...EMPTY, error: 'Preview unavailable.' });
      }
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh);
    };

    schedule();
    const subscriptions = EVENTS.map((name) => ({ name, subscription: editor.subscribe(name, schedule) }));
    return () => {
      window.clearTimeout(timer);
      subscriptions.forEach(({ name, subscription }) => editor.unsubscribe(name, subscription));
    };
  }, [ketcher]);

  return summary;
}

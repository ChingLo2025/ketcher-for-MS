import { useCallback, useRef, useState } from 'react';
import { Editor } from 'ketcher-react';
// The binaryWasm build loads Indigo as a separate .wasm file instead of base64 inside the JS (~40% less to download).
import { StandaloneStructServiceProvider } from 'ketcher-standalone/dist/binaryWasm';
import type { Ketcher } from 'ketcher-core';
import 'ketcher-react/dist/index.css';
import { startCopy, type CopyKind } from './features/copyActions';
import { UserFacingError } from './errors';
import { PropertiesCard } from './ui/PropertiesCard';
import { Toolbar } from './ui/Toolbar';
import { useCopyShortcuts } from './ui/shortcuts';
import { Toast, type ToastMessage } from './ui/Toast';
import { useTargetSummary } from './ui/useTargetSummary';

const structServiceProvider = new StandaloneStructServiceProvider();
const TOAST_MS = 2500;

const SUCCESS_TEXT: Record<CopyKind, string> = {
  image: 'Image copied',
  properties: 'Properties copied',
  molfile: 'Molfile copied',
};

declare global {
  interface Window {
    ketcher?: Ketcher;
  }
}

export function App() {
  const [ketcher, setKetcher] = useState<Ketcher | null>(null);
  const summary = useTargetSummary(ketcher);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<number>();

  const showToast = useCallback((kind: ToastMessage['kind'], text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), kind, text });
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const handleCopy = useCallback(
    (kind: CopyKind) => {
      if (!ketcher) return;
      try {
        const job = startCopy(ketcher, kind);
        const where = job.scope === 'selection' ? 'selection' : 'whole canvas';
        job.done
          .then(() => showToast('ok', `${SUCCESS_TEXT[kind]} (${where})`))
          .catch((err: unknown) => showToast('error', `Copy failed: ${errorText(err)}`));
      } catch (err) {
        showToast('error', errorText(err));
      }
    },
    [ketcher, showToast],
  );
  useCopyShortcuts(handleCopy);

  return (
    <div className="app">
      <Toolbar disabled={!ketcher} scope={summary.scope} onCopy={handleCopy} />
      <div className="editor">
        <Editor
          staticResourcesUrl=""
          structServiceProvider={structServiceProvider}
          errorHandler={(message) => showToast('error', message)}
          disableMacromoleculesEditor
          onInit={(instance) => {
            window.ketcher = instance;
            setKetcher(instance);
          }}
        />
        <PropertiesCard summary={summary} />
      </div>
      <Toast message={toast} />
    </div>
  );
}

function errorText(err: unknown): string {
  if (err instanceof UserFacingError) return err.message;
  return err instanceof Error ? err.message : String(err);
}

import { UserFacingError } from './errors';

export const PNG_TYPE = 'image/png';
export const TEXT_TYPE = 'text/plain';

/**
 * Write lazily-produced content. The ClipboardItem is created synchronously inside the click
 * handler (keeping user activation) and receives promises that resolve once rendering finishes.
 */
export async function writeToClipboard(entries: Record<string, Promise<Blob>>): Promise<void> {
  if (!window.isSecureContext || !navigator.clipboard?.write) {
    throw new Error('Clipboard access needs HTTPS (or localhost).');
  }
  try {
    await navigator.clipboard.write([new ClipboardItem(entries)]);
  } catch (err) {
    // Chrome also rejects when the tab loses focus while a large image is still rendering.
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      throw new UserFacingError('The browser blocked the clipboard. Keep this tab focused until the copy finishes, then try again.');
    }
    throw err;
  }
}

export function textBlob(text: string): Blob {
  return new Blob([text], { type: TEXT_TYPE });
}

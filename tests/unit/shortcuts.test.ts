import { describe, expect, test, vi } from 'vitest';
import { handleShortcutKey } from '../../src/ui/shortcuts';

type Mods = Partial<Record<'altKey' | 'ctrlKey' | 'shiftKey' | 'metaKey' | 'repeat', boolean>>;

function press(code: string, mods: Mods = {}, target: object = { tagName: 'DIV' }) {
  const event = {
    code,
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    repeat: false,
    target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...mods,
  };
  const onCopy = vi.fn();
  handleShortcutKey(event as never, onCopy);
  return { event, onCopy };
}

describe('handleShortcutKey', () => {
  test('Alt+Q copies the image and Alt+R the properties', () => {
    expect(press('KeyQ', { altKey: true }).onCopy).toHaveBeenCalledWith('image');
    expect(press('KeyR', { altKey: true }).onCopy).toHaveBeenCalledWith('properties');
  });

  test('stops the shortcut so Ketcher never sees it', () => {
    const { event } = press('KeyQ', { altKey: true });
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  test.each([
    ['plain Q (Ketcher query atom)', 'KeyQ', {}],
    ['Alt+Shift+R (Ketcher)', 'KeyR', { altKey: true, shiftKey: true }],
    ['Ctrl+Alt+Q (AltGr)', 'KeyQ', { altKey: true, ctrlKey: true }],
    ['Alt+M (not assigned)', 'KeyM', { altKey: true }],
  ])('leaves %s untouched', (_name, code, mods) => {
    const { event, onCopy } = press(code, mods);
    expect(onCopy).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  test('ignores keys typed into text fields', () => {
    for (const target of [{ tagName: 'INPUT' }, { tagName: 'TEXTAREA' }, { tagName: 'DIV', isContentEditable: true }]) {
      const { event, onCopy } = press('KeyQ', { altKey: true }, target);
      expect(onCopy).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });

  test("still works while focus is in Ketcher's hidden clipboard textarea", () => {
    const cliparea = { tagName: 'TEXTAREA', classList: { contains: (name: string) => name === 'cliparea' } };
    expect(press('KeyR', { altKey: true }, cliparea).onCopy).toHaveBeenCalledWith('properties');
  });

  test('swallows auto-repeat without copying again', () => {
    const { event, onCopy } = press('KeyQ', { altKey: true, repeat: true });
    expect(onCopy).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });
});

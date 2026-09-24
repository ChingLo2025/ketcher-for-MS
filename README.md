# Structure to PPT

Draw in Ketcher, select a structure (or nothing, to use the whole canvas), and copy it with one click:

| Button | Clipboard content |
| --- | --- |
| Copy image | Transparent PNG at 2× resolution (SVG was dropped: PowerPoint pasted it as text) |
| Copy properties | `Formula: …` / `Monoisotopic Mass: x.xxxx` / `Average Mass: x.xxxx` |
| Copy molfile | V2000 molfile with the 2D coordinates as drawn |

Shortcuts: **Alt+Q** copies the image and **Alt+R** the properties. They are left-hand keys that neither Ketcher nor Chrome/Edge use, and they do nothing while you type in a text field.

All chemistry runs locally in the browser; structures never leave the machine.

Live site: https://chinglo2025.github.io/ketcher-for-MS/

## Usage

1. Open the page in Chrome or Edge.
2. Draw or paste a structure.
3. Optionally select part of it. The label at the top right shows whether the buttons act on the **Selection** or the **Whole canvas**.
4. Click a button, then paste into PowerPoint (image or properties) or back into Ketcher (molfile).

## Properties

- A card at the bottom right of the canvas previews the three values for the current selection (or the whole canvas) and updates as you edit; it shows exactly what **Copy properties** copies.
- Formula in Hill order with the net charge appended (`C2H3O2-`, `C2O42-`); all selected atoms form one formula.
- Partial selections count only the hydrogens the selected atoms carry in the full molecule: selecting aspirin's ring gives `C6H4`, not `C6H6`.
- A contracted abbreviation (e.g. `OTs`) counts as a whole when any part of it is selected.
- Monoisotopic mass uses the most abundant isotope of each element (values from Indigo).
- Average mass uses the IUPAC 2005 atomic weights that ChemDraw uses (C 12.0107, H 1.00794, O 15.9994), so aspirin gives 180.1574. Only C, H and O are confirmed against ChemDraw so far.
- Isotope labels, R-groups, atom lists and pseudoatoms are rejected with a message instead of giving a wrong value.

## Running it

It must be served over HTTP; it does not work from `file://`. The clipboard only works on `localhost` or HTTPS.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # typecheck + production build into dist/
```

`dist/` is a set of static files that any static web server can host. A first visit downloads about 5 MB (gzipped), mostly Indigo's WASM engine, which is loaded as a separate `.wasm` file (the server must send it as `application/wasm`; GitHub Pages does). A loading screen shows until the editor is ready.

Every push to `main` runs the unit tests, builds, and deploys to GitHub Pages (`.github/workflows/deploy.yml`). This needs the repository's Pages source set to **GitHub Actions** once (Settings → Pages).

## Development notes

Ketcher packages are pinned to an exact version (`3.18.0`). Everything that touches Ketcher internals lives in `src/ketcher/adapter.ts`; re-verify that file when upgrading.

```
src/ketcher/adapter.ts      Ketcher access: target atoms/struct, SVG, molfile
src/features/properties.ts  Formula and masses from the target atoms
src/features/elements.ts    Element mass table
src/features/image.ts       SVG -> transparent PNG
src/features/copyActions.ts Button actions -> clipboard entries
src/clipboard.ts            Async Clipboard API wrapper
src/ui/shortcuts.ts         Alt+Q / Alt+R keyboard shortcuts
src/ui/                     Toolbar and toast
```

Still to verify manually: PNG paste into PowerPoint (transparency and size), and whether ChemDraw accepts pasted molfile text.

## License

Apache License 2.0; see [LICENSE](LICENSE) and [NOTICE](NOTICE). Built on [Ketcher](https://github.com/epam/ketcher) and [Indigo](https://github.com/epam/Indigo) by EPAM Systems, both Apache 2.0.

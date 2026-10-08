# Public image conversion

## Goal

Ship WebP for every PNG and JPEG in `public/`. Rewrite the site links in the same run, and leave the original in place when a link cannot be rewritten.

## Steps

1. Run `npm run images` after adding or replacing a PNG or JPEG under `public/`.
2. `npm run dev` and `npm run build` run the same converter before they start.
3. The preflight check fails while a PNG or JPEG remains in `public/`, or while `src/` or `workers/` still point at one.

The converter reads `scripts/convert-images.mjs`. It encodes with quality 80 and keeps PNG transparency (`alphaQuality` 100). It then rewrites quoted paths such as `/merch/07.jpg` and template paths such as `` `/merch/cta/${id}.png` ``. It deletes the original after the WebP is on disk and a second scan shows no remaining link.

Folders outside `public/` stay as they are. `builder-panel-assets-hires/`, `builder_merch_mocks/`, and `directives/builder_merch_mocks/` are source art. Vite does not serve them.

## Edge Cases

- Download names (`modular-hus-3d.png`, `husbild.jpg`) and the import dialog's `image/png` accept list are user-file types, so the converter leaves them.
- A JPEG or PNG that sits next to a WebP, and that nothing links, is deleted. The existing WebP stays, including when the JPEG is newer.
- A newer PNG or JPEG that the site still links replaces the older WebP.
- A path built by concatenation (`'/merch/cta/' + id + '.png'`) is a failed rewrite. The run stops and the originals stay.
- `npm run images` with a clean `public/` prints nothing and exits 0.

# PDF Magik

PDF Magik is a browser-based PDF utility. Select a PDF to preview it, protect it
with an opening password, rewrite it for possible size savings, add an image
background to each page, or merge it with other PDFs. Operations create a
downloaded copy; the app does not upload or retain documents.

## Run locally

- Install Node.js and npm.
- Run `npm install`.
- Run `npm run dev` to start the Vite development server.
- Run `npm test` for the unit, app interaction, and encryption tests.
- Run `npm run build` to type-check and create the static production build in
  `dist/`.
- To enable offline app-shell support, run `npm run build` and `npm run preview`,
  open the preview once, and let the service worker finish installing.

The production service worker caches the built app and its local assets and
serves only cached files. The app has no AI features, backend, analytics, or
runtime requests to external services. Development mode does not install the
production service worker. See [SECURITY.md](./SECURITY.md) for offline setup
and security details.

## PDF encryption and compatibility

PDFs are encrypted in the browser with `@cantoo/pdf-lib` 2.11.1, which provides
AES-256 (PDF security handler revision 6) by default and exposes Web Crypto
randomness for browser use. The app explicitly selects AES-256. PDF-reader
support varies; older or specialized readers may not open this encryption
level. Try the output in the reader you intend to use.

The selected PDF is parsed and rewritten locally. Already-encrypted, damaged,
PDF/A, or complex PDFs may not be supported; rewriting can invalidate existing
digital signatures. Use a strong opening password and keep it somewhere safe:
the app does not store or recover it. The security of a PDF password also
depends on the password itself and the capabilities of the PDF reader.

PDF processing runs in browser Web Workers. Separate protection, compression,
background, and merge jobs can run concurrently without blocking the interface.

The compression tool rewrites PDF objects using compact object streams; it
cannot re-encode embedded images, so the resulting file may not be smaller.
Page backgrounds support JPG and PNG images and are stretched to each page's
dimensions. Merging preserves page order, starting with the selected PDF.

The optional lifetime reminder uses an hours slider and shows a suggested date
after export. It is informational only; it is not embedded as executable code,
does not expire or delete the PDF, and cannot be enforced by offline PDF readers.
Theme and wallpaper selections are saved in this browser. The wallpaper remains
fixed while the page scrolls, and the foreground accent and surface colors
coordinate with the selected wallpaper. Each wallpaper has an individual
stylesheet imported by `src/styles.css`; choosing a wallpaper activates its
image and color palette through the theme root's `data-wallpaper` attribute.

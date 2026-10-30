# Security

## Application behavior

- PDF Magik has no AI features and does not send documents, passwords, or usage
  data to an AI service.
- The application has no backend, analytics, telemetry, remote fonts, or
  third-party runtime requests. PDF parsing, encryption, previews, merging,
  compression, and page-background processing happen in the browser.
- The production build precaches its application files and wallpaper images
  with a service worker. Once that cache is installed, the app shell and PDF
  tools work offline. The service worker serves cached files only and blocks
  cross-origin GET requests.
- PDF transformations run in Web Workers so concurrent operations do not block
  the interface. Input PDFs and passwords remain in browser memory; theme and
  wallpaper preferences are stored in local storage.

## Offline setup

Build with `npm run build`, then serve `dist/` from `localhost` or an HTTPS
origin. Open the app once so the service worker can install and cache the
production files. After installation, reload the app while offline to use it.
The development server (`npm run dev`) does not install the production
service worker; it is intended for development.

The first install requires the app files to be available from the chosen local
or hosted origin. Installing dependencies and building may require network
access unless the packages are already available locally. No external service
is needed at runtime.

## Data and document limitations

- The app does not persist selected PDFs or passwords. Browser memory, the
  operating system, extensions, and the PDF viewer remain within the user's
  trust boundary.
- A PDF password cannot prevent copying, screenshots, or bypass by every PDF
  reader. Use a secure password and verify the result in the intended reader.
- Rewriting a PDF can invalidate digital signatures or alter unsupported
  features. Keep the original file and review important output.
- An informational lifetime reminder cannot expire or erase exported files.

## Reporting a security issue

Please report suspected vulnerabilities privately to the repository
maintainers. Do not include PDFs, passwords, or other sensitive material in a
public issue.

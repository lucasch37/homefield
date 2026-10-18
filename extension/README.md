# homefield. · Edge / Chrome extension

A Manifest V3 side panel for individual Zillow and Redfin listings. Built with React, TypeScript, Vite, and pnpm. The side panel matches the website’s dark space branding while keeping the compact report layout. All extension implementation lives here; the backend and website are unchanged.

## Build and install

Use Node.js 22.12+ and pnpm 11.25 (the version in `package.json`). From `extension/`:

```sh
pnpm install
pnpm check
```

### Microsoft Edge

1. Open a current desktop version of Microsoft Edge and go to `edge://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this repository's **extension/dist/** directory (the folder containing `manifest.json`).
4. Open Edge's **Extensions** menu in the toolbar and show **homefield.** in the toolbar.
5. Open a Zillow or Redfin listing, then click the **homefield.** toolbar icon to open its sidebar.

After rebuilding, return to `edge://extensions` and click **Reload** on **homefield.** The same build uses Edge's supported `chrome.sidePanel` API; no separate Edge bundle is needed. See Microsoft's [local installation guide](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading) and [sidebar API documentation](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/sidebar).

### Google Chrome

In Chrome 116+ open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select **extension/dist/**. Pin **homefield.** using Chrome's Extensions menu. After each rebuild, open `chrome://extensions` and click **Reload** on **homefield.**, then reopen the side panel (toolbar icon) to see UI changes.

### Read a listing

Open an individual Zillow (`/homedetails/…`) or Redfin (`/…/home/123`) listing. Click the extension toolbar icon to grant temporary access and open the panel. The extension immediately reads the listing address and fetches the hazard report. The address remains editable: correct it and click **Update report** to fetch observations for the corrected address. Manual address entry works without a listing. A missing or ambiguous extraction asks for manual entry and does not fetch a report.

The panel retains a report's own address when switching tabs. Click the toolbar icon on the new listing to automatically read its address and fetch its report, including when the panel is already open. Page layouts, bot challenges, and sign-in walls may require manual entry. Extraction deliberately requires a street, city, state, and ZIP rather than guessing from a search page.

## Local API

From the repository root, follow the existing server setup:

```sh
cd server
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
DATA_DIR=./data .venv/bin/uvicorn app.main:app --reload --port 8000
```

The extension defaults to `http://127.0.0.1:8000` and directly calls `GET /hazards?address=…`. The Next.js frontend is not required. Verify the API at `http://127.0.0.1:8000/health`. Keep the prepared datasets in `server/data/`; missing layers are shown as unavailable observations, never as evidence of safety.

Cross-origin requests originate in the extension page and use the configured backend host permission. The extension does not require a backend CORS change for these requests. If a reverse proxy independently enforces an Origin allowlist, allow your installed `chrome-extension://<extension-id>` origin there.

## Backend configuration

Copy `.env.example` to `.env.local` inside `extension/`, edit it, and rebuild. For example:

```dotenv
VITE_API_BASE_URL=https://hazards.example.com
VITE_API_ALLOWED_ORIGINS=http://127.0.0.1:8000
```

`VITE_API_BASE_URL` selects the default and may include a path prefix, such as `https://example.com/api`; requests then target `/api/hazards`. `VITE_API_ALLOWED_ORIGINS` optionally adds comma-separated exact backend origins. Remote backends must use HTTPS; HTTP is limited to loopback hosts. Credentials, URL queries, and fragments are rejected. Do not put secrets in these variables.

**API settings** in the panel lets you select a URL on one of these configured origins. It stores only the URL in `chrome.storage.local`. Adding another host requires rebuilding and reloading the extension so Edge or Chrome can grant the corresponding host permission. Chrome match patterns grant all ports on a named backend host; the settings validation restricts requests to the exact configured origins, including ports. No wildcard browsing hosts are requested.

## Implementation and privacy

- `activeTab` grants listing access on toolbar click; `scripting` injects the local content bundle when the panel opens or the toolbar icon is clicked again. There are no persistent listing content scripts or browsing listeners. An open panel connects to the background worker so subsequent toolbar clicks refresh the current listing in the correct browser window.
- Zillow and Redfin extractors are separate modules under `src/extraction/`. They inspect listing headings and property JSON-LD, deduplicate matching addresses, and reject conflicting complete candidates. Redfin metadata is scoped to the current URL’s home ID so nearby-home recommendations do not create false ambiguity. They perform no network requests.
- The React panel calls the API with only the submitted address, omits credentials, rejects redirects, and enforces a 15-second deadline. No page HTML, account details, listing URL, cookies, or browsing history are sent.
- `sidePanel` displays the report; `storage` persists only the backend URL. Addresses and reports remain in panel memory and disappear when that page is destroyed. No analytics or remote executable code is included.
- Every address edit, extraction, submission, or backend save invalidates previous requests and clears the displayed report. A generation check also prevents stale responses from transports that ignore cancellation.
- Report normalization and finding text were adapted from `client/lib/types.ts` and `client/lib/hazards.ts`, with the FastAPI models as the API reference. Source dates, resolution, limitations, layer messages, and actions are shown. Heat uses the named lowland comparison; signed ground motion is not interpreted as vertical motion or earthquake risk.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm build
```

Tests cover both sites with HTML fixtures, missing and ambiguous addresses, conflicting structured metadata, Redfin nearby-home metadata from the reported Redmond listing, unsupported hosts/search pages, API failures, unavailable layers, zero values, outside-county reports, request deadlines, and stale successes/failures. React panel tests exercise automatic extraction and fetching, saved backend configuration, repeated toolbar clicks, manual correction, extraction failure, API failure, and stale results or late extraction after edits.

The build verifies its manifest and local assets and executes the actual content bundle against both fixtures, including repeated injection. `dist/manifest.json`, `background.js`, `content.js`, and the side panel's local assets form the unpacked extension.

Actual toolbar opening, browser permission prompts, live Zillow/Redfin layouts, and live Census/backend networking require a smoke test in Edge or Chrome after installation. Edge sidebar behavior has not yet been verified in a live browser. Fixture and mocked API tests do not verify those behaviors.

# Chrome Extension Agent

## Goal
Build a Chrome extension that reads a property address from
Zillow or Redfin and displays the existing Home Hazard Report
in a Chrome side panel.

## Ownership
- Create and modify files only inside extension/.
- You may read client/, server/, and docs/ for reference.
- Do not modify the website, backend, datasets, or pipelines.
- If integration requires changes outside extension/, explain
  the required change and continue any unblocked work.

## Architecture
- Use Manifest V3, React, TypeScript, Vite, and pnpm.
- Keep Zillow and Redfin address extraction in separate modules.
- Content scripts extract addresses; they do not fetch hazard reports.
- Call the existing FastAPI GET /hazards endpoint from the
  extension side panel or background service worker.
- Make the API base URL configurable.
- Keep all executable extension code bundled locally.

## MVP Scope
- Analyze the current listing after an explicit user click.
- Display the detected address and allow manual correction.
- Display flood, heat, and ground-motion results.
- Include loading, extraction failure, API failure,
  missing-data, and outside-King-County states.
- Prevent results from an old request appearing under a new address.
- Exclude accounts, payments, saved properties, and voice features.

## Permissions and Data
- Request only permissions needed for implemented features.
- Prefer activeTab for user-triggered listing access.
- Limit API host permissions to configured backend hosts.
- Send only the address or coordinates needed for the report.
- Do not collect cookies, browsing history, or account details.
- Do not add analytics or embed secrets.

## Accuracy
- Preserve the backend's meaning, units, sources, and limitations.
- Missing observations must never be presented as proof of safety.
- Do not invent hazard scores or imply nationwide coverage.
- If extraction is ambiguous, ask the user to enter the address.

## Verification
- Add fixture-based tests for Zillow and Redfin extraction,
  including missing and ambiguous addresses.
- Verify API errors and stale-request handling.
- Run type checking, relevant tests, and the production build.
- Ensure dist/ contains a loadable manifest.json.
- Document local API setup and Chrome installation in README.md.
- Report which checks actually ran and any unverified behavior.
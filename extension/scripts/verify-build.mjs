import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['activeTab', 'scripting', 'sidePanel', 'storage']);
assert(!manifest.content_scripts, 'Listing access must be explicit.');
for (const file of [manifest.background.service_worker, manifest.side_panel.default_path, 'content.js']) assert(existsSync(`dist/${file}`), `Missing ${file}`);
const html = readFileSync('dist/sidepanel.html', 'utf8');
for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) { assert(!/^https?:/.test(asset)); assert(existsSync(`dist/${asset.replace(/^\//, '')}`)); }
for (const [fixture, url, address] of [
  ['zillow', 'https://www.zillow.com/homedetails/123/1_zpid/', '1234 NE 45th St, Seattle, WA 98105'],
  ['redfin', 'https://www.redfin.com/WA/Seattle/400-Broad-St-98109/home/123', '400 Broad St, Seattle, WA 98109'],
  ['redfin-recommendations', 'https://www.redfin.com/WA/Redmond/11000-243rd-Ave-NE-98053/home/18659506', '11000 243rd Ave NE, Redmond, WA 98053']
]) {
  const dom = new JSDOM(readFileSync(`tests/fixtures/${fixture}.html`, 'utf8'), { url });
  const context = vm.createContext({ document: dom.window.document, location: dom.window.location, URL });
  // Chrome executeScript(files) returns the completion value of the injected bundle.
  const result = vm.runInContext(readFileSync('dist/content.js', 'utf8'), context);
  assert.equal(result?.ok, true); assert.equal(result.address, address);
  // Repeated explicit clicks must not redeclare top-level lexical bindings.
  assert.equal(vm.runInContext(readFileSync('dist/content.js', 'utf8'), context).address, address);
}
console.log('Verified MV3 manifest, local assets, and both injected content-script results.');

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { runInNewContext } from "node:vm";

const base = new URL("../", import.meta.url);
test("manifest icons and pre-cache assets exist inside the project", () => {
  const manifest = JSON.parse(readFileSync(new URL("manifest.webmanifest", base), "utf8"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(icon.src, base)));
});

test("offline shell responds at project Pages subpath without network", async () => {
  const handlers = new Map();
  const origin = "https://example.invalid/english-quiz/";
  const path = (value) => new URL(typeof value === "string" ? value : value.url, origin).pathname;
  const cacheData = new Map();
  const cache = {
    async addAll(urls) {
      for (const url of urls) {
        assert.ok(url.startsWith("./"));
        assert.ok(existsSync(new URL(url, base)), `missing ${url}`);
        cacheData.set(path(url), { ok: true, path: path(url) });
      }
    },
    async match(request) { return cacheData.get(path(request)); }
  };
  const caches = { async open() { return cache; }, async keys() { return []; } };
  const self = {
    location: { origin: "https://example.invalid" },
    registration: { scope: origin },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(name, callback) { handlers.set(name, callback); }
  };
  const script = readFileSync(new URL("sw.js", base), "utf8");
  runInNewContext(script, { self, caches, URL, fetch: async () => { throw Error("offline"); } });
  let installed;
  handlers.get("install")({ waitUntil(p) { installed = p; } });
  await installed;
  for (const resource of ["", "js/app.js", "js/quiz.js", "icons/icon-192.png"]) {
    let response;
    handlers.get("fetch")({ request: { method: "GET", url: origin + resource, mode: resource ? "same-origin" : "navigate" }, respondWith(p) { response = p; } });
    assert.equal((await response).path, path(origin + resource));
  }
});

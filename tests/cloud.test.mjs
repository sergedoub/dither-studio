import test from "node:test";
import assert from "node:assert/strict";
import { publicConfig, createServer } from "../web/server.mjs";
import { saveProject, objectPaths } from "../src/cloud-store.mjs";
const owner = "11111111-1111-4111-8111-111111111111";
const snapshot = {
  source: new Blob(["source"]),
  output: new Blob(["output"]),
  name: "Test",
  settings: { algorithm: "floyd" },
  palette: ["#000000"],
  width: 1,
  height: 1,
};
function fixture(failure) {
  const uploaded = [],
    removed = [],
    rows = [];
  const bucket = {
    async upload(path) {
      if (failure === "upload" && uploaded.length)
        return { error: Error("upload failed") };
      uploaded.push(path);
      return {};
    },
    async remove(paths) {
      removed.push(...paths);
      return {};
    },
  };
  return {
    uploaded,
    removed,
    rows,
    client: {
      storage: { from: () => bucket },
      from: () => ({
        async insert(row) {
          if (failure === "row") return { error: Error("insert failed") };
          rows.push(row);
          return {};
        },
      }),
    },
  };
}
test("cloud save keeps original, output and settings under one owner", async () => {
  const f = fixture();
  const id = await saveProject(f.client, { id: owner }, snapshot);
  assert.deepEqual(f.uploaded, Object.values(objectPaths(owner, id)));
  assert.equal(f.rows[0].owner_id, owner);
  assert.deepEqual(f.rows[0].settings, snapshot.settings);
  assert.equal(f.removed.length, 0);
});
for (const failure of ["upload", "row"])
  test(`failed ${failure} cleans uploaded objects`, async () => {
    const f = fixture(failure);
    await assert.rejects(saveProject(f.client, { id: owner }, snapshot));
    assert.deepEqual(f.removed, f.uploaded);
    assert.equal(f.rows.length, 0);
  });
test("cloud rejects signed-out and oversized saves before upload", async () => {
  const f = fixture();
  await assert.rejects(saveProject(f.client, null, snapshot));
  await assert.rejects(
    saveProject(
      f.client,
      { id: owner },
      { ...snapshot, source: { size: 20971521 } },
    ),
  );
  assert.equal(f.uploaded.length, 0);
});
test("runtime config never exposes privileged keys", () => {
  assert.deepEqual(publicConfig({}), { enabled: false });
  const url = "https://example.supabase.co";
  assert.throws(() =>
    publicConfig({
      SUPABASE_URL: url,
      SUPABASE_PUBLISHABLE_KEY: "sb_secret_test",
    }),
  );
  const key = `a.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.z`;
  assert.throws(() =>
    publicConfig({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }),
  );
  assert.equal(
    publicConfig({
      SUPABASE_URL: url,
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      DATABASE_PASSWORD: "never expose",
    }).key,
    "sb_publishable_test",
  );
});
test("web server serves built editor, CSP, and no source or secret files", async (t) => {
  const server = createServer({ env: {} });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.match(await response.text(), /WEB EDITION/);
  for (const route of [
    "/.env",
    "/web/server.mjs",
    "/src/app.mjs",
    "/%2e%2e%2fpackage.json",
  ])
    assert.equal((await fetch(base + route)).status, 404);
  assert.deepEqual(await (await fetch(base + "/api/config")).json(), {
    enabled: false,
  });
  assert.equal((await fetch(base, { method: "POST" })).status, 405);
});

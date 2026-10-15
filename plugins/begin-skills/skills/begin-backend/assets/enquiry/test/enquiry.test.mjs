import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createExample, BODY_LIMIT } from "../src/application.mjs";
import { hashPassword, tokenHash } from "../src/auth.mjs";
import { migrate } from "../src/database.mjs";

// Public synthetic test strings; never use these for a hosted account.
const PASSWORD_A = "Synthetic northstar test phrase only";
const PASSWORD_B = "Synthetic fieldwork test phrase only";
const owners = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    username: "northstar",
    siteSlug: "northstar",
    displayName: "Northstar Studio",
    passwordHash: await hashPassword(PASSWORD_A),
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    username: "fieldwork",
    siteSlug: "fieldwork",
    displayName: "Fieldwork Practice",
    passwordHash: await hashPassword(PASSWORD_B),
  },
];
const enquiry = {
  name: "Synthetic Visitor",
  email: "visitor@example.test",
  message: "Please tell me more about this synthetic project.",
};

async function fixture(options = {}) {
  const directory = await mkdtemp(join(tmpdir(), "begin-enquiry-test-"));
  const dataDir = join(directory, "pgdata");
  const app = await createExample({ dataDir, owners, ...options });
  await app.listen(0);
  return {
    app,
    directory,
    dataDir,
    async close() {
      await app.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

async function call(app, path, options = {}) {
  const headers = {
    ...(options.method && options.method !== "GET"
      ? { Origin: app.origin }
      : {}),
    ...options.headers,
  };
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.json);
  }
  const response = await fetch(`${app.origin}${path}`, { ...options, headers });
  const body = await response.json();
  return { response, body, status: response.status };
}
async function login(
  app,
  username = "northstar",
  password = PASSWORD_A,
  headers = {},
) {
  const result = await call(app, "/api/auth/login", {
    method: "POST",
    json: { username, password },
    headers,
  });
  assert.equal(result.status, 200);
  assert.match(result.response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(result.response.headers.get("set-cookie"), /SameSite=Strict/);
  assert.match(result.response.headers.get("set-cookie"), /Path=\//);
  return {
    cookie: result.response.headers.get("set-cookie").split(";")[0],
    csrfToken: result.body.csrfToken,
    body: result.body,
  };
}
function rawGet(app, path, headers) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(`${app.origin}${path}`, { headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode,
          body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
        }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}
function chunkedPost(app, path, content) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      `${app.origin}${path}`,
      {
        method: "POST",
        headers: { Origin: app.origin, "Content-Type": "application/json" },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
          }),
        );
      },
    );
    req.on("error", reject);
    req.write(content.slice(0, 5000));
    req.end(content.slice(5000));
  });
}

test("the real HTTP flow saves records, isolates owners, and deduplicates a retry", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  const { app } = f;
  await t.test(
    "public metadata does not disclose credentials or owner IDs",
    async () => {
      const result = await call(app, "/api/sites");
      assert.equal(result.status, 200);
      assert.equal(result.body.sites.length, 2);
      assert.deepEqual(Object.keys(result.body.sites[0]).sort(), [
        "displayName",
        "slug",
      ]);
      assert.equal(JSON.stringify(result.body).includes("password"), false);
    },
  );
  const first = await call(app, "/api/sites/northstar/enquiries", {
    method: "POST",
    json: enquiry,
    headers: { "Idempotency-Key": "30000000-0000-4000-8000-000000000003" },
  });
  assert.equal(first.status, 201);
  assert.ok(first.body.enquiry.id);
  assert.equal(first.body.repeated, false);
  const second = await call(app, "/api/sites/fieldwork/enquiries", {
    method: "POST",
    json: {
      ...enquiry,
      message: "This synthetic message belongs to Fieldwork only.",
    },
  });
  assert.equal(second.status, 201);
  await t.test(
    "an unchanged retry saves one record; a changed payload conflicts",
    async () => {
      const headers = {
        "Idempotency-Key": "30000000-0000-4000-8000-000000000003",
      };
      const repeated = await call(app, "/api/sites/northstar/enquiries", {
        method: "POST",
        json: enquiry,
        headers,
      });
      assert.equal(repeated.status, 200);
      assert.equal(repeated.body.enquiry.id, first.body.enquiry.id);
      assert.equal(repeated.body.repeated, true);
      const changed = await call(app, "/api/sites/northstar/enquiries", {
        method: "POST",
        json: {
          ...enquiry,
          message: "A different synthetic message using an old key.",
        },
        headers,
      });
      assert.equal(changed.status, 409);
      assert.equal(changed.body.error.code, "request_key_conflict");
      const count = await app.db.query(
        "SELECT count(*)::integer AS count FROM enquiries WHERE owner_id=$1",
        [owners[0].id],
      );
      assert.equal(count.rows[0].count, 1);
    },
  );
  await t.test("unauthenticated list and detail fail", async () => {
    assert.equal((await call(app, "/api/owner/enquiries")).status, 401);
    assert.equal(
      (await call(app, `/api/owner/enquiries/${first.body.enquiry.id}`)).status,
      401,
    );
    assert.equal(
      (
        await call(app, "/api/session", {
          headers: { Cookie: "begin_session=malformed" },
        })
      ).status,
      401,
    );
  });
  const a = await login(app),
    b = await login(app, "fieldwork", PASSWORD_B);
  await t.test(
    "both owners see only their own rows and detail scope returns 404",
    async () => {
      const listA = await call(app, "/api/owner/enquiries", {
        headers: { Cookie: a.cookie },
      });
      const listB = await call(app, "/api/owner/enquiries", {
        headers: { Cookie: b.cookie },
      });
      assert.deepEqual(
        listA.body.enquiries.map((row) => row.id),
        [first.body.enquiry.id],
      );
      assert.deepEqual(
        listB.body.enquiries.map((row) => row.id),
        [second.body.enquiry.id],
      );
      assert.equal(
        (
          await call(app, `/api/owner/enquiries/${second.body.enquiry.id}`, {
            headers: { Cookie: a.cookie },
          })
        ).status,
        404,
      );
      assert.equal(
        (
          await call(app, `/api/owner/enquiries/${first.body.enquiry.id}`, {
            headers: { Cookie: b.cookie },
          })
        ).status,
        404,
      );
      const own = await call(
        app,
        `/api/owner/enquiries/${first.body.enquiry.id}`,
        { headers: { Cookie: a.cookie } },
      );
      assert.equal(own.status, 200);
      assert.equal(own.body.enquiry.email, enquiry.email);
      assert.equal(
        (
          await call(app, `/api/owner/enquiries?ownerId=${owners[1].id}`, {
            headers: { Cookie: a.cookie },
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "cookies, stored sessions and logout enforce their security contract",
    async () => {
      const sessionResult = await call(app, "/api/session", {
        headers: { Cookie: a.cookie },
      });
      assert.equal(sessionResult.status, 200);
      assert.equal(sessionResult.body.owner.siteSlug, "northstar");
      const token = a.cookie.slice("begin_session=".length);
      const rows = (
        await app.db.query(
          "SELECT token_hash FROM owner_sessions WHERE owner_id=$1",
          [owners[0].id],
        )
      ).rows;
      assert.equal(rows[0].token_hash, tokenHash(token));
      assert.notEqual(rows[0].token_hash, token);
      assert.equal(
        (
          await call(app, "/api/auth/logout", {
            method: "POST",
            headers: { Cookie: a.cookie },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await call(app, "/api/auth/logout", {
            method: "POST",
            headers: { Cookie: a.cookie, "X-CSRF-Token": b.csrfToken },
          })
        ).status,
        403,
      );
      const logout = await call(app, "/api/auth/logout", {
        method: "POST",
        headers: { Cookie: a.cookie, "X-CSRF-Token": a.csrfToken },
      });
      assert.equal(logout.status, 200);
      assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/);
      assert.equal(
        (
          await call(app, "/api/owner/enquiries", {
            headers: { Cookie: a.cookie },
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await call(app, "/api/owner/enquiries", {
            headers: { Cookie: b.cookie },
          })
        ).status,
        200,
      );
    },
  );
});

test("validation, origin checks, method handling and body limits are enforced over HTTP", async (t) => {
  const f = await fixture();
  t.after(() => f.close());
  const { app } = f;
  await t.test(
    "invalid fields and recipient injection do not save rows",
    async () => {
      const invalid = await call(app, "/api/sites/northstar/enquiries", {
        method: "POST",
        json: { name: "", email: "invalid", message: "short" },
      });
      assert.equal(invalid.status, 422);
      assert.deepEqual(Object.keys(invalid.body.error.fields).sort(), [
        "email",
        "message",
        "name",
      ]);
      for (const injected of [
        { ...enquiry, ownerId: owners[1].id },
        { ...enquiry, name: { value: "Wrong type" } },
        { ...enquiry, message: "x".repeat(4001) },
      ]) {
        assert.equal(
          (
            await call(app, "/api/sites/northstar/enquiries", {
              method: "POST",
              json: injected,
            })
          ).status,
          422,
        );
      }
      assert.equal(
        (await app.db.query("SELECT count(*)::integer AS count FROM enquiries"))
          .rows[0].count,
        0,
      );
      assert.equal(
        (
          await call(app, "/api/sites/missing/enquiries", {
            method: "POST",
            json: enquiry,
          })
        ).status,
        404,
      );
    },
  );
  await t.test(
    "malformed, wrong-content and oversized requests have bounded errors",
    async () => {
      assert.equal(
        (
          await call(app, "/api/sites/northstar/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(app, "/api/sites/northstar/enquiries", {
            method: "POST",
            json: [],
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(app, "/api/sites/northstar/enquiries", {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: "message",
          })
        ).status,
        415,
      );
      const oversized = await call(app, "/api/sites/northstar/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(BODY_LIMIT + 1),
      });
      assert.equal(oversized.status, 413);
      assert.ok(JSON.stringify(oversized.body).length < 500);
      const chunked = await chunkedPost(
        app,
        "/api/sites/northstar/enquiries",
        "x".repeat(BODY_LIMIT + 40),
      );
      assert.equal(chunked.status, 413);
      assert.equal((await call(app, "/api/health")).status, 200);
    },
  );
  await t.test(
    "cross-site, null or missing origins and foreign host headers fail",
    async () => {
      for (const Origin of ["https://unrelated.example", "null", ""]) {
        const result = await call(app, "/api/sites/northstar/enquiries", {
          method: "POST",
          json: enquiry,
          headers: { Origin },
        });
        assert.equal(result.status, 403);
      }
      const missing = await fetch(`${app.origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "northstar", password: PASSWORD_A }),
      });
      assert.equal(missing.status, 403);
      // Use raw HTTP: the Fetch client normalizes Host and Fetch Metadata.
      assert.equal(
        (await rawGet(app, "/api/sites", { Host: "foreign.example" })).status,
        403,
      );
      assert.equal(
        (await rawGet(app, "/api/sites", { "Sec-Fetch-Site": "cross-site" }))
          .status,
        403,
      );
      assert.equal((await call(app, "/api/auth/login")).status, 405);
    },
  );
  await t.test(
    "security headers are present and text is not rendered as HTML",
    async () => {
      const page = await fetch(`${app.origin}/owner`);
      assert.equal(page.status, 200);
      assert.match(
        page.headers.get("content-security-policy"),
        /frame-ancestors 'none'/,
      );
      assert.equal(page.headers.get("x-content-type-options"), "nosniff");
      const javascript = await (await fetch(`${app.origin}/owner.mjs`)).text();
      assert.equal(javascript.includes(".innerHTML"), false);
      assert.match(javascript, /message\.textContent/);
      assert.equal(
        (await fetch(`${app.origin}/../../.local/owners.json`)).status,
        404,
      );
      assert.equal((await fetch(`${app.origin}/s/missing`)).status, 404);
    },
  );
});

test("sessions expire, rotate and passwords remain server-side", async (t) => {
  let clock = Date.now();
  const f = await fixture({ now: () => clock, sessionTtlMs: 2000 });
  t.after(() => f.close());
  const { app } = f;
  const a = await login(app);
  await t.test(
    "password and username failures have the same public error",
    async () => {
      const wrong = await call(app, "/api/auth/login", {
        method: "POST",
        json: { username: "northstar", password: PASSWORD_B },
      });
      const unknown = await call(app, "/api/auth/login", {
        method: "POST",
        json: { username: "unknown", password: PASSWORD_B },
      });
      assert.equal(wrong.status, 401);
      assert.equal(unknown.status, 401);
      assert.deepEqual(wrong.body.error, unknown.body.error);
      assert.equal(JSON.stringify(wrong.body).includes(PASSWORD_B), false);
    },
  );
  await t.test(
    "a successful sign-in rotates the cookie and invalidates its previous token",
    async () => {
      const fresh = await login(app, "northstar", PASSWORD_A, {
        Cookie: a.cookie,
      });
      assert.notEqual(fresh.cookie, a.cookie);
      assert.equal(
        (await call(app, "/api/session", { headers: { Cookie: a.cookie } }))
          .status,
        401,
      );
      const request = await call(app, "/api/session", {
        headers: { Cookie: fresh.cookie },
      });
      assert.equal(request.status, 200);
      clock += 2100;
      assert.equal(
        (
          await call(app, "/api/owner/enquiries", {
            headers: { Cookie: fresh.cookie },
          })
        ).status,
        401,
      );
    },
  );
});

test("database records and sessions survive restart; migrations are idempotent", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "begin-enquiry-durable-"));
  const dataDir = join(directory, "pgdata");
  let app;
  t.after(async () => {
    if (app) await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  app = await createExample({ dataDir, owners });
  await app.listen(0);
  const saved = await call(app, "/api/sites/northstar/enquiries", {
    method: "POST",
    json: {
      ...enquiry,
      message: "A quote ' and <script>text</script> stay ordinary data.",
    },
  });
  assert.equal(saved.status, 201);
  const session = await login(app);
  await migrate(app.db);
  await migrate(app.db);
  assert.equal(
    (
      await app.db.query(
        "SELECT count(*)::integer AS count FROM schema_migrations",
      )
    ).rows[0].count,
    1,
  );
  const before = (await app.db.query("SELECT checksum FROM schema_migrations"))
    .rows[0].checksum;
  await app.close();
  app = await createExample({ dataDir, owners });
  await app.listen(0);
  const result = await call(app, "/api/owner/enquiries", {
    headers: { Cookie: session.cookie },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.enquiries[0].id, saved.body.enquiry.id);
  assert.match(result.body.enquiries[0].message, /<script>/);
  assert.equal(
    (await app.db.query("SELECT checksum FROM schema_migrations")).rows[0]
      .checksum,
    before,
  );
  const stored = (
    await app.db.query("SELECT password_hash FROM owners WHERE username=$1", [
      "northstar",
    ])
  ).rows[0].password_hash;
  assert.match(stored, /^scrypt-/);
  assert.equal(stored.includes(PASSWORD_A), false);
  const tampered = "0".repeat(64);
  await app.db.query("UPDATE schema_migrations SET checksum=$1", [tampered]);
  await assert.rejects(() => migrate(app.db), /applied migration changed/);
  await app.db.query("UPDATE schema_migrations SET checksum=$1", [before]);
});

test("removing an owner revokes access and rotating a password revokes old sessions without losing records", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "begin-enquiry-revocation-"));
  const dataDir = join(directory, "pgdata");
  let app;
  t.after(async () => {
    if (app) await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  app = await createExample({ dataDir, owners });
  await app.listen(0);
  const saved = await call(app, "/api/sites/fieldwork/enquiries", {
    method: "POST",
    json: enquiry,
  });
  assert.equal(saved.status, 201);
  const originalA = await login(app);
  const originalB = await login(app, "fieldwork", PASSWORD_B);
  const replacementPassword = "Replacement synthetic northstar phrase";
  const rotatedA = {
    ...owners[0],
    passwordHash: await hashPassword(replacementPassword),
  };
  await app.close();
  app = await createExample({ dataDir, owners: [rotatedA] });
  await app.listen(0);
  assert.equal(
    (await call(app, "/api/session", { headers: { Cookie: originalA.cookie } }))
      .status,
    401,
  );
  assert.equal(
    (await call(app, "/api/session", { headers: { Cookie: originalB.cookie } }))
      .status,
    401,
  );
  assert.equal(
    (
      await call(app, "/api/auth/login", {
        method: "POST",
        json: { username: "fieldwork", password: PASSWORD_B },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call(app, "/api/auth/login", {
        method: "POST",
        json: { username: "northstar", password: PASSWORD_A },
      })
    ).status,
    401,
  );
  await login(app, "northstar", replacementPassword);
  assert.deepEqual(
    (await call(app, "/api/sites")).body.sites.map((site) => site.slug),
    ["northstar"],
  );
  assert.equal((await fetch(`${app.origin}/s/fieldwork`)).status, 404);
  assert.equal(
    (
      await call(app, "/api/sites/fieldwork/enquiries", {
        method: "POST",
        json: enquiry,
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await app.db.query(
        "SELECT count(*)::integer AS count FROM enquiries WHERE owner_id=$1",
        [owners[1].id],
      )
    ).rows[0].count,
    1,
  );
  assert.equal(
    (
      await app.db.query(
        "SELECT count(*)::integer AS count FROM owner_sessions WHERE owner_id=$1",
        [owners[1].id],
      )
    ).rows[0].count,
    0,
  );
  await app.close();
  app = await createExample({ dataDir, owners: [rotatedA, owners[1]] });
  await app.listen(0);
  assert.equal(
    (await call(app, "/api/session", { headers: { Cookie: originalB.cookie } }))
      .status,
    401,
  );
  const restoredB = await login(app, "fieldwork", PASSWORD_B);
  const restored = await call(app, "/api/owner/enquiries", {
    headers: { Cookie: restoredB.cookie },
  });
  assert.deepEqual(
    restored.body.enquiries.map((row) => row.id),
    [saved.body.enquiry.id],
  );
});

test("rate limiting and unavailable-storage responses are bounded and keep data private", async (t) => {
  let clock = Date.now();
  const errors = [];
  const f = await fixture({
    now: () => clock,
    onError: (event) => errors.push(event),
  });
  t.after(() => f.close());
  const { app } = f;
  for (let i = 0; i < 12; i++)
    assert.equal(
      (
        await call(app, "/api/auth/login", {
          method: "POST",
          json: { username: "unknown", password: PASSWORD_B },
        })
      ).status,
      401,
    );
  const limited = await call(app, "/api/auth/login", {
    method: "POST",
    json: { username: "northstar", password: PASSWORD_A },
  });
  assert.equal(limited.status, 429);
  assert.equal(limited.response.headers.get("retry-after"), "60");
  clock += 60_001;
  const session = await login(app);
  await app.db.close();
  const unavailable = await call(app, "/api/owner/enquiries", {
    headers: { Cookie: session.cookie },
  });
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.body.error.code, "service_unavailable");
  assert.ok(JSON.stringify(unavailable.body).length < 500);
  assert.equal(errors.length, 1);
  assert.deepEqual(Object.keys(errors[0]).sort(), [
    "code",
    "path",
    "requestId",
  ]);
  const serialized = JSON.stringify({ errors, body: unavailable.body });
  assert.equal(serialized.includes("SELECT"), false);
  assert.equal(serialized.includes(PASSWORD_A), false);
  assert.equal(serialized.includes(session.cookie), false);
  assert.equal(serialized.includes(enquiry.email), false);
});

test("the setup command keeps synthetic passwords out of output and refuses overwrite", async (t) => {
  // Run a copied setup root so this test never creates .local in the distributed example.
  const directory = await mkdtemp(join(tmpdir(), "begin-enquiry-setup-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const { cp, mkdir } = await import("node:fs/promises");
  await mkdir(join(directory, "scripts"));
  await mkdir(join(directory, "src"));
  await cp(
    fileURLToPath(new URL("../scripts/setup.mjs", import.meta.url)),
    join(directory, "scripts/setup.mjs"),
  );
  await cp(
    fileURLToPath(new URL("../src/auth.mjs", import.meta.url)),
    join(directory, "src/auth.mjs"),
  );
  const execute = (input) =>
    new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [join(directory, "scripts/setup.mjs"), "--passwords-stdin"],
        { stdio: ["pipe", "pipe", "pipe"] },
      );
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, output }));
      child.stdin.end(input);
    });
  const input = JSON.stringify({
    northstar: PASSWORD_A,
    fieldwork: PASSWORD_B,
  });
  const result = await execute(input);
  assert.equal(result.code, 0);
  assert.equal(result.output.includes(PASSWORD_A), false);
  assert.equal(result.output.includes(PASSWORD_B), false);
  const path = join(directory, ".local/owners.json");
  const bytes = await readFile(path, "utf8");
  assert.equal(bytes.includes(PASSWORD_A), false);
  assert.equal(JSON.parse(bytes).owners.length, 2);
  if (process.platform !== "win32")
    assert.equal((await stat(path)).mode & 0o777, 0o600);
  const repeated = await execute(input);
  assert.equal(repeated.code, 1);
  assert.match(repeated.output, /will not overwrite/);
  assert.equal(await readFile(path, "utf8"), bytes);
});

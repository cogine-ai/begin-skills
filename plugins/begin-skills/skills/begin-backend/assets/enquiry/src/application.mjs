import { createServer } from "node:http";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { openDatabase } from "./database.mjs";
import {
  hashPassword,
  verifyPassword,
  randomToken,
  tokenHash,
  equalTokens,
  readSessionCookie,
  sessionCookie,
} from "./auth.mjs";

export const BODY_LIMIT = 8192;
const SESSION_TTL = 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ASSETS = new Map([
  ["/", ["visitor.html", "text/html; charset=utf-8"]],
  ["/owner", ["owner.html", "text/html; charset=utf-8"]],
  ["/app.css", ["app.css", "text/css; charset=utf-8"]],
  ["/visitor.mjs", ["visitor.mjs", "text/javascript; charset=utf-8"]],
  ["/owner.mjs", ["owner.mjs", "text/javascript; charset=utf-8"]],
]);

class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function json(res, status, value, requestId) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify({ ...value, requestId }));
}

function checkOrigin(req, origin) {
  if (req.headers.host !== new URL(origin).host)
    throw new HttpError(
      403,
      "origin_rejected",
      "Use this example from its own local address.",
    );
  const supplied = req.headers.origin;
  if (
    (supplied !== undefined && supplied !== origin) ||
    req.headers["sec-fetch-site"] === "cross-site" ||
    (req.method !== "GET" && req.method !== "HEAD" && supplied !== origin)
  ) {
    throw new HttpError(
      403,
      "origin_rejected",
      "This request must come from the example website.",
    );
  }
}

async function readJson(req) {
  if (
    !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
      req.headers["content-type"] ?? "",
    ) ||
    (req.headers["content-encoding"] &&
      req.headers["content-encoding"] !== "identity")
  ) {
    req.resume();
    throw new HttpError(
      415,
      "unsupported_content_type",
      "Send an uncompressed JSON request.",
    );
  }
  if (Number(req.headers["content-length"]) > BODY_LIMIT) {
    req.resume();
    throw new HttpError(
      413,
      "body_too_large",
      "The request is too large. Keep the message under 4,000 characters.",
    );
  }
  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0,
      finished = false;
    const fail = (error) => {
      if (!finished) {
        finished = true;
        chunks.length = 0;
        reject(error);
      }
    };
    req.on("data", (chunk) => {
      if (finished) return;
      size += chunk.length;
      if (size > BODY_LIMIT)
        fail(
          new HttpError(
            413,
            "body_too_large",
            "The request is too large. Keep the message under 4,000 characters.",
          ),
        );
      else chunks.push(chunk);
    });
    req.on("end", () => {
      if (!finished) {
        finished = true;
        resolve(Buffer.concat(chunks));
      }
    });
    req.on("error", () =>
      fail(
        new HttpError(
          400,
          "invalid_request",
          "The request could not be read. Try again.",
        ),
      ),
    );
    req.on("aborted", () =>
      fail(
        new HttpError(
          400,
          "invalid_request",
          "The request was interrupted. Try again.",
        ),
      ),
    );
  });
  try {
    const value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(buffer),
    );
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new HttpError(400, "invalid_json", "Send a valid JSON object.");
  }
}

function onlyFields(body, names) {
  if (Object.keys(body).some((key) => !names.includes(key)))
    throw new HttpError(
      422,
      "invalid_fields",
      "Remove fields that this form does not accept.",
    );
}

function validateEnquiry(body) {
  onlyFields(body, ["name", "email", "message"]);
  const fields = {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (
    name.length < 1 ||
    name.length > 120 ||
    /[\u0000-\u001f\u007f]/.test(name)
  )
    fields.name = "Use a name between 1 and 120 characters.";
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    /[\u0000-\u001f\u007f]/.test(email)
  )
    fields.email = "Use a valid email address of at most 254 characters.";
  if (
    message.length < 10 ||
    message.length > 4000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)
  )
    fields.message = "Use a message between 10 and 4,000 characters.";
  if (Object.keys(fields).length)
    throw new HttpError(
      422,
      "validation_failed",
      "Review the highlighted fields.",
      fields,
    );
  return { name, email, message };
}

function createLimiter(now) {
  const buckets = new Map();
  return (key, maximum) => {
    const timestamp = now();
    for (const [entry, bucket] of buckets)
      if (bucket.ends <= timestamp) buckets.delete(entry);
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= 512)
        throw new HttpError(
          429,
          "rate_limited",
          "Please wait a minute before trying again.",
        );
      bucket = { count: 0, ends: timestamp + 60_000 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > maximum)
      throw new HttpError(
        429,
        "rate_limited",
        "Please wait a minute before trying again.",
      );
  };
}

export async function createExample({
  dataDir,
  owners,
  now = Date.now,
  sessionTtlMs = SESSION_TTL,
  onError = () => {},
}) {
  const dummyHash = await hashPassword(randomBytes(32).toString("hex"));
  const limit = createLimiter(now);
  const assets = new Map();
  for (const [path, [filename, type]] of ASSETS)
    assets.set(path, {
      content: await readFile(
        new URL(`../public/${filename}`, import.meta.url),
      ),
      type,
    });
  // Read bundled assets before opening storage, so a missing resource does not
  // leave an initialized database open after startup has failed.
  const db = await openDatabase(dataDir, owners);
  let origin,
    closed = false;

  async function requireSession(req, res) {
    const token = readSessionCookie(req.headers.cookie);
    const rows = token
      ? (
          await db.query(
            `SELECT s.token_hash, s.owner_id, s.csrf_token, s.expires_at, o.display_name, o.site_slug
      FROM owner_sessions s JOIN owners o ON o.id=s.owner_id WHERE s.token_hash=$1 AND s.expires_at > $2 AND o.active=TRUE`,
            [tokenHash(token), new Date(now())],
          )
        ).rows
      : [];
    if (!rows.length) {
      res.setHeader("Set-Cookie", sessionCookie("", 0));
      throw new HttpError(
        401,
        "authentication_required",
        "Sign in to view your enquiries.",
      );
    }
    return rows[0];
  }

  const server = createServer(
    {
      maxHeaderSize: 8192,
      requestTimeout: 10_000,
      headersTimeout: 5_000,
      keepAliveTimeout: 5_000,
    },
    async (req, res) => {
      const requestId = randomUUID();
      let path = "/";
      res.setHeader("X-Request-Id", requestId);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
      );
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
      );
      try {
        checkOrigin(req, origin);
        const url = new URL(req.url, origin);
        path = url.pathname;
        const sitePage = /^\/s\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
        if (req.method === "GET" && (assets.has(path) || sitePage)) {
          if (
            sitePage &&
            !(
              await db.query(
                "SELECT id FROM owners WHERE site_slug=$1 AND active=TRUE",
                [sitePage[1]],
              )
            ).rows.length
          )
            throw new HttpError(
              404,
              "not_found",
              "This site is not available.",
            );
          const asset = assets.get(sitePage ? "/" : path);
          res.writeHead(200, {
            "Content-Type": asset.type,
            "Cache-Control": "no-store",
          });
          res.end(asset.content);
          return;
        }
        if (req.method === "GET" && path === "/api/health") {
          await db.query("SELECT 1");
          json(res, 200, { status: "ok" }, requestId);
          return;
        }
        if (req.method === "GET" && path === "/api/sites") {
          const { rows } = await db.query(
            'SELECT site_slug AS "slug", display_name AS "displayName" FROM owners WHERE active=TRUE ORDER BY site_slug',
          );
          json(res, 200, { sites: rows }, requestId);
          return;
        }
        const submission =
          /^\/api\/sites\/([a-z0-9]+(?:-[a-z0-9]+)*)\/enquiries$/.exec(path);
        if (submission && req.method === "POST") {
          const { rows } = await db.query(
            "SELECT id FROM owners WHERE site_slug=$1 AND active=TRUE",
            [submission[1]],
          );
          if (!rows.length)
            throw new HttpError(
              404,
              "not_found",
              "This site is not available.",
            );
          limit(`submit:${req.socket.remoteAddress}:${submission[1]}`, 20);
          const value = validateEnquiry(await readJson(req));
          const key = req.headers["idempotency-key"] ?? randomUUID();
          if (typeof key !== "string" || !UUID.test(key))
            throw new HttpError(
              422,
              "invalid_request_key",
              "Use a UUID request key, or omit the header.",
            );
          const payloadHash = createHash("sha256")
            .update(JSON.stringify(value))
            .digest("hex");
          const saved = await db.transaction(async (tx) => {
            const { rows: previous } = await tx.query(
              "SELECT id, payload_hash FROM enquiries WHERE owner_id=$1 AND request_key=$2",
              [rows[0].id, key],
            );
            if (previous.length) {
              if (previous[0].payload_hash !== payloadHash)
                throw new HttpError(
                  409,
                  "request_key_conflict",
                  "This request key already saved a different message. Use a new key for a new enquiry.",
                );
              return { id: previous[0].id, repeated: true };
            }
            const id = randomUUID();
            await tx.query(
              "INSERT INTO enquiries(id, owner_id, visitor_name, visitor_email, message, request_key, payload_hash, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
              [
                id,
                rows[0].id,
                value.name,
                value.email,
                value.message,
                key,
                payloadHash,
                new Date(now()),
              ],
            );
            return { id, repeated: false };
          });
          json(
            res,
            saved.repeated ? 200 : 201,
            {
              enquiry: { id: saved.id },
              repeated: saved.repeated,
              message: "Your enquiry has been saved for this website owner.",
            },
            requestId,
          );
          return;
        }
        if (path === "/api/auth/login" && req.method === "POST") {
          limit(`login:${req.socket.remoteAddress}`, 12);
          const body = await readJson(req);
          onlyFields(body, ["username", "password"]);
          if (
            typeof body.username !== "string" ||
            !/^[a-z0-9-]{3,32}$/.test(body.username) ||
            typeof body.password !== "string" ||
            body.password.length > 256
          )
            throw new HttpError(
              422,
              "invalid_fields",
              "Use your local username and password.",
            );
          const { rows } = await db.query(
            "SELECT id, password_hash, display_name, site_slug FROM owners WHERE username=$1 AND active=TRUE",
            [body.username],
          );
          const verified = await verifyPassword(
            body.password,
            rows[0]?.password_hash ?? dummyHash,
          );
          if (!rows.length || !verified)
            throw new HttpError(
              401,
              "invalid_credentials",
              "The username or password was not recognized.",
            );
          const token = randomToken(),
            csrfToken = randomToken(),
            owner = rows[0];
          const previous = readSessionCookie(req.headers.cookie);
          const expiresAt = new Date(now() + sessionTtlMs);
          await db.transaction(async (tx) => {
            await tx.query(
              "DELETE FROM owner_sessions WHERE expires_at <= $1",
              [new Date(now())],
            );
            if (previous)
              await tx.query("DELETE FROM owner_sessions WHERE token_hash=$1", [
                tokenHash(previous),
              ]);
            await tx.query(
              `DELETE FROM owner_sessions WHERE token_hash IN (SELECT token_hash FROM owner_sessions WHERE owner_id=$1 ORDER BY created_at DESC, token_hash DESC OFFSET 7)`,
              [owner.id],
            );
            await tx.query(
              "INSERT INTO owner_sessions(token_hash, owner_id, csrf_token, created_at, expires_at) VALUES ($1,$2,$3,$4,$5)",
              [
                tokenHash(token),
                owner.id,
                csrfToken,
                new Date(now()),
                expiresAt,
              ],
            );
          });
          res.setHeader(
            "Set-Cookie",
            sessionCookie(token, Math.floor(sessionTtlMs / 1000)),
          );
          json(
            res,
            200,
            {
              owner: {
                displayName: owner.display_name,
                siteSlug: owner.site_slug,
              },
              csrfToken,
              expiresAt,
            },
            requestId,
          );
          return;
        }
        if (path === "/api/session" && req.method === "GET") {
          const session = await requireSession(req, res);
          json(
            res,
            200,
            {
              owner: {
                displayName: session.display_name,
                siteSlug: session.site_slug,
              },
              csrfToken: session.csrf_token,
              expiresAt: session.expires_at,
            },
            requestId,
          );
          return;
        }
        if (path === "/api/auth/logout" && req.method === "POST") {
          const session = await requireSession(req, res);
          if (!equalTokens(req.headers["x-csrf-token"], session.csrf_token))
            throw new HttpError(
              403,
              "csrf_rejected",
              "Refresh the page and try signing out again.",
            );
          await db.query("DELETE FROM owner_sessions WHERE token_hash=$1", [
            session.token_hash,
          ]);
          res.setHeader("Set-Cookie", sessionCookie("", 0));
          json(res, 200, { signedOut: true }, requestId);
          return;
        }
        if (path === "/api/owner/enquiries" && req.method === "GET") {
          const session = await requireSession(req, res);
          if (url.search)
            throw new HttpError(
              400,
              "invalid_query",
              "This example shows your latest 50 enquiries without query parameters.",
            );
          const { rows } = await db.query(
            `SELECT id, visitor_name AS "name", visitor_email AS "email", message, created_at AS "createdAt"
          FROM enquiries WHERE owner_id=$1 ORDER BY created_at DESC, id DESC LIMIT 50`,
            [session.owner_id],
          );
          json(res, 200, { enquiries: rows, limit: 50 }, requestId);
          return;
        }
        const detail = /^\/api\/owner\/enquiries\/([^/]+)$/.exec(path);
        if (detail && req.method === "GET") {
          const session = await requireSession(req, res);
          if (!UUID.test(detail[1]))
            throw new HttpError(
              404,
              "not_found",
              "This enquiry was not found.",
            );
          const { rows } = await db.query(
            `SELECT id, visitor_name AS "name", visitor_email AS "email", message, created_at AS "createdAt"
          FROM enquiries WHERE id=$1 AND owner_id=$2`,
            [detail[1], session.owner_id],
          );
          if (!rows.length)
            throw new HttpError(
              404,
              "not_found",
              "This enquiry was not found.",
            );
          json(res, 200, { enquiry: rows[0] }, requestId);
          return;
        }
        if (
          submission ||
          [
            "/api/auth/login",
            "/api/auth/logout",
            "/api/session",
            "/api/sites",
            "/api/health",
            "/api/owner/enquiries",
          ].includes(path) ||
          detail
        ) {
          throw new HttpError(
            405,
            "method_not_allowed",
            "Use the documented request method for this endpoint.",
          );
        }
        throw new HttpError(
          404,
          "not_found",
          "This page or endpoint was not found.",
        );
      } catch (error) {
        if (res.destroyed || res.headersSent) return;
        const known = error instanceof HttpError;
        if (!known) {
          // Keep visitor text, passwords, SQL, cookies, and raw errors out of diagnostics.
          try {
            onError({ requestId, path, code: "service_unavailable" });
          } catch {
            /* diagnostics must not break recovery */
          }
        }
        if (error.status === 429) res.setHeader("Retry-After", "60");
        if (error.status === 413) res.setHeader("Connection", "close");
        json(
          res,
          known ? error.status : 503,
          {
            error: {
              code: known ? error.code : "service_unavailable",
              message: known
                ? error.message
                : "The local service is unavailable. Keep your message and try again after restarting it.",
              ...(known && error.fields ? { fields: error.fields } : {}),
            },
          },
          requestId,
        );
      }
    },
  );
  server.maxRequestsPerSocket = 100;

  return {
    db,
    get origin() {
      return origin;
    },
    async listen(port = 4317) {
      if (origin) throw new Error("This example is already listening.");
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", resolve);
      });
      origin = `http://127.0.0.1:${server.address().port}`;
      return origin;
    },
    async close() {
      if (closed) return;
      closed = true;
      if (server.listening)
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeIdleConnections();
        });
      if (!db.closed) await db.close();
    },
  };
}

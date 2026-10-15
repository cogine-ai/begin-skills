import { PGlite } from "@electric-sql/pglite";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { validPasswordHash } from "./auth.mjs";

const MIGRATIONS = fileURLToPath(new URL("../migrations/", import.meta.url));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function migrate(db) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);",
  );
  const files = (await readdir(MIGRATIONS))
    .filter((name) => /^\d+_[a-z_]+\.sql$/.test(name))
    .sort();
  for (const filename of files) {
    const sql = await readFile(join(MIGRATIONS, filename), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    await db.transaction(async (tx) => {
      const { rows } = await tx.query(
        "SELECT checksum FROM schema_migrations WHERE version = $1",
        [filename],
      );
      if (rows.length) {
        if (rows[0].checksum !== checksum)
          throw new Error(
            "An applied migration changed. Restore it and add a new migration.",
          );
        return;
      }
      await tx.exec(sql);
      await tx.query(
        "INSERT INTO schema_migrations(version, checksum) VALUES ($1, $2)",
        [filename, checksum],
      );
    });
  }
}

export function validateOwners(owners) {
  if (!Array.isArray(owners) || owners.length < 1 || owners.length > 10)
    throw new Error("Configure between one and ten local owners.");
  const ids = new Set(),
    usernames = new Set(),
    slugs = new Set();
  for (const owner of owners) {
    if (
      !owner ||
      !UUID.test(owner.id) ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(owner.siteSlug) ||
      owner.siteSlug.length > 64 ||
      !/^[a-z0-9-]{3,32}$/.test(owner.username) ||
      typeof owner.displayName !== "string" ||
      owner.displayName.trim().length < 1 ||
      owner.displayName.length > 120 ||
      !validPasswordHash(owner.passwordHash)
    )
      throw new Error(
        "Invalid local owner configuration. Run setup using the documented process.",
      );
    if (
      ids.has(owner.id) ||
      usernames.has(owner.username) ||
      slugs.has(owner.siteSlug)
    )
      throw new Error(
        "Local owners need unique IDs, usernames, and site slugs.",
      );
    ids.add(owner.id);
    usernames.add(owner.username);
    slugs.add(owner.siteSlug);
  }
}

export async function openDatabase(dataDir, owners) {
  validateOwners(owners);
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const db = new PGlite(dataDir);
  try {
    await db.waitReady;
    await migrate(db);
    await db.transaction(async (tx) => {
      // The local configuration is the current allowed-owner list. Keep their
      // business rows, but revoke access for an owner omitted from that list.
      await tx.query("UPDATE owners SET active=FALSE");
      for (const owner of owners) {
        const { rows } = await tx.query(
          "SELECT password_hash FROM owners WHERE id = $1",
          [owner.id],
        );
        if (rows.length && rows[0].password_hash !== owner.passwordHash) {
          await tx.query("DELETE FROM owner_sessions WHERE owner_id = $1", [
            owner.id,
          ]);
        }
        await tx.query(
          `INSERT INTO owners(id, site_slug, display_name, username, password_hash, active) VALUES ($1,$2,$3,$4,$5,TRUE)
          ON CONFLICT (id) DO UPDATE SET site_slug=EXCLUDED.site_slug, display_name=EXCLUDED.display_name,
          username=EXCLUDED.username, password_hash=EXCLUDED.password_hash, active=TRUE`,
          [
            owner.id,
            owner.siteSlug,
            owner.displayName,
            owner.username,
            owner.passwordHash,
          ],
        );
      }
      await tx.query(
        "DELETE FROM owner_sessions WHERE owner_id IN (SELECT id FROM owners WHERE active=FALSE)",
      );
    });
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

# Modeling and recovery

## Records and relationships

Begin with actual questions: what must remain true after refresh, who owns it, and which actions change it? A contact page can remain static. An enquiry inbox needs a record, ownership, timestamps, and a read/access policy.

Name records using the project's domain terms. Identify who owns each record, who may act on it, and what must remain true during each change. Use primary keys, foreign keys, required fields, uniqueness, and bounded values to protect those invariants. Decide whether uniqueness applies globally or within one owner; a global constraint can reject valid records belonging to another owner.

Ownership is a relationship, not a free-form client claim. Disabling an owner's access and deleting their business history are separate decisions; avoid a cascading deletion that silently conflates them. Give critical states explicit meaning: a stored enquiry is different from a notified owner.

In PostgreSQL, a small structure could express:

```sql
CREATE TABLE enquiries (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES website_owners(id),
  email text NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiries_owner_created_idx
  ON enquiries(owner_id, created_at DESC, id);
```

This original sketch assumes `website_owners` already exists and a trusted server assigns IDs and ownership. It is a modeling example, not the included local enquiry schema or a complete migration.

## Queries and permissions

Parameterize values and select only needed columns. Scope owner queries explicitly, even when the UI hides other owners. Validate sort choices against allowed columns. For lists that may grow, use a stable order and pagination; an index should serve the actual filter and order.

If using PostgreSQL row-level security, verify the application's actual role and how owner identity reaches the policy. Superusers and roles with `BYPASSRLS` bypass it; table owners normally bypass it unless forced to use row security. Enabling a policy alone does not establish isolation. Test reads and writes through the application's real connection with two owners, including a guessed record ID.

## Migrations and transactions

Use the project's migration tooling and preserve applied history. An existing database needs a change path that accounts for old rows and callers; creating a new database that matches the desired schema does not verify that path. For incompatible changes, add the new shape, backfill deliberately, switch readers/writers, then retire the old shape when its users are gone. Inspect constraints, dependent queries, and operational locks before removal.

Test the relevant migration with representative controlled old data and verify its invariants afterward. Do not edit an already-applied migration to clean up local history. A successful empty-database run establishes creation, not compatibility with existing data. A down migration may discard data; source rollback alone does not restore it.

Group changes requiring atomicity in a transaction. Use a database uniqueness constraint or an appropriate lock where concurrent requests must not create duplicates. Test simultaneous attempts when that invariant matters. Avoid holding a transaction open for a remote email or payment call; persist recoverable work and its state if needed.

Preserve the configured driver, ORM, and connection. Check the provider's actual requirements before choosing pooled application connections or session-sensitive migration/backup connections. A working runtime URL is not evidence that every administrative operation supports the same connection mode. Describe required configuration names without exposing their values.

## Storage and recovery

For a local database, including SQLite or PGlite, inspect the actual data path and supported backup method, and verify a clean restart. Copying a live database's files without its documented procedure may produce an inconsistent backup. A file on an ephemeral host may disappear. For a managed database, inspect connection/runtime compatibility, least-privilege roles, backups, restoration procedure, and migration credentials.

A restart establishes persistence across that restart. Recovery requires a separate check: restore controlled data to an isolated destination and verify schema, expected records, ownership, and relevant constraints. A backup file's existence is insufficient. Preserve the source database during the check.

Store file bodies in suitable storage and ownership/metadata in the database. When uploads and database writes can fail independently, define pending, usable, and deletion states appropriate to the feature. Recover or remove bodies left behind by failed metadata writes. Private file access must authorize the caller before issuing a signed URL; an expiring URL alone does not establish ownership. Define expiry, deletion, and cleanup for retained visitor content.

References: [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

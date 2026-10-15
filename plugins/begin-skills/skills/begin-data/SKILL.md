---
name: begin-data
description: Design or change durable website records, queries, schemas, migrations, and file ownership when a feature needs persistence or existing data must survive an update.
---

# Begin data

Start from the facts the website must retain and the questions it must answer. Inspect its current schema, ORM, migration history, connection, and domain terms. Reuse the established choices; a supplied database connection is enough to begin schema work without provisioning another provider account.

## Make ownership and invariants explicit

Use the project's actual names for the website owner, visitor, payer, and record. Resolve ambiguity when it changes a relationship or access rule. Identify which values are unique globally or only within one owner, which changes must be atomic, and what happens when an owner loses access. Disabling an account and deleting its business history are separate decisions.

Enforce important invariants in the database as well as input validation. Build queries around the verified owner and actual filter/order; add indexes for those queries. Put file bodies in suitable storage and retain ownership, key, type, size, state, and deletion information in durable metadata.

Read [modeling and recovery](references/modeling.md) when choosing constraints, handling concurrent writes, changing a live schema, diagnosing a connection issue, or proving recovery. It includes a labeled SQL sketch, not a ready-to-run product schema.

## Change existing data deliberately

Write versioned migrations using the project's existing tooling. Check old records and the callers that must remain compatible. For a live incompatible change, stage the new shape, backfill, switch callers, and retire the old shape when it is safe. Keep runtime and migration connections appropriate to their operations without replacing the application's configured connection by habit.

Verify the relevant invariant with controlled data: duplicate or concurrent writes, two-owner reads, representative existing rows through a migration, or restoration into a separate destination. A successful restart verifies persistence at that data path; claiming recoverability requires a restoration check.

Return the schema/query changes, migration order, data assumptions, and actual verification. State remaining deployment or recovery steps. Preserve the current database and credentials while preparing an unperformed production change.

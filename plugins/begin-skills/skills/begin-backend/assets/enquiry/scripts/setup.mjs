import { mkdir, writeFile, access } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Writable } from "node:stream";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/auth.mjs";

const local = fileURLToPath(new URL("../.local/", import.meta.url));
const target = fileURLToPath(new URL("../.local/owners.json", import.meta.url));
const definitions = [
  {
    username: "northstar",
    siteSlug: "northstar",
    displayName: "Northstar Studio",
  },
  {
    username: "fieldwork",
    siteSlug: "fieldwork",
    displayName: "Fieldwork Practice",
  },
];

async function hiddenPassword(label) {
  const silent = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const reader = createInterface({
    input: process.stdin,
    output: silent,
    terminal: true,
  });
  process.stdout.write(`${label}: `);
  try {
    return await reader.question("");
  } finally {
    reader.close();
    process.stdout.write("\n");
  }
}

try {
  let exists = false;
  try {
    await access(target);
    exists = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (exists)
    throw new Error(
      "Local owner configuration already exists. Setup will not overwrite it.",
    );
  const stdinMode = process.argv.slice(2).join(" ") === "--passwords-stdin";
  if (process.argv.length > 2 && !stdinMode)
    throw new Error("Supported setup option: --passwords-stdin.");
  if (!stdinMode && !process.stdin.isTTY)
    throw new Error(
      "Run setup in a terminal, or provide synthetic passwords through --passwords-stdin.",
    );
  let supplied;
  if (stdinMode) {
    const chunks = [];
    let length = 0;
    for await (const chunk of process.stdin) {
      length += chunk.length;
      if (length > 4096) throw new Error("Setup input is too large.");
      chunks.push(chunk);
    }
    supplied = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!supplied || typeof supplied !== "object" || Array.isArray(supplied))
      throw new Error("Provide an object of synthetic local passwords.");
  } else
    console.log(
      "Create two local teaching accounts. Use synthetic passwords, never a password from another account. Input is hidden.",
    );
  const owners = [];
  for (const definition of definitions) {
    const password = stdinMode
      ? supplied[definition.username]
      : await hiddenPassword(
          `Choose a local password for ${definition.username} (12–256 characters)`,
        );
    owners.push({
      ...definition,
      id: randomUUID(),
      passwordHash: await hashPassword(password),
    });
  }
  await mkdir(local, { recursive: true, mode: 0o700 });
  await writeFile(
    target,
    JSON.stringify({ version: 1, owners }, null, 2) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Local accounts created: northstar and fieldwork. Passwords were not printed or saved in plaintext. Run npm start.",
  );
} catch (error) {
  // Only our controlled messages are printed; JSON errors may contain input values.
  const allowed = [
    "Local owner configuration already exists. Setup will not overwrite it.",
    "Supported setup option: --passwords-stdin.",
    "Run setup in a terminal, or provide synthetic passwords through --passwords-stdin.",
    "Setup input is too large.",
    "Provide an object of synthetic local passwords.",
    "Use a password between 12 and 256 characters.",
  ];
  console.error(
    allowed.includes(error.message)
      ? error.message
      : "Local setup failed. Use the documented synthetic input format; no existing files were overwritten.",
  );
  process.exitCode = 1;
}

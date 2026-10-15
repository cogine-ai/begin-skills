import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createExample } from "./application.mjs";

const base = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
let port = 4317,
  dataDir = resolve(base, ".local/pgdata"),
  ownersFile = resolve(base, ".local/owners.json");
for (let i = 0; i < args.length; i += 2) {
  const value = args[i + 1];
  if (!value) {
    console.error("Provide a value for each option. See README.md.");
    process.exit(1);
  }
  if (
    args[i] === "--port" &&
    /^\d+$/.test(value) &&
    Number(value) > 0 &&
    Number(value) <= 65535
  )
    port = Number(value);
  else if (args[i] === "--data-dir") dataDir = resolve(value);
  else if (args[i] === "--owners-file") ownersFile = resolve(value);
  else {
    console.error("Unknown or invalid option. See README.md.");
    process.exit(1);
  }
}

let app;
try {
  const config = JSON.parse(await readFile(ownersFile, "utf8"));
  if (config.version !== 1) throw new Error("Unsupported local configuration.");
  app = await createExample({
    dataDir,
    owners: config.owners,
    onError: (event) =>
      console.error(
        `Local service error ${event.requestId}; restart and consult README.md.`,
      ),
  });
  const origin = await app.listen(port);
  console.log(
    `Local enquiry example: ${origin}\nOwner inbox: ${origin}/owner\nSynthetic local data only. Stop with Ctrl+C.`,
  );
} catch {
  if (app) await app.close();
  console.error(
    "Could not start the local example. Run npm run setup, check the port and configuration, then follow README.md.",
  );
  process.exit(1);
}
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });

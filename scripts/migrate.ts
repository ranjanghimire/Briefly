import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const migrationsDir = path.join(process.cwd(), "migrations");

async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) throw new Error("Missing POSTGRES_URL");

  const client = new pg.Client({ connectionString: postgresUrl });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set<string>(
    (
      await client.query<{ name: string }>(
        "SELECT name FROM schema_migrations"
      )
    ).rows.map((r) => r.name)
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sqlText = await fs.readFile(path.join(migrationsDir, file), "utf8");
    // eslint-disable-next-line no-console
    console.log(`Applying migration: ${file}`);
    await client.query(sqlText);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
  }

  await client.end();
}

await main();


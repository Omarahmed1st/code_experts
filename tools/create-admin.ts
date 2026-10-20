// Creates the first administrator, or resets an account's password and makes it
// an administrator. Run it on your own computer; the password is typed here and
// only its scrypt hash reaches the database.
//
//   npm run admin:create                       local D1 (npm run dev / npm start)
//   npm run admin:create -- --remote           the real D1 database on Cloudflare (after wrangler login)
//
// Asks for the email, name and password (typed twice, not shown). Every
// existing session of that account is signed out.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { hashPassword, passwordProblem } from "../src/lib/auth/password.ts";
import { runWrangler } from "./wrangler.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const remote = process.argv.includes("--remote");

function ask(question: string, field: "EMAIL" | "NAME" | "PASSWORD", hidden = false): Promise<string> {
  // Non-interactive use (scripts, CI): CODELAB_ADMIN_EMAIL, CODELAB_ADMIN_NAME, CODELAB_ADMIN_PASSWORD.
  const fromEnv = process.env[`CODELAB_ADMIN_${field}`];
  if (fromEnv !== undefined) return Promise.resolve(fromEnv);
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Print the question, then nothing while typing.
      const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(rl);
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
        if (s.startsWith(question)) write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const sql = (value: string) => `'${value.replace(/'/g, "''")}'`;
const id = (prefix: string) => `${prefix}_${randomBytes(10).toString("hex")}`;

const email = (await ask("Email address: ", "EMAIL")).trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error("That doesn't look like an email address.");
  process.exit(1);
}
const name = (await ask("Name (shown in the admin): ", "NAME")).trim().slice(0, 80) || email.split("@")[0] || "Admin";
const password = await ask("Password: ", "PASSWORD", true);
const problem = passwordProblem(password, email);
if (problem) {
  console.error(problem);
  process.exit(1);
}
if ((await ask("Password again: ", "PASSWORD", true)) !== password) {
  console.error("The two passwords are different. Nothing was changed.");
  process.exit(1);
}

const hash = await hashPassword(password);
const now = Date.now();
const userId = id("usr");
const statements = [
  `INSERT INTO users (id, email, name, email_verified, status, created_at, updated_at) VALUES (${sql(userId)}, ${sql(email)}, ${sql(name)}, 1, 'active', ${now}, ${now}) ` +
    `ON CONFLICT (email) DO UPDATE SET name = excluded.name, status = 'active', updated_at = excluded.updated_at;`,
  `INSERT INTO accounts (id, user_id, provider_id, account_id, password, created_at, updated_at) ` +
    `SELECT ${sql(id("acc"))}, id, 'credential', id, ${sql(hash)}, ${now}, ${now} FROM users WHERE email = ${sql(email)} ` +
    `ON CONFLICT (provider_id, account_id) DO UPDATE SET password = excluded.password, updated_at = excluded.updated_at;`,
  `INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) SELECT id, 'admin', ${now} FROM users WHERE email = ${sql(email)};`,
  `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ${sql(email)});`,
  `INSERT INTO admin_audit_logs (id, actor_user_id, action, entity_type, entity_id, after_state, created_at) ` +
    `SELECT ${sql(id("log"))}, NULL, 'user.create_admin_cli', 'user', id, json_object('email', email), ${now} FROM users WHERE email = ${sql(email)};`,
];

const dir = mkdtempSync(join(tmpdir(), "codelab-admin-"));
const file = join(dir, "admin.sql");
writeFileSync(file, statements.join("\n") + "\n");
try {
  const result = runWrangler(ROOT, ["d1", "execute", "DB", remote ? "--remote" : "--local", "--file", file, "--yes"]);
  if (result.status !== 0) {
    console.error(`wrangler failed:\n${result.stderr || result.stdout}`);
    process.exit(1);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${email} is an administrator${remote ? " on Cloudflare" : " in the local database"}. Sign in at /login.`);

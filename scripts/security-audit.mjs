import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules", ".vercel"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".jsx", ".json", ".yml", ".yaml", ".css"]);
const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (sourceExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) inspect(full);
  }
}

function inspect(file) {
  const text = readFileSync(file, "utf8");
  const name = relative(root, file);
  const checks = [
    [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "Possible private key embedded in source"],
    [/sk_(?:live|test)_[A-Za-z0-9]{20,}/, "Possible Stripe secret embedded in source"],
    [/PLAID-SECRET["'`]?\s*[:=]\s*["'`][^"'`]+/, "Possible Plaid secret embedded in source"],
    [/api[_-]?key["'`]?\s*[:=]\s*["'`][A-Za-z0-9_-]{24,}/i, "Possible hard-coded API key"],
    [/dangerouslySetInnerHTML\s*:/, "Raw HTML injection sink detected; review sanitization"],
    [/(?:^|[^\w])eval\s*\(/, "eval() detected; review for code injection risk"],
    [/new\s+Function\s*\(/, "Dynamic Function constructor detected; review for code injection risk"],
  ];
  for (const [pattern, message] of checks) {
    if (pattern.test(text) && !name.endsWith(".example")) findings.push({ severity: "HIGH", file: name, message });
  }
}

function check(condition, severity, message) {
  if (!condition) findings.push({ severity, file: "configuration", message });
}

check(existsSync(join(root, ".gitignore")), "HIGH", ".gitignore is missing");
if (existsSync(join(root, ".gitignore"))) {
  const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
  check(gitignore.includes(".env"), "HIGH", ".env files are not ignored");
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
check(Boolean(packageJson.scripts?.typecheck), "MEDIUM", "No TypeScript typecheck script configured");
check(Boolean(packageJson.scripts?.build), "MEDIUM", "No production build script configured");
check(Boolean(packageJson.dependencies?.jose), "LOW", "JWT verification library is not declared");

walk(root);

const counts = findings.reduce((acc, item) => {
  acc[item.severity] = (acc[item.severity] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  ok: findings.length === 0,
  checkedAt: new Date().toISOString(),
  counts,
  findings,
}, null, 2));

if ((counts.HIGH || 0) > 0) process.exit(1);

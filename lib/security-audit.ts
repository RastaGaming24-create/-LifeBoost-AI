export type SecurityCheck = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "pass" | "warning" | "fail";
  message: string;
};

const serverSecrets = [
  "OPENAI_API_KEY",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "PLAID_CLIENT_ID",
  "PLAID_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

export function runRuntimeSecurityAudit(): SecurityCheck[] {
  const checks: SecurityCheck[] = [];
  const env = process.env;

  for (const name of serverSecrets) {
    checks.push({
      id: `env:${name}`,
      severity: "high",
      status: env[name] ? "pass" : "warning",
      message: env[name] ? `${name} está configurada.` : `${name} no está configurada.`,
    });
  }

  const exposedSecretNames = Object.keys(env).filter((name) =>
    name.startsWith("NEXT_PUBLIC_") && serverSecrets.some((secret) => name.includes(secret.replace(/_API_KEY|_SECRET|_PRIVATE_KEY|_CLIENT_EMAIL/g, ""))),
  );
  checks.push({
    id: "env:public-secrets",
    severity: "critical",
    status: exposedSecretNames.length ? "fail" : "pass",
    message: exposedSecretNames.length
      ? "Se detectaron nombres de variables sensibles con prefijo NEXT_PUBLIC_. No se muestran sus valores."
      : "No se detectaron secretos de servidor expuestos mediante NEXT_PUBLIC_.",
  });

  checks.push({
    id: "plaid:environment",
    severity: "high",
    status: env.PLAID_ENV === "production" || env.PLAID_ENV === "sandbox" ? "pass" : "fail",
    message: env.PLAID_ENV === "production" || env.PLAID_ENV === "sandbox"
      ? `Plaid está en entorno ${env.PLAID_ENV}.`
      : "PLAID_ENV debe ser sandbox o production.",
  });

  checks.push({
    id: "app:url",
    severity: "medium",
    status: env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? "pass" : "warning",
    message: env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
      ? "La URL pública de la aplicación usa HTTPS."
      : "NEXT_PUBLIC_APP_URL no está configurada con HTTPS.",
  });

  return checks;
}

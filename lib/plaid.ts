import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let client: PlaidApi | null = null;

function getPlaidEnvironment() {
  const value = process.env.PLAID_ENV?.trim().toLowerCase();
  if (value === "production") return PlaidEnvironments.production;
  if (value === "sandbox") return PlaidEnvironments.sandbox;
  throw new Error("Plaid no está configurado correctamente. PLAID_ENV debe ser 'production' o 'sandbox'.");
}

export function plaidClient() {
  if (client) return client;
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("Plaid no está configurado. Faltan PLAID_CLIENT_ID y PLAID_SECRET.");
  }

  client = new PlaidApi(new Configuration({
    basePath: getPlaidEnvironment(),
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  }));

  return client;
}

export function plaidEnvironment() {
  const value = process.env.PLAID_ENV?.trim().toLowerCase();
  if (value === "production" || value === "sandbox") return value;
  return "unconfigured";
}

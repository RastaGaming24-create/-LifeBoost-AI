import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let client: PlaidApi | null = null;

export function plaidClient() {
  if (client) return client;
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) {
    throw new Error("Plaid no está configurado. Faltan PLAID_CLIENT_ID y PLAID_SECRET.");
  }

  const environment = process.env.PLAID_ENV === "production"
    ? PlaidEnvironments.production
    : PlaidEnvironments.sandbox;

  client = new PlaidApi(new Configuration({
    basePath: environment,
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
  return process.env.PLAID_ENV === "production" ? "production" : "sandbox";
}

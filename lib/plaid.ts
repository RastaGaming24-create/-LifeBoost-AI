import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

const client = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: { headers: { "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "", "PLAID-SECRET": process.env.PLAID_SECRET ?? "" } },
}));

export { client, Products, CountryCode };

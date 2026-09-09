import { adminDb } from "./firebase-admin";
import { plaidClient } from "./plaid";

function transactionDate(transaction: any) {
  return transaction.date ?? transaction.authorized_date ?? new Date().toISOString().slice(0, 10);
}

function isPaginationMutationError(error: any) {
  const data = error?.response?.data;
  return data?.error_code === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncPlaidItem(uid: string, itemId: string, accessToken: string) {
  const itemRef = adminDb().collection("plaidItems").doc(itemId);
  const itemSnap = await itemRef.get();
  const originalCursor = itemSnap.exists ? (itemSnap.data()?.cursor ?? "") : "";
  const maxPaginationRestarts = 4;

  for (let attempt = 0; attempt <= maxPaginationRestarts; attempt += 1) {
    let cursor = originalCursor;
    let hasMore = true;
    let added = 0;
    let modified = 0;
    let removed = 0;
    const pendingTransactions: any[] = [];
    const pendingRemovals: string[] = [];

    try {
      while (hasMore) {
        const response = await plaidClient().transactionsSync({
          access_token: accessToken,
          ...(cursor ? { cursor } : {}),
          count: 500,
        } as any);
        const data = response.data as any;

        for (const transaction of [...(data.added ?? []), ...(data.modified ?? [])]) {
          pendingTransactions.push(transaction);
        }

        for (const transaction of data.removed ?? []) {
          pendingRemovals.push(String(transaction.transaction_id));
        }

        added += (data.added ?? []).length;
        modified += (data.modified ?? []).length;
        removed += (data.removed ?? []).length;
        cursor = data.next_cursor ?? cursor;
        hasMore = Boolean(data.has_more);
      }

      // Only persist transaction changes after every page has been fetched successfully.
      // This makes a full pagination restart safe if Plaid mutates the dataset mid-loop.
      const userTransactions = adminDb().collection("users").doc(uid).collection("transactions");

      for (const transaction of pendingTransactions) {
        const amount = Number(transaction.amount) || 0;
        const isIncome = amount < 0;
        const transactionId = String(transaction.transaction_id);
        await userTransactions.doc(`plaid_${transactionId}`).set({
          description: transaction.merchant_name || transaction.name || "Movimiento bancario",
          amount: Math.abs(amount),
          type: isIncome ? "income" : "expense",
          category: isIncome ? "Ingresos" : (transaction.personal_finance_category?.primary || transaction.category?.[0] || "Otros"),
          date: transactionDate(transaction),
          frequency: "once",
          source: "plaid",
          plaidTransactionId: transactionId,
          plaidItemId: itemId,
          merchantName: transaction.merchant_name ?? null,
          accountId: transaction.account_id ?? null,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      for (const transactionId of pendingRemovals) {
        await userTransactions.doc(`plaid_${transactionId}`).delete();
      }

      await itemRef.set({ cursor, lastSyncedAt: new Date().toISOString() }, { merge: true });
      return { added, modified, removed };
    } catch (error: any) {
      const data = error?.response?.data;
      console.error("Plaid transactions sync error:", {
        status: error?.response?.status ?? error?.status ?? null,
        error_code: data?.error_code ?? null,
        error_message: data?.error_message ?? null,
        request_id: data?.request_id ?? null,
        pagination_attempt: attempt + 1,
      });

      if (!isPaginationMutationError(error) || attempt >= maxPaginationRestarts) {
        throw error;
      }

      // Plaid requires restarting the entire pagination loop from the original cursor,
      // not retrying only the page that failed.
      await sleep(500 * (attempt + 1));
    }
  }

  throw new Error("Plaid sync could not complete after pagination restarts.");
}

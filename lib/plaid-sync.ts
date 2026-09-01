import { adminDb } from "./firebase-admin";
import { plaidClient } from "./plaid";

function transactionDate(transaction: any) {
  return transaction.date ?? transaction.authorized_date ?? new Date().toISOString().slice(0, 10);
}

export async function syncPlaidItem(uid: string, itemId: string, accessToken: string) {
  const itemRef = adminDb().collection("plaidItems").doc(itemId);
  const itemSnap = await itemRef.get();
  let cursor = itemSnap.exists ? (itemSnap.data()?.cursor ?? "") : "";
  let hasMore = true;
  let added = 0;
  let modified = 0;
  let removed = 0;

  while (hasMore) {
    const response = await plaidClient().transactionsSync({ access_token: accessToken, ...(cursor ? { cursor } : {}) } as any);
    const data = response.data as any;
    const userTransactions = adminDb().collection("users").doc(uid).collection("transactions");

    for (const transaction of [...(data.added ?? []), ...(data.modified ?? [])]) {
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

    for (const transaction of data.removed ?? []) {
      await userTransactions.doc(`plaid_${transaction.transaction_id}`).delete();
      removed += 1;
    }

    added += (data.added ?? []).length;
    modified += (data.modified ?? []).length;
    cursor = data.next_cursor ?? cursor;
    hasMore = Boolean(data.has_more);
  }

  await itemRef.set({ cursor, lastSyncedAt: new Date().toISOString() }, { merge: true });
  return { added, modified, removed };
}

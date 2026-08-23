export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
};

export const defaultTransactions: Transaction[] = [
  { id: "demo-1", description: "Ingreso mensual", amount: 0, type: "income", category: "Ingresos", date: new Date().toISOString() },
];

export function calculateTotals(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export type TransactionType = "income" | "expense";
export type IncomeFrequency = "once" | "weekly" | "monthly";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  frequency?: IncomeFrequency;
};

export const defaultTransactions: Transaction[] = [
  { id: "demo-1", description: "Ingreso mensual", amount: 0, type: "income", category: "Ingresos", frequency: "monthly", date: new Date().toISOString() },
];

export function calculateTotals(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const recurringWeekly = transactions
    .filter((t) => t.type === "income" && t.frequency === "weekly")
    .reduce((sum, t) => sum + t.amount, 0)
    + transactions
      .filter((t) => t.type === "income" && t.frequency === "monthly")
      .reduce((sum, t) => sum + (t.amount * 12) / 52, 0);

  const recurringMonthly = transactions
    .filter((t) => t.type === "income" && t.frequency === "monthly")
    .reduce((sum, t) => sum + t.amount, 0)
    + transactions
      .filter((t) => t.type === "income" && t.frequency === "weekly")
      .reduce((sum, t) => sum + (t.amount * 52) / 12, 0);

  return { income, expenses, balance: income - expenses, recurringWeekly, recurringMonthly };
}

export type TransactionType = "income" | "expense";
export type IncomeFrequency = "once" | "weekly" | "monthly";
export type ExpenseFrequency = "once" | "weekly" | "monthly";
export type TransactionFrequency = IncomeFrequency | ExpenseFrequency;
export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  frequency?: TransactionFrequency;
  source?: "manual" | "plaid";
  personalFinanceCategory?: string;
};

export const defaultTransactions: Transaction[] = [
  { id: "demo-1", description: "Ingreso mensual", amount: 0, type: "income", category: "Ingresos", frequency: "monthly", date: new Date().toISOString() },
];

function validDate(date: string) {
  const value = new Date(date);
  return Number.isFinite(value.getTime()) ? value : null;
}

function localDateKey(date: string | Date) {
  const value = typeof date === "string" ? validDate(date) : date;
  if (!value) return null;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function isCurrentMonth(date: string) {
  const key = localDateKey(date);
  const now = new Date();
  return Boolean(key && key.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-`));
}

function isCurrentWeek(date: string) {
  const value = validDate(date);
  if (!value) return false;

  // Use the user's local calendar week (Monday through Sunday), not a rolling
  // seven-day window. This makes "Ingreso semanal" match what users expect.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay(); // Sunday=0, Monday=1, ... Saturday=6
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const start = new Date(today);
  start.setDate(today.getDate() - daysFromMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const transactionDateOnly = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  return transactionDateOnly >= start && transactionDateOnly <= end;
}

export function isTransfer(transaction: Transaction) {
  const category = String(transaction.personalFinanceCategory || transaction.category || "").toUpperCase();
  return category === "TRANSFER_IN" || category === "TRANSFER_OUT" || category.startsWith("TRANSFER_");
}

function isActualIncome(transaction: Transaction) {
  if (isTransfer(transaction)) return false;
  const category = String(transaction.personalFinanceCategory || transaction.category || "").toUpperCase();
  if (category === "INCOME") return true;
  return transaction.type === "income";
}

export function calculateTotals(transactions: Transaction[]) {
  const incomeTransactions = transactions.filter(isActualIncome);
  const expenseTransactions = transactions.filter((t) => t.type === "expense" && !isTransfer(t) && !isActualIncome(t));
  const transferTransactions = transactions.filter(isTransfer);
  const weeklyIncome = incomeTransactions.filter((t) => isCurrentWeek(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthIncome = incomeTransactions.filter((t) => isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const weeklyExpenses = expenseTransactions.filter((t) => isCurrentWeek(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpenses = expenseTransactions.filter((t) => isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthTransfers = transferTransactions.filter((t) => isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const monthlyBalance = currentMonthIncome - currentMonthExpenses;
  const expenseRate = currentMonthIncome > 0 ? (currentMonthExpenses / currentMonthIncome) * 100 : 0;
  const recurringWeekly = incomeTransactions.filter((t) => t.frequency === "weekly").reduce((sum, t) => sum + t.amount, 0);
  const recurringMonthly = incomeTransactions.filter((t) => t.frequency === "monthly").reduce((sum, t) => sum + t.amount, 0);
  const projectedMonthlyExpenses = expenseTransactions.filter((t) => t.frequency === "monthly").reduce((sum, t) => sum + t.amount, 0)
    + expenseTransactions.filter((t) => t.frequency === "weekly").reduce((sum, t) => sum + t.amount * (52 / 12), 0);
  return {
    income: currentMonthIncome,
    expenses: currentMonthExpenses,
    totalExpenses: currentMonthExpenses,
    balance: monthlyBalance,
    monthlyIncome: currentMonthIncome,
    monthlyExpenses: currentMonthExpenses,
    monthlyBalance,
    expenseRate,
    recurringWeekly,
    recurringMonthly,
    projectedMonthlyExpenses,
    weeklyIncome,
    weeklyExpenses,
    currentMonthIncome,
    currentMonthExpenses,
    currentMonthTransfers,
  };
}

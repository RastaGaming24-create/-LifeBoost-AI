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

const WEEKS_PER_MONTH = 52 / 12;

function validDate(date: string) {
  const value = new Date(date);
  return Number.isFinite(value.getTime()) ? value : null;
}

function isCurrentMonth(date: string) {
  const value = validDate(date);
  const now = new Date();
  return Boolean(value && value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth());
}

function isCurrentWeek(date: string) {
  const value = validDate(date);
  if (!value) return false;
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return value >= start && value < end;
}

function isActualIncome(transaction: Transaction) {
  if (transaction.source !== "plaid") return transaction.type === "income";
  if (transaction.personalFinanceCategory) return transaction.personalFinanceCategory === "INCOME";
  return transaction.type === "income";
}

export function calculateTotals(transactions: Transaction[]) {
  const incomeTransactions = transactions.filter(isActualIncome);
  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  // Real cash-flow totals: only transactions that actually occurred in the period.
  // Recurring frequency is metadata for planning and must never duplicate historical/current transactions.
  const weeklyIncome = incomeTransactions.filter((t) => isCurrentWeek(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthIncome = incomeTransactions.filter((t) => isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const weeklyExpenses = expenseTransactions.filter((t) => isCurrentWeek(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpenses = expenseTransactions.filter((t) => isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = currentMonthIncome - currentMonthExpenses;
  const expenseRate = currentMonthIncome > 0 ? (currentMonthExpenses / currentMonthIncome) * 100 : 0;

  // Keep projections available separately for planning screens, but do not use them in real balance.
  const recurringWeekly = incomeTransactions.filter((t) => t.frequency === "weekly").reduce((sum, t) => sum + t.amount, 0);
  const recurringMonthly = incomeTransactions.filter((t) => t.frequency === "monthly").reduce((sum, t) => sum + t.amount, 0);
  const projectedMonthlyExpenses = expenseTransactions.filter((t) => t.frequency === "monthly").reduce((sum, t) => sum + t.amount, 0)
    + expenseTransactions.filter((t) => t.frequency === "weekly").reduce((sum, t) => sum + t.amount * WEEKS_PER_MONTH, 0);

  return {
    income: currentMonthIncome,
    expenses: currentMonthExpenses,
    totalExpenses,
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
  };
}

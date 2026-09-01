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

export function calculateTotals(transactions: Transaction[]) {
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const recurringWeekly = transactions.filter((t) => t.type === "income" && t.frequency === "weekly").reduce((sum, t) => sum + t.amount, 0)
    + transactions.filter((t) => t.type === "income" && t.frequency === "monthly").reduce((sum, t) => sum + t.amount / WEEKS_PER_MONTH, 0);

  const recurringMonthly = transactions.filter((t) => t.type === "income" && t.frequency === "monthly").reduce((sum, t) => sum + t.amount, 0)
    + transactions.filter((t) => t.type === "income" && t.frequency === "weekly").reduce((sum, t) => sum + t.amount * WEEKS_PER_MONTH, 0);

  const monthlyRecurringExpenses = transactions.filter((t) => t.type === "expense" && t.frequency === "monthly").reduce((sum, t) => sum + t.amount, 0)
    + transactions.filter((t) => t.type === "expense" && t.frequency === "weekly").reduce((sum, t) => sum + t.amount * WEEKS_PER_MONTH, 0);

  const currentMonthOneTimeExpenses = transactions.filter((t) => t.type === "expense" && (!t.frequency || t.frequency === "once") && isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = monthlyRecurringExpenses + currentMonthOneTimeExpenses;
  const monthlyBalance = recurringMonthly - monthlyExpenses;
  const expenseRate = recurringMonthly > 0 ? (monthlyExpenses / recurringMonthly) * 100 : 0;

  // Real bank/manual transaction totals for the current calendar periods.
  const weeklyIncome = transactions.filter((t) => t.type === "income" && isCurrentWeek(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthIncome = transactions.filter((t) => t.type === "income" && isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const weeklyExpenses = transactions.filter((t) => t.type === "expense" && isCurrentWeek(t.date)).reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpenses = transactions.filter((t) => t.type === "expense" && isCurrentMonth(t.date)).reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses: monthlyExpenses,
    totalExpenses,
    balance: monthlyBalance,
    monthlyIncome: currentMonthIncome || recurringMonthly,
    monthlyExpenses: currentMonthExpenses || monthlyExpenses,
    monthlyBalance,
    expenseRate,
    recurringWeekly,
    recurringMonthly,
    weeklyIncome,
    weeklyExpenses,
    currentMonthIncome,
    currentMonthExpenses,
  };
}

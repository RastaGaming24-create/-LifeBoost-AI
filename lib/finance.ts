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
};

export const defaultTransactions: Transaction[] = [
  { id: "demo-1", description: "Ingreso mensual", amount: 0, type: "income", category: "Ingresos", frequency: "monthly", date: new Date().toISOString() },
];

const WEEKS_PER_MONTH = 52 / 12;

function isCurrentMonth(date: string) {
  const value = new Date(date);
  const now = new Date();
  return Number.isFinite(value.getTime())
    && value.getFullYear() === now.getFullYear()
    && value.getMonth() === now.getMonth();
}

export function calculateTotals(transactions: Transaction[]) {
  // "Ingresos registrados" conserva el total histórico de movimientos.
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Convierte todos los ingresos recurrentes a una misma base mensual.
  // Un ingreso semanal de $100 equivale a $433.33/mes aproximadamente.
  const recurringWeekly = transactions
    .filter((t) => t.type === "income" && t.frequency === "weekly")
    .reduce((sum, t) => sum + t.amount, 0)
    + transactions
      .filter((t) => t.type === "income" && t.frequency === "monthly")
      .reduce((sum, t) => sum + t.amount / WEEKS_PER_MONTH, 0);

  const recurringMonthly = transactions
    .filter((t) => t.type === "income" && t.frequency === "monthly")
    .reduce((sum, t) => sum + t.amount, 0)
    + transactions
      .filter((t) => t.type === "income" && t.frequency === "weekly")
      .reduce((sum, t) => sum + t.amount * WEEKS_PER_MONTH, 0);

  // Los gastos recurrentes también se convierten a base mensual para
  // compararlos directamente contra el ingreso mensual.
  const monthlyRecurringExpenses = transactions
    .filter((t) => t.type === "expense" && t.frequency === "monthly")
    .reduce((sum, t) => sum + t.amount, 0)
    + transactions
      .filter((t) => t.type === "expense" && t.frequency === "weekly")
      .reduce((sum, t) => sum + t.amount * WEEKS_PER_MONTH, 0);

  // Los gastos de una sola vez se consideran dentro del mes actual.
  const currentMonthOneTimeExpenses = transactions
    .filter((t) => t.type === "expense" && (!t.frequency || t.frequency === "once") && isCurrentMonth(t.date))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyRecurringExpenses + currentMonthOneTimeExpenses;

  // El balance principal de Finanzas ahora representa lo que queda del
  // ingreso mensual después de cubrir los gastos mensuales equivalentes.
  const monthlyBalance = recurringMonthly - monthlyExpenses;
  const expenseRate = recurringMonthly > 0 ? (monthlyExpenses / recurringMonthly) * 100 : 0;

  return {
    income,
    expenses: monthlyExpenses,
    totalExpenses,
    balance: monthlyBalance,
    monthlyIncome: recurringMonthly,
    monthlyExpenses,
    monthlyBalance,
    expenseRate,
    recurringWeekly,
    recurringMonthly,
  };
}

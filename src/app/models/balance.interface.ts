// ========== INTERFACES DEL FRONTEND (camelCase) ==========
export interface ExpenseDetail {
  type: 'income' | 'expense';
  concept: string;
  amountARS: number;
  amountUSD?: number;
  fee?: {
    current: number;
    total: number;
  };
  selected: boolean;
}

export interface FinancialData {
  year: string;
  month: string;
  expenseDetails: ExpenseDetail[];
  grossSalary: number;
  dollarAmount: number;
  maxSalaryLastSixMonths?: number;
}

export interface BalanceDetailModalData {
  mode: 'create' | 'edit';
  detail?: ExpenseDetail;
  balanceId?: string;
}

export interface BalanceModalData {
  mode: 'create' | 'edit';
  year: number;
  month: number;             // 0-11
  currentGrossSalary?: number;
  currentDollarAmount?: number;
}

// ========== INTERFACES DEL BACKEND (snake_case) ==========
export interface BackendExpenseDetail {
  id: string;
  monthly_balance_id: string;
  type: 'income' | 'expense';
  concept: string;
  amount_ars: number;
  amount_usd: number;
  fee_current?: number;
  fee_total?: number;
  selected: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BackendMonthlyBalance {
  id: string;
  user_id: string;
  year: number;
  month: number;
  gross_salary: number;
  dollar_amount: number;
  max_salary_last_six_months?: number;
  created_at: Date;
  updated_at: Date;
  expense_details?: BackendExpenseDetail[];
}

// ========== PAYLOADS PARA API ==========
export interface CreateMonthlyBalancePayload {
  year: number;
  month: number;
  grossSalary: number;
  dollarAmount: number;
  maxSalaryLastSixMonths?: number;
  expenseDetails: CreateExpenseDetailPayload[];
}

export interface CreateExpenseDetailPayload {
  type: 'income' | 'expense';
  concept: string;
  amountARS?: number;
  amountUSD?: number;
  feeCurrent?: number;
  feeTotal?: number;
  selected?: boolean;
}

export interface BalanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeARS: number;
  incomeUSD: number;
  expensesARS: number;
  expensesUSD: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

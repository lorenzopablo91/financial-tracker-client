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
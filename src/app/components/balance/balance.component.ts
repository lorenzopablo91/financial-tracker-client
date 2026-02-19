import { Component, computed, OnInit, signal, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, finalize, retry, takeUntil } from 'rxjs';
import { FinancialData, BackendMonthlyBalance, ExpenseDetail } from '../../models/balance.interface';
import { MaterialImports } from '../../shared/imports/material-imports';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MONTHS_ES } from '../../data/date-values';
import { MatDatepicker } from '@angular/material/datepicker';
import { BalanceCardComponent, BalanceUpdatePayload } from './balance-card/balance-card.component';
import { BalanceGridComponent } from './balance-grid/balance-grid.component';
import { BalanceService } from '../../services/balance.service';
import { ToastService } from '../../shared/services/toast.service';
import { MonthYearDateAdapter } from '../../shared/controllers/month-year-date.controller';
import { MONTH_YEAR_FORMATS } from '../../data/month-year-formats';
import { AuthService } from '../../shared/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { BalanceModalComponent } from './balance-modal/balance-modal.component';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    ...MaterialImports,
    CommonModule,
    ReactiveFormsModule,
    BalanceCardComponent,
    BalanceGridComponent
  ],
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: MonthYearDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS }
  ],
})
export class BalanceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  monthYearControl = new FormControl();

  // Signal que contiene todos los balances del backend
  private _balances = signal<BackendMonthlyBalance[]>([]);

  // Signal de carga
  readonly isLoading = signal<boolean>(false);

  // Signals para manejar el estado
  private _selectedMonth = signal<number | null>(null);
  private _selectedYear = signal<number | null>(null);
  private _monthYearConfirmed = signal<boolean>(false);

  // Computed signals públicos
  selectedMonth = computed(() => this._selectedMonth());
  selectedYear = computed(() => this._selectedYear());
  monthYearConfirmed = computed(() => this._monthYearConfirmed());
  selectedMonthName = computed(() => {
    const month = this._selectedMonth();
    return month !== null ? MONTHS_ES[month] : '';
  });

  // Computed signal que devuelve el balance del mes seleccionado
  currentMonthData = computed(() => {
    const month = this._selectedMonth();
    const year = this._selectedYear();
    const confirmed = this._monthYearConfirmed();

    if (month === null || year === null || !confirmed) return null;

    return this.getBalanceForMonthYear(month, year);
  });

  // Computed que convierte BackendMonthlyBalance al formato FinancialData
  currentMonthFinancialData = computed((): FinancialData | null => {
    const balance = this.currentMonthData();

    if (!balance) return null;

    const monthName = MONTHS_ES[balance.month - 1];

    const financialData: FinancialData = {
      year: balance.year.toString(),
      month: monthName,
      grossSalary: balance.gross_salary,
      dollarAmount: balance.dollar_amount,
      maxSalaryLastSixMonths: balance.max_salary_last_six_months,
      expenseDetails: (balance.expense_details || []).map(detail => ({
        type: detail.type,
        concept: detail.concept,
        amountARS: detail.amount_ars || 0,
        amountUSD: detail.amount_usd || 0,
        fee: detail.fee_current && detail.fee_total
          ? { current: detail.fee_current, total: detail.fee_total }
          : undefined,
        selected: detail.selected
      }))
    };

    return financialData;
  });

  private getBalanceForMonthYear(month: number, year: number): BackendMonthlyBalance | null {
    const monthNumber = month + 1;
    const allBalances = this._balances();
    const balance = allBalances.find(
      (b) => b.year === year && b.month === monthNumber
    );

    return balance || null;
  }

  constructor(
    private balanceService: BalanceService,
    private toastService: ToastService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadAllBalances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  private loadAllBalances(): void {
    this.isLoading.set(true);

    this.balanceService.getAllBalances()
      .pipe(
        retry(1),
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._balances.set(response.data);
            this.toastService.success('Balances cargados correctamente');
          }
        },
      });
  }

  previousMonth(): void {
    const currentDate = this.monthYearControl.value;
    if (!currentDate) return;

    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    previousMonth.setDate(1);

    this.monthYearControl.setValue(previousMonth);
    this._selectedMonth.set(previousMonth.getMonth());
    this._selectedYear.set(previousMonth.getFullYear());
    this._monthYearConfirmed.set(true);
  }

  nextMonth(): void {
    const currentDate = this.monthYearControl.value;
    if (!currentDate) return;

    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    this.monthYearControl.setValue(nextMonth);
    this._selectedMonth.set(nextMonth.getMonth());
    this._selectedYear.set(nextMonth.getFullYear());
    this._monthYearConfirmed.set(true);
  }

  chosenYearHandler(normalizedYear: Date): void {
    this._selectedYear.set(normalizedYear.getFullYear());
    this._monthYearConfirmed.set(false);
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>): void {
    const selectedYear = this._selectedYear();

    if (selectedYear === null) return;

    const month = normalizedMonth.getMonth();
    const date = new Date(selectedYear, month, 1);

    this.monthYearControl.setValue(date);
    this._selectedMonth.set(month);
    this._selectedYear.set(selectedYear);
    this._monthYearConfirmed.set(true);

    datepicker.close();
  }

  onToggleSelection(index: number): void {
    const currentBalance = this.currentMonthData();
    if (!currentBalance || !currentBalance.expense_details) return;

    const detail = currentBalance.expense_details[index];
    if (!detail) return;

    // Actualizar localmente primero
    const updatedBalances = this._balances().map(balance => {
      if (balance.id === currentBalance.id) {
        return {
          ...balance,
          expense_details: balance.expense_details?.map((d, i) =>
            i === index ? { ...d, selected: !d.selected } : d
          )
        };
      }
      return balance;
    });
    this._balances.set(updatedBalances);

    // Actualizar en el backend
    this.balanceService.updateExpenseDetail(detail.id, {
      selected: !detail.selected
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.revertSelection(currentBalance.id, index);
          }
        },
        error: () => {
          this.revertSelection(currentBalance.id, index);
        }
      });
  }

  private revertSelection(balanceId: string, index: number): void {
    this._balances.set(this._balances().map(balance => {
      if (balance.id === balanceId) {
        return {
          ...balance,
          expense_details: balance.expense_details?.map((d, i) =>
            i === index ? { ...d, selected: !d.selected } : d
          )
        };
      }
      return balance;
    }));
  }

  refreshData(): void {
    this.loadAllBalances();
  }

  /**
   * Abre el modal para crear un nuevo balance
   */
  onCreateBalance(): void {
    const month = this._selectedMonth();
    const year = this._selectedYear();

    if (month === null || year === null) return;

    const dialogRef = this.dialog.open(BalanceModalComponent, {
      width: '600px',
      data: { mode: 'create', month, year }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (payload) {
          this.balanceService.createBalance(payload)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response) => {
                if (response.success) {
                  this.toastService.success('Balance creado exitosamente');
                  this.loadAllBalances();
                }
              },
              error: (error) => {
                console.error('Error creating balance:', error);
              }
            });
        }
      });
  }

  /**
   * Recibe el evento del balance-card y persiste los cambios en el backend.
   * El signal local ya fue actualizado optimistamente dentro del card.
   */
  onEditBalance(payload: BalanceUpdatePayload): void {
    const currentBalance = this.currentMonthData();
    if (!currentBalance) return;

    this.balanceService.updateBalance(currentBalance.id, {
      grossSalary: payload.grossSalary,
      dollarAmount: payload.dollarAmount
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Balance actualizado exitosamente');
            // Actualizar el signal central para mantener consistencia
            this._balances.update(balances =>
              balances.map(b =>
                b.id === currentBalance.id
                  ? { ...b, gross_salary: payload.grossSalary, dollar_amount: payload.dollarAmount }
                  : b
              )
            );
          }
        },
        error: (error) => {
          console.error('Error updating balance:', error);
          this.toastService.success('Error al actualizar el balance');
          // Recargar para revertir el cambio optimista del card
          this.loadAllBalances();
        }
      });
  }

  /**
   * Agrega un nuevo detalle
   */
  onAddDetail(payload: any): void {
    const currentBalance = this.currentMonthData();
    if (!currentBalance) return;

    this.balanceService.addExpenseDetail(currentBalance.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Gasto fijo agregado exitosamente');
            this.loadAllBalances();
          }
        }
      });
  }

  /**
   * Edita un detalle existente
   */
  onEditDetail(event: { index: number; detail: any }): void {
    const currentBalance = this.currentMonthData();
    if (!currentBalance || !currentBalance.expense_details) return;

    const detail = currentBalance.expense_details[event.index];
    if (!detail) return;

    this.balanceService.updateExpenseDetail(detail.id, event.detail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Gasto fijo actualizado exitosamente');
            this.loadAllBalances();
          }
        }
      });
  }

  /**
   * Elimina un detalle
   */
  onDeleteDetail(event: { detail: ExpenseDetail; index: number }): void {
    const currentBalance = this.currentMonthData();
    if (!currentBalance || !currentBalance.expense_details) return;

    const backendDetail = currentBalance.expense_details[event.index];
    if (!backendDetail) return;

    this.balanceService.deleteExpenseDetail(backendDetail.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Gasto fijo eliminado exitosamente');
          this.loadAllBalances();
        }
      });
  }
}
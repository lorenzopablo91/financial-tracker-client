import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancialData } from '../../models/balance.interface';
// import { BALANCE_DATA } from '../../data/balance.data';
import { MaterialImports } from '../../shared/imports/material-imports';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { DATE_FORMATS } from '../../data/date-formats';
import { MatDatepicker } from '@angular/material/datepicker';
import { BalanceCardComponent } from './balance-card/balance-card.component';
import { BalanceGridComponent } from './balance-grid/balance-grid.component';
import { esDateController } from '../../shared/controllers/es-date.controller';
import { MONTHS_ES } from '../../data/date-values';

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
    { provide: DateAdapter, useClass: esDateController },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
  ],
})

export class BalanceComponent implements OnInit {
  monthYearControl = new FormControl();

  // Signal writable que contiene los datos (en lugar de usar la constante directamente)
  private _balanceData = signal<Array<FinancialData>>([]); //TODO: ...BALANCE_DATA

  // Signals para manejar el estado
  private _selectedMonth = signal<number | null>(null);
  private _selectedYear = signal<number | null>(null);
  private _monthYearConfirmed = signal<boolean>(false);

  // Computed signals públicos para usar en el template
  selectedMonth = computed(() => this._selectedMonth());
  selectedYear = computed(() => this._selectedYear());
  monthYearConfirmed = computed(() => this._monthYearConfirmed());
  selectedMonthName = computed(() => {
    const month = this._selectedMonth();
    return month !== null ? MONTHS_ES[month] : '';
  });

  // Computed signal que solo se actualiza cuando se ha confirmado mes y año
  currentMonthData = computed(() => {
    const month = this._selectedMonth();
    const year = this._selectedYear();
    const confirmed = this._monthYearConfirmed();

    if (month === null || year === null || !confirmed) return null;

    return this.getDataForMonthYear(month, year);
  });

  ngOnInit(): void {
    this.initializeWithCurrentDate();
  }

  private initializeWithCurrentDate(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Establecer la fecha actual en el control del datepicker
    this.monthYearControl.setValue(now);

    // Establecer los signals con la fecha actual
    this._selectedMonth.set(currentMonth);
    this._selectedYear.set(currentYear);
    this._monthYearConfirmed.set(true);
  }

  chosenYearHandler(normalizedYear: Date): void {
    this._selectedYear.set(normalizedYear.getFullYear());
    this._monthYearConfirmed.set(false);
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>): void {
    const year = this._selectedYear();
    if (year === null) return;

    const month = normalizedMonth.getMonth();
    const date = new Date(year, month, 1);

    this.monthYearControl.setValue(date);
    this._selectedMonth.set(month);
    this._monthYearConfirmed.set(true);

    datepicker.close();
  }

  private getDataForMonthYear(month: number, year: number): FinancialData | null {
    const monthName = MONTHS_ES[month];
    const data = this._balanceData().find(
      (d) =>
        d.year === year.toString() &&
        d.month.toLowerCase() === monthName.toLowerCase()
    );

    return data || null;
  }

  onToggleSelection(index: number): void {
    const month = this._selectedMonth();
    const year = this._selectedYear();
    const confirmed = this._monthYearConfirmed();

    if (month === null || year === null || !confirmed) return;

    const monthName = MONTHS_ES[month];
    const currentData = this._balanceData();

    // Encontrar el índice del mes/año actual en el array
    const dataIndex = currentData.findIndex(
      (d) => d.year === year.toString() &&
        d.month.toLowerCase() === monthName.toLowerCase()
    );

    if (dataIndex === -1) return;

    // Crear una copia del array con los datos actualizados
    const updatedData = currentData.map((data, i) => {
      if (i === dataIndex) {
        return {
          ...data,
          expenseDetails: data.expenseDetails.map((item, expenseIndex) =>
            expenseIndex === index ? { ...item, selected: !item.selected } : item
          )
        };
      }
      return data;
    });

    // Actualizar el signal con los nuevos datos
    this._balanceData.set(updatedData);
  }

  previousMonth() {
    const currentDate = this.monthYearControl.value;
    if (!currentDate) return;

    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    this.monthYearControl.setValue(previousMonth);
    this._selectedMonth.set(previousMonth.getMonth());
    this._selectedYear.set(previousMonth.getFullYear());
    this._monthYearConfirmed.set(true);
  }

  nextMonth() {
    const currentDate = this.monthYearControl.value;
    if (!currentDate) return;

    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.monthYearControl.setValue(nextMonth);
    this._selectedMonth.set(nextMonth.getMonth());
    this._selectedYear.set(nextMonth.getFullYear());
    this._monthYearConfirmed.set(true);
  }
  
}
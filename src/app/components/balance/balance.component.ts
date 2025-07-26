import { Component, computed, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FinancialData } from '../../models/balance.interface';
import { BALANCE_DATA } from '../../data/balance.data';
import { MaterialImports } from '../../shared/imports/material-imports';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { esDateCotroller } from '../../shared/controllers/es-date.controller';
import { DATE_FORMATS } from '../../data/date-formats';
import { MONTHS_ES } from '../../data/months';
import { MatDatepicker } from '@angular/material/datepicker';
import { BalanceCardComponent } from './balance-card/balance-card.component';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    ...MaterialImports,
    CommonModule,
    ReactiveFormsModule,
    BalanceCardComponent
  ],
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: esDateCotroller },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS },
  ],
})

export class BalanceComponent implements OnInit {
  monthYearControl = new FormControl();

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
    const data = BALANCE_DATA.find(
      (d) =>
        d.year === year.toString() &&
        d.month.toLowerCase() === monthName.toLowerCase()
    );

    return data || null;
  }
}

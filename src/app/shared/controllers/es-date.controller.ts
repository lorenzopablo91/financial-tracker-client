import { NativeDateAdapter } from '@angular/material/core';
import { DAYS_ES, DAYS_ES_NARROW, DAYS_ES_SHORT, MONTHS_ES, MONTHS_ES_SHORT } from '../../data/date-values';

export class esDateController extends NativeDateAdapter {
  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (style === 'short' || style === 'narrow') {
      return MONTHS_ES_SHORT;
    }
    return MONTHS_ES;
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (style === 'long') {
      return DAYS_ES;
    }
    if (style === 'short') {
      return DAYS_ES_SHORT;
    }
    return DAYS_ES_NARROW;
  }

  override getFirstDayOfWeek(): number {
    return 1; // Lunes como primer día de la semana
  }

  override format(date: Date, displayFormat: Object): string {
    if (!date) return '';

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Formato DD/MM/AAAA
    return `${this._to2digit(day)}/${this._to2digit(month)}/${year}`;
  }

  override parse(value: any): Date | null {
    if (!value) return null;

    if (typeof value === 'string') {
      // Intentar parsear formato DD/MM/AAAA
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Los meses van de 0-11
        const year = parseInt(parts[2], 10);

        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const date = new Date(year, month, day);
          // Verificar que la fecha sea válida
          if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
            return date;
          }
        }
      }
    }

    return super.parse(value);
  }

  private _to2digit(n: number): string {
    return ('00' + n).slice(-2);
  }
}
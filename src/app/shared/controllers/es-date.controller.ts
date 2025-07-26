import { NativeDateAdapter } from '@angular/material/core';
import { MONTHS_ES } from '../../data/months';

export class esDateCotroller extends NativeDateAdapter {
  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return MONTHS_ES;
  }

  override format(date: Date, displayFormat: Object): string {
    if (!date) return '';
    return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
  }
}

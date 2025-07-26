import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(amount: number, currency: 'ARS' | 'USD' = 'ARS'): string {
    const locales = currency === 'ARS' ? 'es-AR' : 'en-US';

    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

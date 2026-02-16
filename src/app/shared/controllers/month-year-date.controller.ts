import { NativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';

@Injectable()
export class MonthYearDateAdapter extends NativeDateAdapter {
    override parse(value: any): Date | null {
        if (typeof value === 'string') {
            const parts = value.split('/');
            if (parts.length === 2) {
                const month = parseInt(parts[0], 10);
                const year = parseInt(parts[1], 10);
                return new Date(year, month - 1, 1);
            }
        }
        return super.parse(value);
    }

    override format(date: Date, displayFormat: Object): string {
        if (displayFormat === 'input') {
            const month = date.toLocaleString('es-ES', { month: 'long' });
            const year = date.getFullYear();
            return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + year;
        }
        return super.format(date, displayFormat);
    }
}
import { MatDateFormats } from '@angular/material/core';

export const MONTH_YEAR_FORMATS: MatDateFormats = {
    parse: {
        dateInput: 'MM/YYYY',
    },
    display: {
        dateInput: 'input',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};
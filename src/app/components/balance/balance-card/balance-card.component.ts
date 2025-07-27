import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { FinancialData } from '../../../models/balance.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { MaterialImports } from '../../../shared/imports/material-imports';

@Component({
    selector: 'app-balance-card',
    standalone: true,
    imports: [
        CommonModule,
        ...MaterialImports,
        CurrencyFormatPipe
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './balance-card.component.html',
    styleUrls: ['./balance-card.component.scss']
})
export class BalanceCardComponent implements OnChanges {
    @Input({ required: true }) monthlyData!: FinancialData;

    // Signal interno para manejar los cambios
    private monthlyDataSignal = signal<FinancialData>({} as FinancialData);

    // Constantes para los cálculos
    readonly RETIREMENT = 0.11;
    readonly SOCIAL_SECURITY = 0.03;
    readonly LAW_19032 = 0.03;

    // Constantes para los porcentajes de gastos y ahorros
    readonly FIXED_EXPENSES_PERCENT = 0.50;
    readonly VARIABLE_EXPENSES_PERCENT = 0.30;
    readonly SAVINGS_PERCENT = 0.20;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['monthlyData'] && changes['monthlyData'].currentValue) {
            this.monthlyDataSignal.set(changes['monthlyData'].currentValue);
        }
    }

    // Computed signals para los cálculos
    netSalaryARS = computed(() => {
        const data = this.monthlyDataSignal();
        if (!data.grossSalary) return 0;

        const grossSalary = data.grossSalary;
        const retirement = grossSalary * this.RETIREMENT;
        const socialSecurity = grossSalary * this.SOCIAL_SECURITY;
        const law19032 = grossSalary * this.LAW_19032;
        return grossSalary - retirement - socialSecurity - law19032;
    });

    netSalaryUSD = computed(() => {
        const data = this.monthlyDataSignal();
        if (!data.dollarAmount) return 0;
        return this.netSalaryARS() / data.dollarAmount;
    });

    fixedExpenses = computed(() => {
        return this.netSalaryARS() * this.FIXED_EXPENSES_PERCENT;
    });

    variableExpenses = computed(() => {
        return this.netSalaryARS() * this.VARIABLE_EXPENSES_PERCENT;
    });

    savings = computed(() => {
        return this.netSalaryARS() * this.SAVINGS_PERCENT;
    });

    showAguinaldo = computed(() => {
        const data = this.monthlyDataSignal();
        return data.month === 'Julio' || data.month === 'Diciembre';
    });

    aguinaldo = computed(() => {
        const data = this.monthlyDataSignal();
        if (!data.maxSalaryLastSixMonths) return 0;

        const grossSalary = data.maxSalaryLastSixMonths;
        const retirement = grossSalary * this.RETIREMENT;
        const socialSecurity = grossSalary * this.SOCIAL_SECURITY;
        const law19032 = grossSalary * this.LAW_19032;
        const netSalary = grossSalary - retirement - socialSecurity - law19032;
        return (netSalary / 12) * 6;
    });

    aguinaldoUSD = computed(() => {
        const data = this.monthlyDataSignal();
        if (!data.dollarAmount) return 0;
        return this.aguinaldo() / data.dollarAmount;
    });

    // Getters para acceder a los datos desde el template
    get currentMonthData() {
        return this.monthlyDataSignal();
    }

    // Formateadores de moneda
    formatARS(amount: number): string {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }

    formatUSD(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { ExpenseDetail, FinancialData } from '../../../models/balance.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

@Component({
    selector: 'app-balance-grid',
    standalone: true,
    imports: [CommonModule, ...MaterialImports, CurrencyFormatPipe],
    templateUrl: './balance-grid.component.html',
    styleUrls: ['./balance-grid.component.scss']
})

export class BalanceGridComponent {
    @Input() monthlyData!: FinancialData;
    @Output() toggleSelection = new EventEmitter<number>();

    displayedColumns: string[] = ['selected', 'concept', 'fee', 'amountARS', 'amountUSD'];

    get tableDataSource(): ExpenseDetail[] {
        return this.monthlyData.expenseDetails;
    }

    get totalARS(): number {
        return this.monthlyData.expenseDetails.reduce((sum, item) => {
            const multiplier = item.type === 'income' ? 1 : -1;
            return sum + (item.amountARS * multiplier);
        }, 0);
    }

    get totalUSD(): number {
        return this.monthlyData.expenseDetails.reduce((sum, item) => {
            return sum + (item.amountUSD || 0);
        }, 0);
    }

    getTotalARSAbsolute(): number {
        return Math.abs(this.totalARS);
    }

    onToggleSelection(index: number): void {
        this.toggleSelection.emit(index);
    }
}
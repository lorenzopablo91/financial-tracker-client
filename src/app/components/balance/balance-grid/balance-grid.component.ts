import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { ExpenseDetail, FinancialData } from '../../../models/balance.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { BalanceDetailModalComponent } from '../balance-detail-modal/balance-detail-modal.component';

@Component({
    selector: 'app-balance-grid',
    standalone: true,
    imports: [CommonModule, ...MaterialImports, CurrencyFormatPipe],
    templateUrl: './balance-grid.component.html',
    styleUrls: ['./balance-grid.component.scss']
})
export class BalanceGridComponent {
    @Input() monthlyData!: FinancialData;
    @Input() balanceId!: string;
    @Output() toggleSelection = new EventEmitter<number>();
    @Output() addDetail = new EventEmitter<any>();
    @Output() editDetail = new EventEmitter<{ index: number; detail: any }>();
    @Output() deleteDetail = new EventEmitter<{ detail: ExpenseDetail; index: number }>();

    displayedColumns: string[] = ['selected', 'concept', 'fee', 'amountARS', 'amountUSD', 'actions'];

    constructor(private dialog: MatDialog) { }

    get tableDataSource(): ExpenseDetail[] {
        return [...this.monthlyData.expenseDetails].sort((a, b) => {
            if (a.type === b.type) return 0;
            return a.type === 'income' ? -1 : 1;
        });
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

    onAdd(): void {
        const dialogRef = this.dialog.open(BalanceDetailModalComponent, {
            width: '600px',
            data: { mode: 'create', balanceId: this.balanceId }
        });

        dialogRef.afterClosed().subscribe(payload => {
            if (payload) {
                this.addDetail.emit(payload);
            }
        });
    }

    onEdit(detail: ExpenseDetail, index: number): void {
        // Obtener el índice real en el array original (sin ordenar)
        const originalIndex = this.monthlyData.expenseDetails.indexOf(detail);

        const dialogRef = this.dialog.open(BalanceDetailModalComponent, {
            width: '600px',
            data: { mode: 'edit', detail, balanceId: this.balanceId }
        });

        dialogRef.afterClosed().subscribe(payload => {
            if (payload) {
                this.editDetail.emit({ index: originalIndex, detail: payload });
            }
        });
    }

    onDelete(detail: ExpenseDetail, index: number): void {
        // Obtener el índice real en el array original (sin ordenar)
        const originalIndex = this.monthlyData.expenseDetails.indexOf(detail);
        this.deleteDetail.emit({ detail, index: originalIndex });
    }
}
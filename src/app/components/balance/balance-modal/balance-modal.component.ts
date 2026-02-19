import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { MONTHS_ES } from '../../../data/date-values';
import { BalanceModalData } from '../../../models/balance.interface';

@Component({
    selector: 'app-create-balance-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ...MaterialImports],
    templateUrl: './balance-modal.component.html',
    styleUrl: './balance-modal.component.scss'
})
export class BalanceModalComponent {
    form: FormGroup;
    monthName: string;
    isEditMode: boolean;

    // Constantes para cálculo de salario neto
    private readonly TAX_RATE = 0.17; // 11% jubilación + 3% obra social + 3% ley 19032

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<BalanceModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BalanceModalData
    ) {
        this.monthName = MONTHS_ES[data.month];
        this.isEditMode = data.mode === 'edit';

        this.form = this.fb.group({
            grossSalary: [
                data.currentGrossSalary ?? 0,
                [Validators.required, Validators.min(1)]
            ],
            dollarAmount: [
                data.currentDollarAmount ?? 0,
                [Validators.required, Validators.min(1)]
            ]
        });
    }

    calculateNetSalary(): number {
        const grossSalary = this.form.get('grossSalary')?.value || 0;
        return grossSalary * (1 - this.TAX_RATE);
    }

    calculateNetSalaryUSD(): number {
        const netSalary = this.calculateNetSalary();
        const dollarAmount = this.form.get('dollarAmount')?.value || 1;
        return netSalary / dollarAmount;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onCreate(): void {
        if (this.form.valid) {
            const payload = {
                year: this.data.year,
                month: this.data.month + 1, // Convertir de 0-11 a 1-12
                grossSalary: this.form.value.grossSalary,
                dollarAmount: this.form.value.dollarAmount,
                expenseDetails: []
            };

            this.dialogRef.close(payload);
        }
    }
}
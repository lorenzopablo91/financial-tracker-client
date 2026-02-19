import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { BalanceDetailModalData } from '../../../models/balance.interface';

@Component({
    selector: 'app-balance-detail-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ...MaterialImports],
    templateUrl: './balance-detail-modal.component.html',
    styleUrl: './balance-detail-modal.component.scss'
})
export class BalanceDetailModalComponent implements OnInit {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<BalanceDetailModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BalanceDetailModalData
    ) {
        this.form = this.fb.group({
            type: ['expense', Validators.required],
            concept: ['', Validators.required],
            amountARS: [0, [Validators.min(0)]],
            amountUSD: [0, [Validators.min(0)]],
            hasFee: [false],
            feeCurrent: [null],
            feeTotal: [null],
            selected: [true]
        });

        // Escuchar cambios en hasFee
        this.form.get('hasFee')?.valueChanges.subscribe(hasFee => {
            const feeCurrentControl = this.form.get('feeCurrent');
            const feeTotalControl = this.form.get('feeTotal');

            if (hasFee) {
                feeCurrentControl?.setValidators([Validators.required, Validators.min(1)]);
                feeTotalControl?.setValidators([Validators.required, Validators.min(1)]);
            } else {
                feeCurrentControl?.clearValidators();
                feeTotalControl?.clearValidators();
                feeCurrentControl?.setValue(null);
                feeTotalControl?.setValue(null);
            }

            feeCurrentControl?.updateValueAndValidity();
            feeTotalControl?.updateValueAndValidity();
        });
    }

    ngOnInit(): void {
        if (this.data.mode === 'edit' && this.data.detail) {
            const detail = this.data.detail;
            const hasFee = !!(detail.fee?.current && detail.fee?.total);

            this.form.patchValue({
                type: detail.type,
                concept: detail.concept,
                amountARS: detail.amountARS,
                amountUSD: detail.amountUSD || 0,
                hasFee: hasFee,
                feeCurrent: detail.fee?.current,
                feeTotal: detail.fee?.total,
                selected: detail.selected
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.form.valid) {
            const formValue = this.form.value;
            const payload = {
                type: formValue.type,
                concept: formValue.concept,
                amountARS: formValue.amountARS,
                amountUSD: formValue.amountUSD,
                feeCurrent: formValue.hasFee ? formValue.feeCurrent : undefined,
                feeTotal: formValue.hasFee ? formValue.feeTotal : undefined,
                selected: formValue.selected
            };

            this.dialogRef.close(payload);
        }
    }
}
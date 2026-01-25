import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MaterialImports } from '../../../../shared/imports/material-imports';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { OPERATION_COLORS, OPERATION_ICONS, OPERATIONS_TYPES } from '../../../../data/portfolio.data';
import { TransactionModalData, PortfolioAsset, TransactionFormResult } from '../../../../models/portfolio.interface';

@Component({
    selector: 'app-portfolio-transactions-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MaterialImports,
        CurrencyFormatPipe
    ],
    templateUrl: './portfolio-transactions-modal.component.html',
    styleUrl: './portfolio-transactions-modal.component.scss'
})
export class PortfolioTransactionsModalComponent implements OnInit {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<PortfolioTransactionsModalComponent>);
    data = inject<TransactionModalData>(MAT_DIALOG_DATA);

    transactionForm!: FormGroup;
    isSubmitting = signal(false);
    selectedAsset = signal<PortfolioAsset | null>(null);
    selectedAssetType = signal<string | null>(null);

    ngOnInit() {
        this.initializeForm();
    }

    private initializeForm() {
        const operationType = this.data.operationType;

        // Form base
        const formConfig: any = {
            notas: ['']
        };

        // Configuración según tipo de operación
        if (operationType === 'APORTE' || operationType === 'RETIRO') {
            formConfig.montoUSD = ['', [Validators.required, Validators.min(0.01)]];
        }

        if (operationType === 'VENTA') {
            formConfig.activoId = ['', Validators.required];
            formConfig.cantidad = ['', [Validators.required, Validators.min(0.00000001)]];
            formConfig.precioUSD = [''];
            formConfig.precioARS = [''];
            formConfig.tipoCambio = [''];
        }

        if (operationType === 'COMPRA') {
            formConfig.activoPrefijo = ['', [Validators.required, Validators.maxLength(10)]];
            formConfig.activoNombre = ['', Validators.required];
            formConfig.activoTipo = ['', Validators.required];
            formConfig.cantidad = ['', [Validators.required, Validators.min(0.00000001)]];
            formConfig.precioUSD = [''];
            formConfig.precioARS = [''];
            formConfig.tipoCambio = [''];
        }

        this.transactionForm = this.fb.group(formConfig);
    }

    // Cuando se selecciona un activo en VENTA
    onAssetSelected(assetId: string) {
        const asset = this.data.portfolioAssets?.find(a => a.id === assetId);
        if (asset) {
            this.selectedAsset.set(asset);
            this.selectedAssetType.set(asset.tipo);

            // Agregar validación de cantidad máxima
            const cantidadControl = this.transactionForm.get('cantidad');
            if (cantidadControl) {
                cantidadControl.setValidators([
                    Validators.required,
                    Validators.min(0.00000001),
                    Validators.max(parseFloat(asset.cantidad))
                ]);
                cantidadControl.updateValueAndValidity();
            }

            // Configurar campos según tipo de activo
            this.updatePriceFields(asset.tipo);
        }
    }

    // Cuando se selecciona tipo de activo en COMPRA
    onAssetTypeChange(tipo: string) {
        this.selectedAssetType.set(tipo);
        this.updatePriceFields(tipo);
    }

    // Actualizar campos de precio según tipo de activo
    private updatePriceFields(tipo: string) {
        const precioUSDControl = this.transactionForm.get('precioUSD');
        const precioARSControl = this.transactionForm.get('precioARS');
        const tipoCambioControl = this.transactionForm.get('tipoCambio');

        if (tipo === 'Accion') {
            // Para acciones: ARS + Tipo de cambio
            precioUSDControl?.clearValidators();
            precioARSControl?.setValidators([Validators.required, Validators.min(0.01)]);
            tipoCambioControl?.setValidators([Validators.required, Validators.min(0.01)]);
        } else {
            // Para otros activos: solo USD
            precioUSDControl?.setValidators([Validators.required, Validators.min(0.01)]);
            precioARSControl?.clearValidators();
            tipoCambioControl?.clearValidators();
        }

        precioUSDControl?.updateValueAndValidity();
        precioARSControl?.updateValueAndValidity();
        tipoCambioControl?.updateValueAndValidity();
    }

    // Calcular precio en USD desde ARS y tipo de cambio
    calculatePriceUSD(): number {
        const precioARS = this.transactionForm.get('precioARS')?.value;
        const tipoCambio = this.transactionForm.get('tipoCambio')?.value;

        if (precioARS && tipoCambio && tipoCambio > 0) {
            return precioARS / tipoCambio;
        }

        return 0;
    }

    // Calcular monto total
    calculateTotal(): number {
        const cantidad = this.transactionForm.get('cantidad')?.value;
        let precioUSD = this.transactionForm.get('precioUSD')?.value;

        // Si es ACCION, usar el precio calculado
        if (this.selectedAssetType() === 'Accion') {
            precioUSD = this.calculatePriceUSD();
        }

        if (cantidad && precioUSD) {
            return cantidad * precioUSD;
        }

        return 0;
    }

    // Obtener color de operación
    getOperationColor(): string {
        return OPERATION_COLORS[this.data.operationType] ?? '#0c0c0cff';
    }

    // Obtener ícono de operación
    getOperationIcon(): string {
        return OPERATION_ICONS[this.data.operationType] ?? 'help_outline';
    }

    // Obtener color del tipo de activo
    getAssetTypeColor(tipo: string): string {
        const config = OPERATIONS_TYPES[tipo as keyof typeof OPERATIONS_TYPES];
        return config?.color || '#999999';
    }

    // Obtener ícono del tipo de activo
    getAssetTypeIcon(tipo: string): string {
        const config = OPERATIONS_TYPES[tipo as keyof typeof OPERATIONS_TYPES];
        return config?.icon || 'help_outline';
    }

    // Obtener título de operación
    getOperationTitle(): string {
        const titles: Record<string, string> = {
            'APORTE': 'Ingresar Dinero',
            'RETIRO': 'Retirar Dinero',
            'COMPRA': 'Comprar Activo',
            'VENTA': 'Vender Activo'
        };
        return titles[this.data.operationType] || 'Registrar Operación';
    }

    // Obtener texto del botón
    getSubmitButtonText(): string {
        const texts: Record<string, string> = {
            'APORTE': 'Ingresar Dinero',
            'RETIRO': 'Retirar dinero',
            'COMPRA': 'Comprar activo',
            'VENTA': 'Vender activo'
        };
        return texts[this.data.operationType] || 'Registrar Operación';
    }

    // Guardar operación
    onSubmit() {
        if (this.transactionForm.valid) {
            this.isSubmitting.set(true);

            const formValue = this.transactionForm.value;
            const result: TransactionFormResult = {
                operationType: this.data.operationType,
                ...formValue
            };

            // Si es ACCION, calcular precioUSD automáticamente
            if (this.selectedAssetType() === 'Accion') {
                result.precioUSD = this.calculatePriceUSD().toString();
            }

            // Si es VENTA, agregar info del activo seleccionado
            if (this.data.operationType === 'VENTA' && this.selectedAsset()) {
                result.activoPrefijo = this.selectedAsset()!.prefijo;
                result.activoNombre = this.selectedAsset()!.nombre;
                result.activoTipo = this.selectedAsset()!.tipo;
            }

            // Cerrar el modal y devolver los datos
            this.dialogRef.close(result);
        }
    }

    // Cancelar
    onCancel() {
        this.dialogRef.close(null);
    }
}
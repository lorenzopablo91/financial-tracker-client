import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../../shared/imports/material-imports';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

export interface SavingsSplitData {
  savings: number;
  currency?: 'ARS' | 'USD';
}

@Component({
  selector: 'app-savings-split-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...MaterialImports,
    CurrencyFormatPipe
  ],
  templateUrl: './savings-split-dialog.component.html',
  styleUrls: ['./savings-split-dialog.component.scss']
})
export class SavingsSplitDialogComponent implements OnInit {
  customSavings: number = 0;
  isEditing: boolean = true;
  inputControl = new FormControl('');
  selectedCurrency: 'ARS' | 'USD' = 'ARS';
  
  // Para comparar si hay cambios
  private originalSavings: number = 0;
  private originalCurrency: 'ARS' | 'USD' = 'ARS';

  constructor(
    public dialogRef: MatDialogRef<SavingsSplitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SavingsSplitData
  ) { }

  ngOnInit() {
    this.originalSavings = this.data.savings;
    this.customSavings = this.data.savings;
    this.selectedCurrency = this.data.currency || 'ARS';
    this.originalCurrency = this.selectedCurrency;
    
    // Inicializar input con valor formateado
    this.setInputValue(this.data.savings);
  }

  handleInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/[^0-9.]/g, '');

    // Asegurarse de que solo hay un punto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }

    // Limitar decimales según la moneda
    const maxDecimals = this.getMaxDecimals();
    if (parts.length === 2 && parts[1].length > maxDecimals) {
      parts[1] = parts[1].substring(0, maxDecimals);
      value = parts.join('.');
    }

    this.inputControl.setValue(value);
  }

  setCurrency(currency: 'ARS' | 'USD'): void {
    if (this.selectedCurrency !== currency) {
      this.selectedCurrency = currency;
      // Opcional: convertir el valor actual a la nueva moneda
      // this.convertCurrency(currency);
    }
  }

  handleSave(): void {
    const numValue = this.getNumericValue();
    if (numValue > 0) {
      this.customSavings = numValue;
      this.isEditing = false;
    }
  }

  handleReset(): void {
    this.selectedCurrency = this.originalCurrency;
    this.setInputValue(this.originalSavings);
    this.customSavings = this.originalSavings;
  }

  handleBack(): void {
    this.isEditing = true;
  }

  // Métodos utilitarios
  getNumericValue(): number {
    const value = this.inputControl.value;
    return value ? parseFloat(value) : 0;
  }

  setInputValue(amount: number): void {
    const maxDecimals = this.getMaxDecimals();
    const formattedValue = amount.toFixed(maxDecimals);
    this.inputControl.setValue(formattedValue);
  }

  hasChanges(): boolean {
    return this.getNumericValue() !== this.originalSavings || 
           this.selectedCurrency !== this.originalCurrency;
  }

  private getMaxDecimals(): number {
    // ARS típicamente 2 decimales, USD también 2
    // Puedes cambiar esto si quieres ARS sin decimales
    return this.selectedCurrency === 'ARS' ? 2 : 2;
  }

  // Opcional: método para convertir entre monedas
  // private convertCurrency(newCurrency: 'ARS' | 'USD'): void {
  //   const currentValue = this.getNumericValue();
  //   if (currentValue > 0) {
  //     // Aquí implementarías la conversión
  //     // Por ejemplo, usando una tasa de cambio
  //     const exchangeRate = this.getExchangeRate();
  //     const convertedValue = this.selectedCurrency === 'USD' && newCurrency === 'ARS' 
  //       ? currentValue * exchangeRate 
  //       : currentValue / exchangeRate;
  //     this.setInputValue(convertedValue);
  //   }
  // }
}
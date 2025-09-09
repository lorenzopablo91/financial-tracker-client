import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PortfolioCategory } from '../../../models/portfolio.interface';

@Component({
    selector: 'app-wallet-performance-card',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        CurrencyFormatPipe
    ],
    templateUrl: './wallet-performance-card.component.html',
    styleUrls: ['./wallet-performance-card.component.scss']
})
export class WalletPerformanceCardComponent {
    readonly isLoading = input.required<boolean>();
    readonly hasError = input.required<boolean>();
    readonly hideAmounts = input.required<boolean>();
    readonly data = input.required<PortfolioCategory>();

    readonly cardTypeClass = computed(() => {
        const dataValue = this.data();
        return dataValue?.type ? `${dataValue.type}-performance` : 'total-performance';
    });

    readonly performanceClass = computed(() => {
        const dataValue = this.data();
        return (dataValue?.percentageGain ?? 0) >= 0 ? 'positive' : 'negative';
    });

    readonly titleClass = computed(() => {
        const dataValue = this.data();
        return dataValue?.type === 'total' ? 'performance-title-total' : 'performance-title';
    });
}
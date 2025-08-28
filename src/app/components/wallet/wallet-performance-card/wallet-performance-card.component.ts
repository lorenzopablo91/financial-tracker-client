import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PerformanceData } from '../../../models/wallet.interface';

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
    @Input() hideAmounts = computed(() => false);
    @Input() isLoading = computed(() => false);
    @Input() hasError = computed(() => false);
    @Input() data = computed<PerformanceData>(() => ({
        title: '',
        icon: '',
        amount: 0,
        difference: 0,
        percentageGain: 0,
        type: 'total'
    }));

    readonly performanceClass = computed(() =>
        this.data().percentageGain >= 0 ? 'positive' : 'negative'
    );

    readonly cardTypeClass = computed(() => {
        const type = this.data().type;
        return `${type}-performance`;
    });

    readonly titleClass = computed(() => {
        return this.data().type === 'total' ? 'performance-title-total' : 'performance-title';
    });
}
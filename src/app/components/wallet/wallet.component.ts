import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../shared/imports/material-imports';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CryptoService } from '../../services/binance.service';
import { CryptoData } from '../../models/binance.interface';
import { Category, WalletData } from '../../models/wallet.interface';
import { amounts } from '../../data/wallet.data';
import { WalletCategoriesChartComponent } from './wallet-categories-chart/wallet-categories-chart.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

@Component({
    selector: 'app-wallet',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        WalletCategoriesChartComponent,
        CurrencyFormatPipe
    ],
    templateUrl: './wallet.component.html',
    styleUrls: ['./wallet.component.scss'],
    providers: [CryptoService]
})
export class WalletComponent implements OnInit, OnDestroy {
    // Propiedades del componente
    amounts: WalletData[] = amounts;
    cryptoData: CryptoData[] = [];
    dollarTotal: number = 0;
    stockTotal: number = 0;
    cryptoTotal: number = 0;
    totalWallet: number = 0;
    dollarDifference: number = 0;
    stockDifference: number = 0;
    cryptoDifference: number = 0;
    totalDifference: number = 0;
    categories: Category[] = [];
    loading = false;
    error: string | null = null;
    lastUpdated: Date | null = null;
    hideAmounts = false;

    // Subject para manejar la destrucción del componente
    private destroy$ = new Subject<void>();

    constructor(private cryptoService: CryptoService) { }

    ngOnInit(): void {
        this.calculateHardcodedTotals();
        this.loadCryptoData();

        // Auto-refresh cada 5 minutos
        setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private calculateHardcodedTotals(): void {
        if (this.amounts.length > 0) {
            const data = this.amounts[0];

            // Calcular total en dólares
            this.dollarTotal = data.dollarAmount.dollarsBanked +
                data.dollarAmount.dollarCashed +
                data.dollarAmount.dollarInvested;

            // Calcular total en acciones (convertir pesos a dólares)
            const totalStockPesos = data.stockMarketAmount.cedearsPesos +
                data.stockMarketAmount.stockMarketPesos +
                data.stockMarketAmount.cashPesos;
            this.stockTotal = totalStockPesos / data.dollarQuote;

            // Calcular diferencias
            this.dollarDifference = this.dollarTotal - data.dollarUninvested;
            this.stockDifference = this.stockTotal - data.stockMarketUninvested;
            // cryptoDifference se calcula después cuando tengamos los datos de crypto

            // Calcular total inicial (sin crypto aún)
            this.totalWallet = this.dollarTotal + this.stockTotal;
            this.updateCategories();
        }
    }

    /**
     * Carga los datos de criptomonedas y calcula totales
     */
    loadCryptoData(): void {
        this.loading = true;
        this.error = null;

        this.cryptoService.getCryptoData()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.cryptoData = data;
                    this.calculateTotals();
                    this.updateCategories();
                    this.lastUpdated = new Date();
                    this.loading = false;
                },
                error: (error) => {
                    this.error = error.message || 'Error loading crypto data';
                    this.loading = false;
                    this.cryptoTotal = 0;
                    this.calculateTotals();
                    this.updateCategories();
                    console.error('Error loading crypto data:', error);
                }
            });
    }

    /**
     * Calcula el total de crypto y el total general
     */
    private calculateTotals(): void {
        this.cryptoTotal = this.cryptoData.reduce(
            (total, crypto) => total + crypto.valueUSD,
            0
        );

        this.totalWallet = this.dollarTotal + this.stockTotal + this.cryptoTotal;

        // Calcular diferencia de crypto y total
        if (this.amounts.length > 0) {
            const data = this.amounts[0];
            this.cryptoDifference = this.cryptoTotal - data.cryptoUninvested;

            const totalUninvested = data.dollarUninvested + data.stockMarketUninvested + data.cryptoUninvested;
            this.totalDifference = this.totalWallet - totalUninvested;
        }
    }

    /**
     * Actualiza las categorías con los datos actuales
     */
    private updateCategories(): void {
        const data = this.amounts.length > 0 ? this.amounts[0] : null;

        // Calcular diferencias
        if (data) {
            this.dollarDifference = this.dollarTotal - data.dollarUninvested;
            this.stockDifference = this.stockTotal - data.stockMarketUninvested;
            this.cryptoDifference = this.cryptoTotal - data.cryptoUninvested;

            const totalUninvested = data.dollarUninvested + data.stockMarketUninvested + data.cryptoUninvested;
            this.totalDifference = this.totalWallet - totalUninvested;
        }

        this.categories = [
            {
                name: 'DÓLARES',
                amount: this.dollarTotal,
                color: '#10b981',
                percentage: this.getPercentage(this.dollarTotal),
                difference: this.dollarDifference,
                percentageGain: data ? this.getPercentageGain(this.dollarTotal, data.dollarUninvested) : 0
            },
            {
                name: 'ACCIONES',
                amount: this.stockTotal,
                color: '#3b82f6',
                percentage: this.getPercentage(this.stockTotal),
                difference: this.stockDifference,
                percentageGain: data ? this.getPercentageGain(this.stockTotal, data.stockMarketUninvested) : 0
            },
            {
                name: 'CRYPTOMONEDAS',
                amount: this.cryptoTotal,
                color: '#f97316',
                percentage: this.getPercentage(this.cryptoTotal),
                difference: this.cryptoDifference,
                percentageGain: data ? this.getPercentageGain(this.cryptoTotal, data.cryptoUninvested) : 0
            }
        ];
    }

    /**
     * Calcula el porcentaje de ganancia
     */
    private getPercentageGain(currentAmount: number, originalAmount: number): number {
        if (originalAmount === 0) return 0;
        return Math.round(((currentAmount - originalAmount) / originalAmount) * 100 * 10) / 10;
    }

    /**
     * Obtiene el porcentaje de ganancia total
     */
    getTotalPercentageGain(): number {
        if (this.amounts.length === 0) return 0;
        const data = this.amounts[0];
        const totalUninvested = data.dollarUninvested + data.stockMarketUninvested + data.cryptoUninvested;
        return this.getPercentageGain(this.totalWallet, totalUninvested);
    }

    /**
     * Calcula el porcentaje de una categoría
     */
    private getPercentage(amount: number): number {
        if (this.totalWallet === 0) return 0;
        return Math.round((amount / this.totalWallet) * 100 * 10) / 10;
    }

    /**
     * Refresca los datos manualmente
     */
    refreshData(): void {
        if (!this.loading) {
            this.calculateHardcodedTotals();
            this.loadCryptoData();
        }
    }

    /**
     * Reintenta cargar datos en caso de error
     */
    retryLoading(): void {
        this.error = null;
        this.loadCryptoData();
    }

    /**
    * Toggle para mostrar/ocultar saldos
    */
    toggleAmountVisibility(): void {
        this.hideAmounts = !this.hideAmounts;
    }

    /**
     * Obtiene el porcentaje de ganancia de dólares
     */
    getDollarPercentageGain(): number {
        if (this.amounts.length === 0) return 0;
        const data = this.amounts[0];
        return this.getPercentageGain(this.dollarTotal, data.dollarUninvested);
    }

    /**
     * Obtiene el porcentaje de ganancia de acciones
     */
    getStockPercentageGain(): number {
        if (this.amounts.length === 0) return 0;
        const data = this.amounts[0];
        return this.getPercentageGain(this.stockTotal, data.stockMarketUninvested);
    }

    /**
     * Obtiene el porcentaje de ganancia de criptomonedas
     */
    getCryptoPercentageGain(): number {
        if (this.amounts.length === 0) return 0;
        const data = this.amounts[0];
        return this.getPercentageGain(this.cryptoTotal, data.cryptoUninvested);
    }

    /**
     * Obtiene la clase CSS para el rendimiento total
     */
    getTotalPerformanceClass(): string {
        return this.getTotalPercentageGain() >= 0 ? 'positive' : 'negative';
    }

    /**
     * Obtiene la clase CSS para el rendimiento de dólares
     */
    getDollarPerformanceClass(): string {
        return this.getDollarPercentageGain() >= 0 ? 'positive' : 'negative';
    }

    /**
     * Obtiene la clase CSS para el rendimiento de acciones
     */
    getStockPerformanceClass(): string {
        return this.getStockPercentageGain() >= 0 ? 'positive' : 'negative';
    }

    /**
     * Obtiene la clase CSS para el rendimiento de criptomonedas
     */
    getCryptoPerformanceClass(): string {
        return this.getCryptoPercentageGain() >= 0 ? 'positive' : 'negative';
    }

}
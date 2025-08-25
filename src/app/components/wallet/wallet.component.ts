import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../shared/imports/material-imports';
import { Subject, interval, catchError, of } from 'rxjs';
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
    styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit, OnDestroy {
    // Inyección de dependencias usando inject()
    private readonly cryptoService = inject(CryptoService);
    private readonly destroy$ = new Subject<void>();

    // Signals para estado reactivo
    readonly amounts = signal<WalletData[]>(amounts);
    readonly cryptoData = signal<CryptoData[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly lastUpdated = signal<Date | null>(null);
    readonly hideAmounts = signal(false);

    // Computed signals para cálculos derivados
    readonly dollarTotal = computed(() => {
        const data = this.amounts()[0];
        if (!data) return 0;
        return data.dollarAmount.dollarsBanked +
            data.dollarAmount.dollarCashed +
            data.dollarAmount.dollarInvested;
    });

    readonly stockTotal = computed(() => {
        const data = this.amounts()[0];
        if (!data) return 0;
        const totalStockPesos = data.stockMarketAmount.cedearsPesos +
            data.stockMarketAmount.stockMarketPesos +
            data.stockMarketAmount.cashPesos;
        return totalStockPesos / data.dollarQuote;
    });

    readonly cryptoTotal = computed(() =>
        this.cryptoData().reduce((total, crypto) => total + crypto.valueUSD, 0)
    );

    readonly totalWallet = computed(() =>
        this.dollarTotal() + this.stockTotal() + this.cryptoTotal()
    );

    readonly dollarDifference = computed(() => {
        const data = this.amounts()[0];
        return data ? this.dollarTotal() - data.dollarUninvested : 0;
    });

    readonly stockDifference = computed(() => {
        const data = this.amounts()[0];
        return data ? this.stockTotal() - data.stockMarketUninvested : 0;
    });

    readonly cryptoDifference = computed(() => {
        const data = this.amounts()[0];
        return data ? this.cryptoTotal() - data.cryptoUninvested : 0;
    });

    readonly totalDifference = computed(() => {
        const data = this.amounts()[0];
        if (!data) return 0;
        const totalUninvested = data.dollarUninvested +
            data.stockMarketUninvested +
            data.cryptoUninvested;
        return this.totalWallet() - totalUninvested;
    });

    readonly categories = computed<Category[]>(() => [
        {
            name: 'DÓLARES',
            amount: this.dollarTotal(),
            color: '#10b981',
            percentage: this.getPercentage(this.dollarTotal()),
            difference: this.dollarDifference(),
            percentageGain: this.dollarPercentageGain()
        },
        {
            name: 'ACCIONES',
            amount: this.stockTotal(),
            color: '#3b82f6',
            percentage: this.getPercentage(this.stockTotal()),
            difference: this.stockDifference(),
            percentageGain: this.stockPercentageGain()
        },
        {
            name: 'CRYPTOMONEDAS',
            amount: this.cryptoTotal(),
            color: '#f97316',
            percentage: this.getPercentage(this.cryptoTotal()),
            difference: this.cryptoDifference(),
            percentageGain: this.cryptoPercentageGain()
        }
    ]);

    // Computed para porcentajes de ganancia
    readonly dollarPercentageGain = computed(() => {
        const data = this.amounts()[0];
        return data ? this.getPercentageGain(this.dollarTotal(), data.dollarUninvested) : 0;
    });

    readonly stockPercentageGain = computed(() => {
        const data = this.amounts()[0];
        return data ? this.getPercentageGain(this.stockTotal(), data.stockMarketUninvested) : 0;
    });

    readonly cryptoPercentageGain = computed(() => {
        const data = this.amounts()[0];
        return data ? this.getPercentageGain(this.cryptoTotal(), data.cryptoUninvested) : 0;
    });

    readonly totalPercentageGain = computed(() => {
        const data = this.amounts()[0];
        if (!data) return 0;
        const totalUninvested = data.dollarUninvested +
            data.stockMarketUninvested +
            data.cryptoUninvested;
        return this.getPercentageGain(this.totalWallet(), totalUninvested);
    });

    // Computed para clases CSS de rendimiento
    readonly totalPerformanceClass = computed(() =>
        this.totalPercentageGain() >= 0 ? 'positive' : 'negative'
    );

    readonly dollarPerformanceClass = computed(() =>
        this.dollarPercentageGain() >= 0 ? 'positive' : 'negative'
    );

    readonly stockPerformanceClass = computed(() =>
        this.stockPercentageGain() >= 0 ? 'positive' : 'negative'
    );

    readonly cryptoPerformanceClass = computed(() =>
        this.cryptoPercentageGain() >= 0 ? 'positive' : 'negative'
    );

    constructor() {
        this.lastUpdated.set(new Date());
    }

    ngOnInit(): void {
        // Carga inicial
        this.loadCryptoData();
        // Inicializar auto-refresh después de la carga inicial
        this.initializeAutoRefresh();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeAutoRefresh(): void {
        // Auto-refresh cada 5 minutos
        interval(5 * 60 * 1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // Solo hacer auto-refresh si no hay errores pendientes
                if (!this.error()) {
                    this.loadCryptoData();
                }
            });
    }

    private loadCryptoData(): void {
        if (this.loading()) {
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        this.cryptoService.getCryptoData()
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    console.error('Error loading crypto data:', error);

                    // Manejar diferentes tipos de errores
                    let errorMessage = 'Error desconocido al cargar los datos';

                    if (error.status === 0) {
                        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
                    } else if (error.status >= 500) {
                        errorMessage = 'Error del servidor. Intenta más tarde.';
                    } else if (error.status === 429) {
                        errorMessage = 'Demasiadas solicitudes. Espera un momento.';
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    this.error.set(errorMessage);
                    this.loading.set(false);
                    return of([]);
                })
            )
            .subscribe({
                next: (data) => {
                    this.cryptoData.set(data);
                    this.lastUpdated.set(new Date());
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Subscription error:', error);
                    this.error.set('Error inesperado en la suscripción');
                    this.loading.set(false);
                }
            });
    }

    /**
     * Calcula el porcentaje de ganancia
     */
    private getPercentageGain(currentAmount: number, originalAmount: number): number {
        if (originalAmount === 0 || !isFinite(originalAmount)) return 0;
        const gain = ((currentAmount - originalAmount) / originalAmount) * 100;
        return Math.round(gain * 10) / 10;
    }

    /**
     * Calcula el porcentaje de una categoría
     */
    private getPercentage(amount: number): number {
        const total = this.totalWallet();
        if (total === 0 || !isFinite(total)) return 0;
        const percentage = (amount / total) * 100;
        return Math.round(percentage * 10) / 10;
    }

    /**
     * Refresca los datos manualmente
     */
    refreshData(): void {
        this.error.set(null); // Limpiar errores al hacer refresh manual
        this.loadCryptoData();
    }

    /**
     * Reintenta cargar datos en caso de error
     */
    retryLoading(): void {
        this.error.set(null);
        this.loadCryptoData();
    }

    /**
     * Toggle para mostrar/ocultar saldos
     */
    toggleAmountVisibility(): void {
        // Solo permitir toggle si no está cargando
        if (!this.loading()) {
            this.hideAmounts.update(value => !value);
        }
    }

    /**
     * Verifica si hay datos válidos para mostrar
     */
    hasValidData(): boolean {
        return this.categories().some(category => category.amount > 0);
    }

    /**
     * Obtiene el estado actual del dashboard
     */
    getDashboardState(): 'loading' | 'error' | 'success' | 'empty' {
        if (this.loading()) return 'loading';
        if (this.error()) return 'error';
        if (!this.hasValidData()) return 'empty';
        return 'success';
    }

    // Métodos de conveniencia que delegan a computed signals (para backward compatibility)
    getDollarPercentageGain = () => this.dollarPercentageGain();
    getStockPercentageGain = () => this.stockPercentageGain();
    getCryptoPercentageGain = () => this.cryptoPercentageGain();
    getTotalPercentageGain = () => this.totalPercentageGain();
    getTotalPerformanceClass = () => this.totalPerformanceClass();
    getDollarPerformanceClass = () => this.dollarPerformanceClass();
    getStockPerformanceClass = () => this.stockPerformanceClass();
    getCryptoPerformanceClass = () => this.cryptoPerformanceClass();
}
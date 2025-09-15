import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../shared/imports/material-imports';
import { Subject, interval } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { WalletHistoryData } from '../../models/wallet.interface';
import { walletHistoryData } from '../../data/wallet.data';
import { WalletCategoriesChartComponent } from './wallet-categories-chart/wallet-categories-chart.component';
import { WalletEvolutionChartComponent } from './wallet-evolution-chart/wallet-evolution-chart.component';
import { WalletPerformanceCardComponent } from './wallet-performance-card/wallet-performance-card.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PortfolioService } from '../../services/portfolio.service';
import { PortfolioCategory, PortfolioResponse } from '../../models/portfolio.interface';

@Component({
    selector: 'app-wallet',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        WalletCategoriesChartComponent,
        WalletEvolutionChartComponent,
        WalletPerformanceCardComponent,
        CurrencyFormatPipe
    ],
    templateUrl: './wallet.component.html',
    styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly lastUpdated = signal<Date | null>(null);
    readonly hideAmounts = signal(false);
    readonly refreshTrigger = signal(0);

    totalWallet = signal(0);
    categories = signal<PortfolioCategory[]>([]);

    readonly hasErrorComputed = computed(() => !!this.error());
    readonly walletHistoryData = computed<WalletHistoryData[]>(() => walletHistoryData);
    // Computed que devuelve siempre 4 cards (independiente del estado)
    readonly performanceCardsData = computed(() => {
        const realData = this.categories() || [];

        const fixedArray = [
            realData[0] || null,
            realData[1] || null,
            realData[2] || null,
            realData[3] || null
        ];

        return fixedArray;
    });

    constructor(private portfolioService: PortfolioService) {
        this.lastUpdated.set(new Date());
    }

    ngOnInit(): void {
        this.loadPortfolioData();
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
                this.loadPortfolioData();
            });
    }

    private loadPortfolioData(): void {
        if (this.loading()) {
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        const fechaInicioPortfolio = '01/01/2025'

        this.portfolioService.getPortfolioCategories(fechaInicioPortfolio)
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.loading.set(false))
            )
            .subscribe({
                next: (response: PortfolioResponse) => {
                    this.categories.set(response.categories);

                    const totalCategory = response.categories.find(c => c.type === 'total');
                    this.totalWallet.set(totalCategory?.amount ?? 0);

                    this.lastUpdated.set(new Date());
                },
                error: (errorInfo) => {
                    this.error.set(errorInfo.message);
                }
            });
    }

    /**
     * Refresca los datos manualmente
     */
    refreshData(): void {
        this.error.set(null); // Limpiar errores al hacer refresh manual
        this.loadPortfolioData();
        this.refreshTrigger.update(current => current + 1);
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

    // TrackBy function para optimizar el ngFor
    trackByIndex(index: number): number {
        return index;
    }

}
import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialImports } from '../../shared/imports/material-imports';
import { Subject, forkJoin, of } from 'rxjs';
import { finalize, takeUntil, catchError } from 'rxjs/operators';
import { WalletHistoryData } from '../../models/wallet.interface';
import { WalletCategoriesChartComponent } from './wallet-categories-chart/wallet-categories-chart.component';
import { WalletEvolutionChartComponent } from './wallet-evolution-chart/wallet-evolution-chart.component';
import { WalletPerformanceCardComponent } from './wallet-performance-card/wallet-performance-card.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio, PortfolioCategory, PortfolioResponse } from '../../models/portfolio.interface';

@Component({
    selector: 'app-wallet',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        FormsModule,
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

    // Señales de portafolios
    readonly portfolios = signal<Portfolio[]>([]);
    readonly selectedPortfolioId = signal<string | null>(null);
    readonly isLoadingPortfolios = signal<boolean>(false);

    // Señales de estado
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly lastUpdated = signal<Date | null>(null);
    readonly hideAmounts = signal(false);
    readonly refreshTrigger = signal(0);

    // Señales de datos
    readonly walletHistoryData = signal<WalletHistoryData[]>([]);
    readonly totalWallet = signal(0);
    readonly categories = signal<PortfolioCategory[]>([]);

    // Computed para descripción del portafolio
    readonly portfolioDescription = computed(() => {
        const portfolioId = this.selectedPortfolioId();
        if (!portfolioId) return '';

        const portfolio = this.portfolios().find(p => p.id === portfolioId);
        return portfolio?.descripcion || '';
    });

    // Computed para verificar si hay portafolio seleccionado
    readonly hasSelectedPortfolio = computed(() => this.selectedPortfolioId() !== null);

    readonly hasErrorComputed = computed(() => !!this.error());

    // Computed para detectar si solo hay efectivo (sin inversiones)
    readonly hasCashOnly = computed(() => {
        const cats = this.categories();
        if (!cats || cats.length === 0) return true;

        const investmentCategories = cats.filter(cat => cat.type !== 'total');
        return investmentCategories.length === 0;
    });

    // Computed que devuelve las cards de rendimiento solo si hay inversiones
    readonly performanceCardsData = computed(() => {
        const realData = this.categories() || [];
        const validCategories = realData.filter(cat => cat !== null);
        return validCategories;
    });

    constructor(private portfolioService: PortfolioService) {
        this.lastUpdated.set(new Date());
    }

    ngOnInit(): void {
        this.getPortfolios();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Carga la lista de portafolios disponibles
     */
    private getPortfolios(): void {
        this.isLoadingPortfolios.set(true);

        this.portfolioService.getPortfolios()
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    console.error('Error loading portfolios:', error);
                    this.error.set('Error al cargar los portafolios');
                    return of({ success: false, count: 0, data: [] } as PortfolioResponse);
                }),
                finalize(() => this.isLoadingPortfolios.set(false))
            )
            .subscribe({
                next: (response: PortfolioResponse) => {
                    this.portfolios.set(response.data);
                }
            });
    }

    /**
     * Carga todos los datos del portafolio usando forkJoin para ejecutar en paralelo
     */
    private loadPortfolioData(portfolioId: string): void {
        if (this.loading()) {
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        // Ejecutar ambas llamadas en paralelo
        forkJoin({
            valuation: this.portfolioService.getPortfolioValuation(portfolioId).pipe(
                catchError(error => {
                    console.error('Error loading portfolio valuation:', error);
                    return of(null);
                })
            ),
            snapshots: this.portfolioService.getPortfolioSnapshots(portfolioId).pipe(
                catchError(error => {
                    console.error('Error loading portfolio snapshots:', error);
                    return of(null);
                })
            )
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (results) => {
                // Procesar datos de valuación
                if (results.valuation) {
                    this.categories.set(results.valuation.data.categorias);
                    this.totalWallet.set(
                        results.valuation.data.totalInvertido ??
                        results.valuation.data.capitalInicial
                    );
                } else {
                    this.categories.set([]);
                    this.totalWallet.set(0);
                }

                // Procesar datos históricos
                if (results.snapshots) {
                    this.walletHistoryData.set(results.snapshots.data || []);
                } else {
                    this.walletHistoryData.set([]);
                }

                // Actualizar timestamp
                this.lastUpdated.set(new Date());

                // Verificar si hubo algún error crítico
                if (!results.valuation && !results.snapshots) {
                    this.error.set('Error al cargar los datos del portafolio');
                }
            },
            error: (error) => {
                console.error('Error in forkJoin:', error);
                this.error.set('Error al cargar los datos del portafolio');
            }
        });
    }

    /**
     * Maneja el cambio de portafolio seleccionado
     */
    onPortfolioChange(portfolioId: string): void {
        this.selectedPortfolioId.set(portfolioId);
        // Cargar datos del nuevo portafolio
        this.loadPortfolioData(portfolioId);
    }

    /**
     * Refresca los datos del portafolio actual
     */
    refreshData(): void {
        const portfolioId = this.selectedPortfolioId();
        if (portfolioId) {
            this.error.set(null);
            this.loadPortfolioData(portfolioId);
            this.refreshTrigger.update(current => current + 1);
        }
    }

    /**
     * Toggle para mostrar/ocultar saldos
     */
    toggleAmountVisibility(): void {
        if (!this.loading()) {
            this.hideAmounts.update(value => !value);
        }
    }

    /**
     * TrackBy function para optimizar el ngFor
     */
    trackByIndex(index: number): number {
        return index;
    }

    onDepositMoney(): void {
        // Implementar lógica para ingresar dinero
    }

    onBuyAsset(): void {
        // Implementar lógica para comprar activo
    }

    onSellAsset(): void {
        // Implementar lógica para vender activo
    }

    onWithdrawMoney(): void {
        // Implementar lógica para retirar dinero
    }

    onViewTransactions(): void {
        // Implementar lógica para ver detalle de operaciones
    }

    onNewPortfolio(): void {
        // Implementar lógica para crear el portafolio
    }
}
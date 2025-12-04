import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialImports } from '../../shared/imports/material-imports';
import { Subject, forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { PortfolioHistoryData } from '../../models/portfolio.interface';
import { PortfolioCategoriesChartComponent } from './portfolio-categories-chart/portfolio-categories-chart.component';
import { PortfolioEvolutionChartComponent } from './portfolio-evolution-chart/portfolio-evolution-chart.component';
import { PortfolioPerformanceCardComponent } from './portfolio-performance-card/portfolio-performance-card.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio, PortfolioCategory, PortfolioResponse } from '../../models/portfolio.interface';
import { ToastService } from '../../shared/services/toast.service';
import { PortfolioRegisterModalComponent } from './portfolio-register-modal/portfolio-register-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-portfolio',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        FormsModule,
        PortfolioCategoriesChartComponent,
        PortfolioEvolutionChartComponent,
        PortfolioPerformanceCardComponent,
        CurrencyFormatPipe
    ],
    templateUrl: './portfolio.component.html',
    styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    // Señales de portafolios
    readonly portfolios = signal<Portfolio[]>([]);
    readonly selectedPortfolioId = signal<string | null>(null);
    readonly isLoadingPortfolios = signal<boolean>(false);

    // Señales de estado
    readonly loading = signal(false);
    readonly lastUpdated = signal<Date | null>(null);
    readonly hideAmounts = signal(false);
    readonly refreshTrigger = signal(0);

    // Señales de datos
    readonly portfolioHistoryData = signal<PortfolioHistoryData[]>([]);
    readonly totalPortfolio = signal(0);
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

    constructor(
        private portfolioService: PortfolioService,
        private toastService: ToastService,
        private dialog: MatDialog
    ) {
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

        // Ejecutar ambas llamadas en paralelo
        forkJoin({
            valuation: this.portfolioService.getPortfolioValuation(portfolioId),
            snapshots: this.portfolioService.getPortfolioSnapshots(portfolioId)
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: (results) => {
                // Procesar datos de valuación
                if (results.valuation) {
                    this.categories.set(results.valuation.data.categorias);
                    this.totalPortfolio.set(
                        results.valuation.data.totalInvertido ??
                        results.valuation.data.capitalInicial
                    );
                }

                // Procesar datos históricos
                if (results.snapshots) {
                    this.portfolioHistoryData.set(results.snapshots.data || []);
                }

                // Actualizar timestamp
                this.lastUpdated.set(new Date());

                // Solo mostrar success si ambas cargas fueron exitosas
                this.toastService.success('Datos actualizados correctamente');
            }
        });
    }

    /**
     * Maneja el cambio de portafolio seleccionado
     */
    onPortfolioChange(portfolioId: string): void {
        this.selectedPortfolioId.set(portfolioId);
        this.loadPortfolioData(portfolioId);
    }

    /**
     * Refresca los datos del portafolio actual
     */
    refreshData(): void {
        const portfolioId = this.selectedPortfolioId();
        if (portfolioId) {
            this.loadPortfolioData(portfolioId);
            this.refreshTrigger.update(current => current + 1);
        } else {
            this.toastService.warning('Debes seleccionar un portafolio primero');
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
     * Abre el modal para crear un nuevo portafolio
     */
    onNewPortfolio(): void {
        const dialogRef = this.dialog.open(PortfolioRegisterModalComponent, {
            width: '500px',
            maxWidth: '95vw',
            disableClose: true,
            autoFocus: true
        });

        dialogRef.afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.createPortfolio(result);
                    }
                }
            });
    }

    /**
     * Crea un nuevo portafolio
     */
    private createPortfolio(data: { nombre: string; descripcion?: string; capitalInicial?: number }): void {
        this.portfolioService.createPortfolio(data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(response.message || 'Portafolio creado exitosamente');

                        // Recargar la lista de portafolios
                        this.getPortfolios();

                        // Seleccionar automáticamente el nuevo portafolio
                        if (response.data && response.data.id) {
                            setTimeout(() => {
                                this.selectedPortfolioId.set(response.data.id);
                                this.loadPortfolioData(response.data.id);
                            }, 500);
                        }
                    }
                }
            });
    }

    /**
     * Crea un snapshot del portafolio actual
     */
    onCreateSnapshot(): void {
        const portfolioId = this.selectedPortfolioId();

        if (!portfolioId) {
            this.toastService.warning('Debes seleccionar un portafolio primero');
            return;
        }

        this.portfolioService.createSnapshot(portfolioId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(response.message || 'Snapshot creado exitosamente');
                        // Recargar datos para mostrar el nuevo snapshot
                        this.refreshData();
                    }
                }
            });
    }

    onViewTransactions(): void {
        this.toastService.info('Función en desarrollo');
    }

    onDeletePortfolio(): void {
        this.toastService.info('Función en desarrollo');
    }
}
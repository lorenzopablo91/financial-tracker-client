import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpContext } from '@angular/common/http';
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
import { ConfirmDialogComponent } from '../../shared/components/dialogs/confirm-dialog.component';
import { AuthService } from '../../shared/services/auth.service';
import { LoaderService } from '../../shared/services/loader.service';
import { LOADER_MESSAGE, SKIP_LOADER } from '../../shared/interceptors/loader-context.interceptor';

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
        private dialog: MatDialog,
        private authService: AuthService,
        private loaderService: LoaderService
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
     * Verifica si el rol del usuario
     */
    isAdmin(): boolean {
        return this.authService.getUserRole() === 'ADMIN';
    }

    /**
     * Carga la lista de portafolios disponibles
     * NOTA: Esta llamada NO muestra loader (excluida en el interceptor)
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
     * Usa control manual del loader para un mensaje único
     */
    private loadPortfolioData(portfolioId: string): void {
        // Contexto para desactivar el loader automático
        const context = new HttpContext().set(SKIP_LOADER, true);

        // Mostrar loader con mensaje personalizado
        this.loaderService.show('📊 Cargando datos del portafolio...');

        // Actualizar mensaje después de 2 segundos si aún está cargando
        const timer = setTimeout(() => {
            this.loaderService.updateMessage('📈 Calculando rendimientos...');
        }, 2000);

        // Ejecutar ambas llamadas en paralelo
        forkJoin({
            valuation: this.portfolioService.getPortfolioValuation(portfolioId, { context }),
            snapshots: this.portfolioService.getPortfolioSnapshots(portfolioId, 30, { context })
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                clearTimeout(timer);
                this.loaderService.hide();
            })
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
        this.hideAmounts.update(value => !value);
    }

    /**
     * Abre el modal para crear un nuevo portafolio
     */
    onNewPortfolio(): void {
        const dialogRef = this.dialog.open(PortfolioRegisterModalComponent, {
            width: '500px',
            maxWidth: '95vw',
            autoFocus: true,
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
     * Crea un nuevo portafolio con mensaje personalizado
     */
    private createPortfolio(data: { nombre: string; descripcion?: string; capitalInicial?: number }): void {
        this.portfolioService.createPortfolio(data, {
            context: new HttpContext().set(LOADER_MESSAGE, '🚀 Creando tu nuevo portafolio...')
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(response.message || 'Portafolio creado exitosamente');

                        // Recargar la lista de portafolios (sin loader)
                        this.getPortfolios();

                        // Seleccionar automáticamente el nuevo portafolio
                        if (response.data && response.data.id) {
                            this.selectedPortfolioId.set(response.data.id);
                            this.loadPortfolioData(response.data.id);
                        }
                    }
                }
            });
    }

    /**
     * Crea un snapshot del portafolio actual con mensaje personalizado
     */
    onCreateSnapshot(): void {
        const portfolioId = this.selectedPortfolioId();

        if (!portfolioId) {
            this.toastService.warning('Debes seleccionar un portafolio primero');
            return;
        }

        this.portfolioService.createSnapshot(portfolioId, {
            context: new HttpContext().set(LOADER_MESSAGE, '📸 Guardando valuación del portafolio...')
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(response.message || 'Valuación del portafolio guardada exitosamente');
                        // Recargar datos para mostrar el nuevo snapshot
                        this.refreshData();
                    }
                }
            });
    }

    onViewTransactions(): void {
        this.toastService.info('Función en desarrollo');
    }

    /**
     * Elimina el portafolio seleccionado con mensaje personalizado
     */
    onDeletePortfolio(): void {
        const portfolioId = this.selectedPortfolioId();

        if (!portfolioId) {
            this.toastService.warning('Debes seleccionar un portafolio primero');
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '420px',
            maxWidth: '90vw',
            autoFocus: false,
            panelClass: 'custom-confirm-dialog',
            data: {
                title: 'Eliminar Portafolio',
                message: '¿Estás seguro que deseas eliminar el portafolio seleccionado?',
                confirmText: 'Confirmar',
                cancelText: 'Cancelar',
                icon: 'delete_forever'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.portfolioService.deletePortfolio(portfolioId, {
                    context: new HttpContext().set(LOADER_MESSAGE, '🗑️ Eliminando portafolio y todas sus operaciones...')
                })
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.toastService.success('Portafolio eliminado exitosamente');

                            // Limpiar portafolio seleccionado
                            this.selectedPortfolioId.set(null);
                            // Recargar lista de portafolios (sin loader)
                            this.getPortfolios();
                        }
                    });
            }
        });
    }
}
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { HttpContext } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { PortfolioAsset, Transaction, TransactionFormResult, TransactionModalData } from '../../../models/portfolio.interface';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { OPERATION_COLORS, OPERATION_ICONS, OPERATIONS_TYPES } from '../../../data/portfolio.data';
import { PortfolioTransactionsModalComponent } from './portfolio-transactions-modal/portfolio-transactions-modal.component';
import { PortfolioService } from '../../../services/portfolio.service';
import { LOADER_MESSAGE } from '../../../shared/interceptors/loader-context.interceptor';

@Component({
    selector: 'app-portfolio-transactions',
    standalone: true,
    imports: [
        CommonModule,
        MaterialImports,
        CurrencyFormatPipe
    ],
    templateUrl: './portfolio-transactions.component.html',
    styleUrl: './portfolio-transactions.component.scss'
})
export class PortfolioTransactionsComponent {
    private authService = inject(AuthService);
    private portfolioService = inject(PortfolioService);
    private toastService = inject(ToastService);
    private dialog = inject(MatDialog);
    private destroy$ = new Subject<void>();

    // Inputs
    transactions = input.required<Transaction[]>();
    hideAmounts = input.required<boolean>();
    isLoading = input.required<boolean>();
    portfolioAssets = input<PortfolioAsset[]>([]);
    portfolioId = input.required<string>(); // ID del portafolio actual

    // Outputs
    backClicked = output<void>();
    transactionCompleted = output<void>(); // Emitir cuando se complete una transacción para recargar datos

    // Signals internos
    selectedFilter = signal<string>('APORTE');
    sortColumn = signal<string>('fecha');
    sortDirection = signal<'asc' | 'desc' | null>('desc');

    // Computed - Tipos únicos de transacciones (filtrado por rol)
    transactionTypes = computed(() => {
        if (this.isAdmin()) {
            return ['COMPRA', 'VENTA', 'APORTE', 'RETIRO'];
        }
        return ['APORTE'];
    });

    // Computed - Tipos únicos de activos
    assetTypes = computed(() => {
        const types = new Set(
            this.transactions()
                .filter(t => t.activoTipo)
                .map(t => t.activoTipo!)
        );
        return Array.from(types).sort();
    });

    // Computed - Transacciones filtradas y ordenadas
    filteredTransactions = computed(() => {
        let txs = this.transactions();

        // 1. Si no es admin, solo mostrar APORTES
        if (!this.isAdmin()) {
            txs = txs.filter(t => t.tipo === 'APORTE');
        } else {
            // 2. Filtrar por tipo de operación (solo si es admin)
            const filter = this.selectedFilter();
            if (filter !== 'all') {
                txs = txs.filter(t => t.tipo === filter);
            }
        }

        // 2. Ordenar
        const column = this.sortColumn();
        const direction = this.sortDirection();

        if (direction && column) {
            txs = [...txs].sort((a, b) => {
                // Para fechas
                if (column === 'fecha') {
                    const dateA = new Date(a.fecha).getTime();
                    const dateB = new Date(b.fecha).getTime();
                    return direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                // Para tipo de operación
                if (column === 'operacion' || column === 'tipo') {
                    const valueA = a.tipo.toLowerCase();
                    const valueB = b.tipo.toLowerCase();
                    return direction === 'asc'
                        ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
                        : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
                }

                // Para activo (prefijo)
                if (column === 'activo') {
                    const valueA = (a.activoPrefijo || '').toLowerCase();
                    const valueB = (b.activoPrefijo || '').toLowerCase();
                    return direction === 'asc'
                        ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
                        : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
                }

                // Para cantidad
                if (column === 'cantidad') {
                    const valueA = parseFloat(a.cantidad || '0');
                    const valueB = parseFloat(b.cantidad || '0');
                    return direction === 'asc' ? valueA - valueB : valueB - valueA;
                }

                // Para precios y montos
                if (column === 'precioUSD' || column === 'montoUSD') {
                    const valueA = parseFloat((column === 'precioUSD' ? a.precioUSD : a.montoUSD) || '0');
                    const valueB = parseFloat((column === 'precioUSD' ? b.precioUSD : b.montoUSD) || '0');
                    return direction === 'asc' ? valueA - valueB : valueB - valueA;
                }

                // Para ganancia realizada
                if (column === 'gananciaRealizada') {
                    const valueA = parseFloat(a.gananciaRealizada || '0');
                    const valueB = parseFloat(b.gananciaRealizada || '0');
                    return direction === 'asc' ? valueA - valueB : valueB - valueA;
                }

                return 0;
            });
        }

        return txs;
    });

    // Computed - Estadísticas
    stats = computed(() => {
        const filtered = this.filteredTransactions();

        return {
            transactionsCount: filtered.length,
            totalCompras: filtered.filter(t => t.tipo === 'COMPRA').length,
            totalVentas: filtered.filter(t => t.tipo === 'VENTA').length,
            totalAportes: filtered.filter(t => t.tipo === 'APORTE').length,
            totalRetiros: filtered.filter(t => t.tipo === 'RETIRO').length,
        };
    });

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Cambiar filtro
    onFilterChange(type: string) {
        this.selectedFilter.set(type);
    }

    // Ordenamiento
    onSort(column: string) {
        if (this.sortColumn() === column) {
            if (this.sortDirection() === 'asc') {
                this.sortDirection.set('desc');
            } else if (this.sortDirection() === 'desc') {
                this.sortDirection.set(null);
            } else {
                this.sortDirection.set('asc');
            }
        } else {
            this.sortColumn.set(column);
            this.sortDirection.set('asc');
        }
    }

    // Obtener ícono de ordenamiento
    getSortIcon(column: string): string {
        if (this.sortColumn() !== column) {
            return 'unfold_more';
        }
        if (this.sortDirection() === 'asc') {
            return 'expand_less';
        } else if (this.sortDirection() === 'desc') {
            return 'expand_more';
        }
        return 'unfold_more';
    }

    // Obtener color del tipo de operación
    getOperationColor(tipo: string): string {
        return OPERATION_COLORS[tipo] ?? '#0c0c0cff';
    }

    // Obtener ícono del tipo de operación
    getOperationIcon(tipo: string): string {
        return OPERATION_ICONS[tipo] ?? 'help_outline';
    }

    // Obtener color del tipo de activo
    getAssetTypeColor(tipo: string | null | undefined): string {
        if (!tipo) return '#999999';
        const config = OPERATIONS_TYPES[tipo as keyof typeof OPERATIONS_TYPES];
        return config?.color || '#999999';
    }

    // Obtener ícono del tipo de activo
    getAssetTypeIcon(tipo: string | null | undefined): string {
        if (!tipo) return 'help_outline';
        const config = OPERATIONS_TYPES[tipo as keyof typeof OPERATIONS_TYPES];
        return config?.icon || 'help_outline';
    }

    // Formatear fecha
    formatDate(fecha: string): string {
        const date = new Date(fecha);
        return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Calcular ganancia porcentual
    getGananciaPorc(transaction: Transaction): number {
        if (!transaction.gananciaRealizada || !transaction.costoBaseVendido) {
            return 0;
        }
        const ganancia = parseFloat(transaction.gananciaRealizada);
        const costoBase = parseFloat(transaction.costoBaseVendido);

        if (costoBase === 0) return 0;

        return (ganancia / costoBase) * 100;
    }

    // Verificar si ganancia es positiva
    isGananciaPositive(gananciaRealizada: string | null | undefined): boolean {
        if (!gananciaRealizada) return false;
        return parseFloat(gananciaRealizada) > 0;
    }

    // Verificar si ganancia es negativa
    isGananciaNegative(gananciaRealizada: string | null | undefined): boolean {
        if (!gananciaRealizada) return false;
        return parseFloat(gananciaRealizada) < 0;
    }

    /**
     * Verifica si el usuario es admin
     */
    isAdmin(): boolean {
        return this.authService.getUserRole() === 'ADMIN';
    }

    // Volver al portafolio
    onBack() {
        this.backClicked.emit();
    }

    // Registrar operación - Abrir modal
    onRegisterOperation(tipo: string) {
        const dialogData: TransactionModalData = {
            operationType: tipo as 'APORTE' | 'RETIRO' | 'COMPRA' | 'VENTA',
            portfolioAssets: tipo === 'VENTA' ? this.portfolioAssets() : undefined
        };

        const dialogRef = this.dialog.open(PortfolioTransactionsModalComponent, {
            width: '600px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            disableClose: true,
            data: dialogData
        });

        dialogRef.afterClosed().subscribe((result: TransactionFormResult | null) => {
            if (result) {
                this.processTransaction(result);
            }
        });
    }

    /**
     * Procesa la transacción según el tipo de operación
     */
    private processTransaction(result: TransactionFormResult): void {
        const portafolioId = this.portfolioId();

        switch (result.operationType) {
            case 'APORTE':
                this.registrarAporte(portafolioId, result);
                break;
            case 'RETIRO':
                this.registrarRetiro(portafolioId, result);
                break;
            case 'COMPRA':
                this.registrarCompra(portafolioId, result);
                break;
            case 'VENTA':
                this.registrarVenta(result);
                break;
        }
    }

    /**
     * Registrar un aporte al portafolio
     */
    private registrarAporte(portafolioId: string, data: TransactionFormResult): void {
        this.portfolioService.registrarAporte(
            portafolioId,
            {
                montoUSD: parseFloat(data.montoUSD!),
                notas: data.notas
            },
            {
                context: new HttpContext().set(LOADER_MESSAGE, '💰 Registrando aporte...')
            }
        )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(
                            response.mensaje || 'Aporte registrado exitosamente'
                        );

                        // Emitir evento para recargar datos en el componente padre
                        this.transactionCompleted.emit();
                    }
                },
                error: (error) => {
                    this.toastService.error(
                        error.error?.message || 'Error al registrar el aporte'
                    );
                }
            });
    }

    /**
     * Registrar un retiro del portafolio
     */
    private registrarRetiro(portafolioId: string, data: TransactionFormResult): void {
        this.portfolioService.registrarRetiro(
            portafolioId,
            {
                montoUSD: parseFloat(data.montoUSD!),
                notas: data.notas
            },
            {
                context: new HttpContext().set(LOADER_MESSAGE, '💰 Registrando retiro...')
            }
        )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(
                            response.mensaje || 'Retiro registrado exitosamente'
                        );

                        // Emitir evento para recargar datos en el componente padre
                        this.transactionCompleted.emit();
                    }
                },
                error: (error) => {
                    this.toastService.error(
                        error.error?.message || 'Error al registrar el retiro'
                    );
                }
            });
    }

    /**
     * Registrar una compra de activo
     */
    private registrarCompra(portafolioId: string, data: TransactionFormResult): void {
        // Preparar datos para el endpoint
        const compraData: any = {
            prefijo: data.activoPrefijo!,
            nombre: data.activoNombre,
            tipo: data.activoTipo!,
            cantidad: parseFloat(data.cantidad!),
            notas: data.notas
        };

        // Agregar campos de precio según el tipo de activo
        if (data.activoTipo === 'Accion') {
            compraData.precioARS = parseFloat(data.precioARS!);
            compraData.tipoCambio = parseFloat(data.tipoCambio!);
        } else {
            compraData.precioUSD = parseFloat(data.precioUSD!);
        }

        this.portfolioService.registrarCompra(
            portafolioId,
            compraData,
            {
                context: new HttpContext().set(LOADER_MESSAGE, '🛒 Registrando compra de activo...')
            }
        )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(
                            response.mensaje || 'Compra registrada exitosamente'
                        );

                        // Emitir evento para recargar datos
                        this.transactionCompleted.emit();
                    }
                },
                error: (error) => {
                    this.toastService.error(
                        error.error?.message || 'Error al registrar la compra'
                    );
                }
            });
    }

    /**
     * Registrar una venta de activo
     */
    private registrarVenta(data: TransactionFormResult): void {
        // El activoId viene del formulario
        const activoId = data.activoId!;

        // Preparar datos para el endpoint
        const ventaData: any = {
            cantidad: parseFloat(data.cantidad!),
            notas: data.notas
        };

        // Agregar campos de precio según el tipo de activo
        if (data.activoTipo === 'Accion') {
            ventaData.precioARS = parseFloat(data.precioARS!);
            ventaData.tipoCambio = parseFloat(data.tipoCambio!);
        } else {
            ventaData.precioUSD = parseFloat(data.precioUSD!);
        }

        this.portfolioService.registrarVenta(
            activoId,
            ventaData,
            {
                context: new HttpContext().set(LOADER_MESSAGE, '💵 Registrando venta de activo...')
            }
        )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toastService.success(
                            response.mensaje || 'Venta registrada exitosamente'
                        );

                        // Emitir evento para recargar datos
                        this.transactionCompleted.emit();
                    }
                },
                error: (error) => {
                    this.toastService.error(
                        error.error?.message || 'Error al registrar la venta'
                    );
                }
            });
    }

}
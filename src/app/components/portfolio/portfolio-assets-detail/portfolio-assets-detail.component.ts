import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { Asset, AssetStats } from '../../../models/portfolio.interface';
import { MaterialImports } from '../../../shared/imports/material-imports';

@Component({
    selector: 'app-portfolio-assets-detail',
    standalone: true,
    imports: [
        CommonModule,
        MaterialImports,
        CurrencyFormatPipe
    ],
    templateUrl: './portfolio-assets-detail.component.html',
    styleUrl: './portfolio-assets-detail.component.scss'
})

export class PortfolioAssetsDetailComponent {
    // Inputs
    assets = input.required<Asset[]>();
    hideAmounts = input.required<boolean>();
    isLoading = input.required<boolean>();
    initialCategoryFilter = input<string | null>(null);

    // Outputs
    backClicked = output<void>();

    // Signals internos
    selectedFilter = signal<string>('all');
    sortColumn = signal<string>('tipo');
    sortDirection = signal<'asc' | 'desc' | null>('asc');

    constructor() {
        // Effect para aplicar el filtro inicial cuando se pasa desde el padre
        effect(() => {
            const categoryFilter = this.initialCategoryFilter();
            if (categoryFilter) {
                untracked(() => {
                    this.selectedFilter.set(categoryFilter);
                });
            }
        });
    }

    // Computed - Tipos únicos de activos
    assetTypes = computed(() => {
        const types = new Set(this.assets().map(a => a.tipo));
        return Array.from(types).sort();
    });

    // Computed - Activos filtrados y ordenados
    filteredAssets = computed(() => {
        let assets = this.assets();

        // 1. Filtrar por tipo
        const filter = this.selectedFilter();
        if (filter !== 'all') {
            assets = assets.filter(a => a.tipo === filter);
        }

        // 2. Ordenar
        const column = this.sortColumn();
        const direction = this.sortDirection();

        if (direction && column) {
            assets = [...assets].sort((a, b) => {
                let valueA = a[column as keyof Asset];
                let valueB = b[column as keyof Asset];

                // Para ordenamiento alfabético (tipo, prefijo, nombre)
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    valueA = valueA.toLowerCase();
                    valueB = valueB.toLowerCase();

                    if (direction === 'asc') {
                        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
                    } else {
                        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
                    }
                }

                // Para ordenamiento numérico
                if (typeof valueA === 'number' && typeof valueB === 'number') {
                    return direction === 'asc' ? valueA - valueB : valueB - valueA;
                }

                return 0;
            });
        }

        return assets;
    });

    // Computed - Estadísticas
    stats = computed(() => {
        const filtered = this.filteredAssets();

        const stats: AssetStats = {
            assetsCount: filtered.length,
            totalValue: filtered.reduce((sum, a) => sum + a.valorActual, 0),
            totalCost: filtered.reduce((sum, a) => sum + a.costoBase, 0),
            totalGain: filtered.reduce((sum, a) => sum + a.gananciaPerdida, 0),
            totalGainPerc: 0
        };

        if (stats.totalCost > 0) {
            stats.totalGainPerc = (stats.totalGain / stats.totalCost) * 100;
        }

        return stats;
    });

    // Cambiar filtro
    onFilterChange(type: string) {
        this.selectedFilter.set(type);

        // Si filtra por "Todos los activos", ordena alfabéticamente por tipo
        if (type === 'all') {
            this.sortColumn.set('tipo');
            this.sortDirection.set('asc');
        }
    }

    // Ordenamiento
    onSort(column: string) {
        if (this.sortColumn() === column) {
            // Si ya está ordenando por esta columna, cambia la dirección
            if (this.sortDirection() === 'asc') {
                this.sortDirection.set('desc');
            } else if (this.sortDirection() === 'desc') {
                this.sortDirection.set(null);
            } else {
                this.sortDirection.set('asc');
            }
        } else {
            // Nueva columna, empieza en ascendente
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

    // Obtener color del tipo
    getTypeColor(tipo: string): string {
        const asset = this.assets().find(a => a.tipo === tipo);
        return asset?.color || '#999999';
    }

    // Obtener ícono del tipo
    getTypeIcon(tipo: string): string {
        const asset = this.assets().find(a => a.tipo === tipo);
        return asset?.icono || 'help_outline';
    }

    // Formatear cantidad según tipo
    formatQuantity(cantidad: number, tipo: string): string {
        if (tipo === 'Criptomoneda') {
            return cantidad.toFixed(8).replace(/\.?0+$/, '');
        }
        return cantidad.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    // Volver al dashboard
    onBack() {
        this.backClicked.emit();
    }
}
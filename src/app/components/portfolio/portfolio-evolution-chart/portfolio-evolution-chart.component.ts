import { Component, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { formatPortfolioHistoryForChart } from '../../../shared/controllers/evolution-chart.controller';
import { PortfolioHistoryData } from '../../../models/portfolio.interface';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
    selector: 'app-portfolio-evolution-chart',
    standalone: true,
    imports: [
        CommonModule,
        MaterialImports
    ],
    templateUrl: './portfolio-evolution-chart.component.html',
    styleUrls: ['./portfolio-evolution-chart.component.scss']
})
export class PortfolioEvolutionChartComponent implements AfterViewInit, OnDestroy {
    // Signals para inputs
    readonly hideAmountsSignal = signal(false);
    readonly selectedPeriodSignal = signal<'3M' | '6M' | '1A' | 'TODO'>('TODO');
    readonly chartDataSignal = signal<PortfolioHistoryData[]>([]);
    readonly loading = signal(false);
    readonly errorSignal = signal<string | null>(null);
    readonly refreshTriggerSignal = signal(0);
    readonly canvasKey = signal(0);

    private readonly chartInitialized = signal(false);

    @Input()
    set chartData(data: PortfolioHistoryData[]) {
        if (data) {
            this.chartDataSignal.set(data);
        }
    }

    @Input()
    set isLoading(value: boolean) {
        const wasLoading = this.loading();
        this.loading.set(value);

        // Si cambió de loading=true a loading=false, intentar crear el gráfico
        if (wasLoading && !value && this.chartCanvas?.nativeElement && !this.errorSignal()) {
            setTimeout(() => {
                if (this.hasData()) {
                    this.createChart();
                }
            }, 0);
        }

        // Si cambió a loading=true, destruir el gráfico actual
        if (!wasLoading && value) {
            this.destroyChart();
        }
    }

    @Input()
    set hideAmounts(value: boolean) {
        this.hideAmountsSignal.set(value);
    }
    get hideAmounts() {
        return this.hideAmountsSignal();
    }

    @Input()
    set error(value: string | null) {
        this.errorSignal.set(value);

        // Si hay un error, destruir el gráfico
        if (value) {
            this.destroyChart();
        }
    }
    get error() {
        return this.errorSignal();
    }

    // Input para recibir señal de actualización desde el componente padre
    @Input()
    set refreshTrigger(value: number) {
        this.refreshTriggerSignal.set(value);
    }

    @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

    private chart: Chart | null = null;

    // Computed values
    readonly filteredData = computed(() => {
        const data = this.chartDataSignal();
        const period = this.selectedPeriodSignal();

        if (period === 'TODO' || data.length === 0) {
            return data;
        }

        // Usar la fecha más reciente de los datos como referencia
        const latestDataDate = data.length > 0 ?
            new Date(Math.max(...data.map(item => {
                const itemDate = item.date instanceof Date ? item.date : new Date(item.date);
                return itemDate.getTime();
            }))) : new Date();

        let cutoffDate: Date;

        switch (period) {
            case '3M':
                cutoffDate = new Date(latestDataDate.getFullYear(), latestDataDate.getMonth() - 3, latestDataDate.getDate());
                break;
            case '6M':
                cutoffDate = new Date(latestDataDate.getFullYear(), latestDataDate.getMonth() - 6, latestDataDate.getDate());
                break;
            case '1A':
                cutoffDate = new Date(latestDataDate.getFullYear() - 1, latestDataDate.getMonth(), latestDataDate.getDate());
                break;
            default:
                return data;
        }

        return data.filter(item => {
            const itemDate = item.date instanceof Date ? item.date : new Date(item.date);
            return itemDate >= cutoffDate;
        });
    });

    readonly hasData = computed(() =>
        this.filteredData().length > 0
    );

    // Getters públicos para el template
    selectedPeriod() {
        return this.selectedPeriodSignal();
    }

    constructor() {
        // Effect para cambios en hideAmounts y período
        effect(() => {
            const hideAmounts = this.hideAmountsSignal();
            const period = this.selectedPeriodSignal();

            // Solo actualizar si el chart ya existe, está inicializado y NO está en loading ni error
            if (this.chart && this.chartInitialized() && !this.loading() && !this.errorSignal()) {
                this.updateExistingChart();
            }
        });

        // Effect separado para cambios en los datos
        effect(() => {
            const data = this.chartDataSignal();
            const hasDataValue = this.hasData();

            // Solo proceder si no está en loading, no hay error y el canvas está disponible
            if (!this.loading() && !this.errorSignal() && this.chartCanvas?.nativeElement) {
                if (hasDataValue) {
                    // Si hay datos, recrear el gráfico
                    setTimeout(() => this.createChart(), 0);
                } else {
                    // Si no hay datos, destruir el gráfico
                    this.destroyChart();
                }
            }
        });

        // Effect para refreshTrigger
        effect(() => {
            const trigger = this.refreshTriggerSignal();

            if (trigger > 0 && !this.loading() && !this.errorSignal()) {
                // Destruir el gráfico
                this.destroyChart();

                // Cambiar la key para forzar recreación del canvas
                this.canvasKey.update(k => k + 1);

                // Recrear el gráfico
                if (this.chartCanvas?.nativeElement && this.hasData()) {
                    this.createChart();

                    requestAnimationFrame(() => {
                        if (this.chart) {
                            this.chart.resize();
                        }
                    });
                }
            }
        });
    }

    ngAfterViewInit(): void {
        // Solo crear el gráfico si no está en loading, no hay error y hay datos
        if (!this.loading() && !this.errorSignal() && this.hasData()) {
            this.createChart();
        }
    }

    ngOnDestroy(): void {
        this.destroyChart();
    }

    private createChart(): void {
        // No crear el gráfico si está en loading o hay error
        if (this.loading() || this.errorSignal()) {
            return;
        }

        if (!this.chartCanvas?.nativeElement) {
            console.warn('Canvas element not available');
            return;
        }

        if (!this.hasData()) {
            console.warn('No chart data available');
            return;
        }

        // Destruir chart anterior si existe
        this.destroyChart();

        const canvas = this.chartCanvas.nativeElement;
        const container = canvas.parentElement;

        // Asegurar que el contenedor tenga dimensiones
        if (!container || container.clientHeight === 0 || container.clientWidth === 0) {
            console.warn('Container has no dimensions yet, retrying...');
            setTimeout(() => this.createChart(), 100);
            return;
        }

        // Forzar las dimensiones del canvas al tamaño del contenedor
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context from canvas');
            return;
        }

        try {
            const chartData = formatPortfolioHistoryForChart(this.filteredData());

            const config: ChartConfiguration = {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#10b981',
                            borderWidth: 1,
                            enabled: !this.hideAmountsSignal(),
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                color: 'rgba(156, 163, 175, 0.1)',
                            },
                            ticks: {
                                color: '#6B7280',
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            display: true,
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(156, 163, 175, 0.1)',
                            },
                            ticks: {
                                color: '#6B7280',
                                callback: (value) => {
                                    if (this.hideAmountsSignal()) {
                                        return '•••••••••';
                                    }
                                    return new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value as number);
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    elements: {
                        point: {
                            radius: 3,
                            hoverRadius: 5,
                            backgroundColor: '#10b981',
                            borderColor: '#ffffff',
                            borderWidth: 2
                        },
                        line: {
                            tension: 0.4,
                            borderWidth: 3,
                            fill: 'start',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderColor: '#10b981'
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            };

            this.chart = new Chart(ctx, config);
            this.chartInitialized.set(true);

        } catch (error) {
            console.error('Error creating chart:', error);
            this.chartInitialized.set(false);
        }
    }

    private updateExistingChart(): void {
        if (!this.chart || !this.chartInitialized() || this.loading() || this.errorSignal()) {
            return;
        }

        try {
            const chartData = formatPortfolioHistoryForChart(this.filteredData());

            // Actualizar datos del chart
            this.chart.data = chartData;

            // Actualizar opciones de tooltip
            if (this.chart.options.plugins?.tooltip) {
                this.chart.options.plugins.tooltip.enabled = !this.hideAmountsSignal();
            }

            // Usar 'none' para evitar animaciones en updates
            this.chart.update('none');

        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    private destroyChart(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
            this.chartInitialized.set(false);
        }
    }

    // Métodos públicos
    setPeriod(period: '3M' | '6M' | '1A' | 'TODO'): void {
        this.selectedPeriodSignal.set(period);
        // Recrear el chart cuando cambian los datos filtrados (solo si no está en loading ni error)
        if (!this.loading() && !this.errorSignal() && this.hasData()) {
            this.createChart();
        } else {
            this.destroyChart();
        }
    }

    updateData(newData: PortfolioHistoryData[]): void {
        this.chartDataSignal.set(newData);
        // El effect se encargará de recrear el gráfico automáticamente
    }

    // Método para actualizar desde el componente padre
    public refreshChart(): void {
        // No hacer nada si está en loading o hay error
        if (this.loading() || this.errorSignal()) {
            return;
        }

        if (this.hasData()) {
            this.createChart();
        } else {
            this.destroyChart();
        }
    }
}
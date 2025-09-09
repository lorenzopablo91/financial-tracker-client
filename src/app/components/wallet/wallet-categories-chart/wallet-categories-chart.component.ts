import { Component, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PortfolioCategory } from '../../../models/portfolio.interface';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-wallet-categories-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CurrencyFormatPipe
  ],
  templateUrl: './wallet-categories-chart.component.html',
  styleUrls: ['./wallet-categories-chart.component.scss']
})
export class WalletCategoriesChartComponent implements AfterViewInit, OnDestroy {
  // Signals para inputs
  readonly categoriesSignal = signal<PortfolioCategory[]>([]);
  readonly hideAmountsSignal = signal(false);
  private readonly chartInitialized = signal(false);

  @Input()
  set categories(value: PortfolioCategory[]) {
    const filteredCategories = value?.filter(category => category.type !== 'total') || [];
    this.categoriesSignal.set(filteredCategories);
  }
  
  get categories() {
    return this.categoriesSignal();
  }

  @Input()
  set hideAmounts(value: boolean) {
    this.hideAmountsSignal.set(value);
  }
  get hideAmounts() {
    return this.hideAmountsSignal();
  }

  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart<'doughnut'> | null = null;

  // Computed para datos del chart
  readonly chartData = computed(() => ({
    data: this.categoriesSignal().map(cat => cat.amount),
    labels: this.categoriesSignal().map(cat => cat.name),
    colors: this.categoriesSignal().map((cat) => cat.color)
  }));

  // Computed para determinar si hay datos
  readonly hasData = computed(() =>
    this.categoriesSignal().length > 0 &&
    this.categoriesSignal().some(cat => cat.amount > 0)
  );

  constructor() {
    effect(() => {
      // Solo actualizar si el chart ya existe y está inicializado
      if (this.chart && this.chartInitialized()) {
        this.updateExistingChart();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.hasData()) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private createChart(): void {
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

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    const data = this.chartData();
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors,
          borderColor: data.colors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverBackgroundColor: data.colors.map(color => color + 'CC'),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: !this.hideAmountsSignal(),
            callbacks: {
              title: () => '',
              label: (context) => {
                const category = this.categoriesSignal()[context.dataIndex];
                if (!category) return '';

                const value = this.hideAmountsSignal()
                  ? '••••••'
                  : `${category.amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}`;
                const percentage = this.hideAmountsSignal()
                  ? '••••'
                  : `${category.percentage.toFixed(1)}%`;

                return `${context.label}: ${value} (${percentage})`;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            displayColors: true,
            bodySpacing: 4,
            titleSpacing: 2,
            cornerRadius: 6,
            caretSize: 8
          }
        },
        cutout: '60%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 800
        },
        interaction: {
          intersect: false,
          mode: 'nearest'
        }
      }
    };

    try {
      this.chart = new Chart(ctx, config);
      this.chartInitialized.set(true);
    } catch (error) {
      console.error('Error creating chart:', error);
      this.chartInitialized.set(false);
    }
  }

  private updateExistingChart(): void {
    if (!this.chart || !this.chartInitialized()) {
      return;
    }

    const data = this.chartData();

    // Actualizar datos del chart
    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.data;
    this.chart.data.datasets[0].backgroundColor = data.colors;
    this.chart.data.datasets[0].borderColor = data.colors;
    this.chart.data.datasets[0].hoverBackgroundColor = data.colors.map(color => color + 'CC');

    // Actualizar opciones de tooltip
    if (this.chart.options.plugins?.tooltip) {
      this.chart.options.plugins.tooltip.enabled = !this.hideAmountsSignal();
    }

    // Evitar animaciones en updates
    this.chart.update('none');
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
      this.chartInitialized.set(false);
    }
  }

  // Método público para recrear el chart completamente
  public refreshChart(): void {
    if (this.hasData()) {
      this.createChart();
    } else {
      this.destroyChart();
    }
  }

  // Método público para actualizar datos sin recrear
  public updateChart(): void {
    this.updateExistingChart();
  }
}
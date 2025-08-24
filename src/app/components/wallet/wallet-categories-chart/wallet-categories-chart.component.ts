import { Component, Input, OnDestroy, ViewChild, ElementRef, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  difference: number;
  percentageGain: number;
}

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
export class WalletCategoriesChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() categories: CategoryData[] = [];
  @Input() hideAmounts: boolean = false;
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart<'doughnut'> | null = null;

  // Colores predefinidos para las categorías
  colors = [
    '#4BC0C0', '#9966FF', '#FF9F40',
  ];

  ngAfterViewInit(): void {
    console.log('WalletCategoriesChart - ngAfterViewInit', { 
      canvasElement: this.chartCanvas?.nativeElement,
      categories: this.categories 
    });
    
    // Si tenemos datos pero no canvas, intentamos crear el chart después
    if (this.categories && this.categories.length > 0) {
      if (this.chartCanvas?.nativeElement) {
        this.createChart();
      } else {
        // Intentar de nuevo después de que Angular termine el ciclo de detección
        setTimeout(() => {
          console.log('Retry after timeout - Canvas element:', this.chartCanvas?.nativeElement);
          if (this.chartCanvas?.nativeElement) {
            this.createChart();
          }
        }, 100);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges triggered', { 
      changes, 
      canvasElement: this.chartCanvas?.nativeElement,
      categories: this.categories 
    });
    
    if ((changes['categories'] || changes['hideAmounts'])) {
      if (this.chartCanvas?.nativeElement && this.categories && this.categories.length > 0) {
        this.updateChart();
      } else if (changes['categories'] && this.categories && this.categories.length > 0) {
        // Si las categorías cambiaron pero no tenemos canvas, intentar crear el chart
        setTimeout(() => {
          console.log('Creating chart from ngOnChanges after timeout');
          if (this.chartCanvas?.nativeElement) {
            this.createChart();
          }
        }, 100);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    console.log('Creating chart...', { 
      canvasElement: this.chartCanvas?.nativeElement,
      categories: this.categories 
    });

    if (!this.chartCanvas?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    if (!this.categories || this.categories.length === 0) {
      console.warn('No categories data provided');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    // Destruir chart anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    const chartData = this.categories.map(cat => cat.amount);
    const chartLabels = this.categories.map(cat => cat.name);

    console.log('Chart data:', { chartData, chartLabels });

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: this.colors.slice(0, this.categories.length),
          borderColor: this.colors.slice(0, this.categories.length),
          borderWidth: 2,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Deshabilitamos la leyenda por defecto
          },
          tooltip: {
            enabled: !this.hideAmounts,
            callbacks: {
              label: (context) => {
                const category = this.categories[context.dataIndex];
                const value = this.hideAmounts ? '••••••' : `${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const percentage = this.hideAmounts ? '••••' : `${category.percentage.toFixed(1)}%`;
                return `${context.label}: ${value} (${percentage})`;
              }
            }
          }
        },
        cutout: '60%', // Hace el círculo más grueso
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    };

    try {
      this.chart = new Chart(ctx, config);
      console.log('Chart created successfully:', this.chart);
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }

  private updateChart(): void {
    if (!this.chart) {
      this.createChart();
      return;
    }

    // Actualizar datos
    this.chart.data.labels = this.categories.map(cat => cat.name);
    this.chart.data.datasets[0].data = this.categories.map(cat => cat.amount);
    this.chart.data.datasets[0].backgroundColor = this.colors.slice(0, this.categories.length);
    this.chart.data.datasets[0].borderColor = this.colors.slice(0, this.categories.length);

    // Actualizar tooltips según hideAmounts
    if (this.chart.options.plugins?.tooltip) {
      this.chart.options.plugins.tooltip.enabled = !this.hideAmounts;
    }

    this.chart.update();
  }
}
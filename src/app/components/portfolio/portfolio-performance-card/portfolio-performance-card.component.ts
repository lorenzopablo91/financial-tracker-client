import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../../shared/imports/material-imports';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PortfolioCategory } from '../../../models/portfolio.interface';

@Component({
    selector: 'app-portfolio-performance-card',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        CurrencyFormatPipe
    ],
    templateUrl: './portfolio-performance-card.component.html',
    styleUrls: ['./portfolio-performance-card.component.scss']
})
export class PortfolioPerformanceCardComponent {
    readonly isLoading = input.required<boolean>();
    readonly hideAmounts = input.required<boolean>();
    readonly data = input.required<PortfolioCategory>();

    // Computed para la clase del tipo de card
    readonly cardTypeClass = computed(() => {
        const categoryData = this.data();
        if (!categoryData) return '';

        return `${categoryData.type}-performance`;
    });

    // Computed para la clase del título
    readonly titleClass = computed(() => {
        const categoryData = this.data();
        if (!categoryData) return 'performance-title';

        return categoryData.type === 'total' ? 'performance-title-total' : 'performance-title';
    });

    // Computed para la clase de rendimiento (positivo/negativo)
    readonly performanceClass = computed(() => {
        const categoryData = this.data();
        if (!categoryData) return '';

        return categoryData.percentageGain >= 0 ? 'positive' : 'negative';
    });

    // Computed para los estilos dinámicos basados en el color
    readonly dynamicStyles = computed(() => {
        const categoryData = this.data();
        if (!categoryData || !categoryData.color || categoryData.type === 'total') {
            return {};
        }

        // Función helper para convertir hex a rgb
        const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        // Función helper para aclarar un color (similar a Sass color.scale)
        const lightenColor = (hex: string, percent: number): string => {
            const rgb = hexToRgb(hex);
            if (!rgb) return hex;

            const factor = percent / 100;
            const r = Math.round(rgb.r + (255 - rgb.r) * factor);
            const g = Math.round(rgb.g + (255 - rgb.g) * factor);
            const b = Math.round(rgb.b + (255 - rgb.b) * factor);

            return `rgb(${r}, ${g}, ${b})`;
        };

        return {
            'color': categoryData.color,
            'background-color': lightenColor(categoryData.color, 80)
        };
    });
}
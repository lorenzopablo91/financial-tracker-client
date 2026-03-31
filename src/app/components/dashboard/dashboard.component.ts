import { Component, OnInit, OnDestroy } from '@angular/core';
import {  ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialImports } from '../../shared/imports/material-imports';
import { DashboardService } from '../../services/dashboard.service';
import { CryptoDashboardItem, DolarItem, StockDashboardItem } from '../../models/dashboard.interface';
import { LoaderService } from '../../shared/services/loader.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        ...MaterialImports,
        CommonModule,
        ReactiveFormsModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
    dolar: DolarItem | null = null;
    cryptos: CryptoDashboardItem[] = [];
    stocks: StockDashboardItem[] = [];
    lastUpdate: string = '';
    isRefreshing = false;

    private streamSub?: Subscription;
    private countdownInterval?: any;
    private nextUpdateIn = 300; // 5 minutos en segundos
    private progressPercentageValue = 0;

    // Propiedades para el template
    progressPercentage = (): number => this.progressPercentageValue;
    nextUpdateCountdown = (): number => this.nextUpdateIn;

    constructor(
        private dashboardService: DashboardService,
        private loaderService: LoaderService
    ) { }

    ngOnInit() {
        this.loaderService.show('🖥️ Cargando datos del panel de control...');
        
        this.streamSub = this.dashboardService.connectStream().subscribe({
            next: ({ dolar, cryptos, stocks, timestamp }) => {
                this.dolar = dolar;
                this.cryptos = cryptos;
                this.stocks = stocks;
                this.lastUpdate = timestamp;
                this.resetCountdown();
                this.loaderService.hide();
            },
            error: (err) => {
                console.error('Stream error:', err);
                this.loaderService.hide();
            }
        });

        // Iniciar el contador regresivo
        this.startCountdown();
    }

    ngOnDestroy() {
        this.streamSub?.unsubscribe();
        this.loaderService.hide();
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    /**
     * Inicia el contador regresivo de 5 minutos
     */
    private startCountdown(): void {
        this.countdownInterval = setInterval(() => {
            if (this.nextUpdateIn > 0) {
                this.nextUpdateIn--;
                this.progressPercentageValue = ((300 - this.nextUpdateIn) / 300) * 100;
            }
        }, 1000);
    }

    /**
     * Reinicia el contador a 5 minutos
     */
    private resetCountdown(): void {
        this.nextUpdateIn = 300;
        this.progressPercentageValue = 0;
    }

    /**
     * Actualiza el dashboard solicitando nuevos datos del stream
     */
    refreshDashboard(): void {
        this.isRefreshing = true;
        console.log('Dashboard refresh triggered');
        // Simular carga por 1 segundo
        setTimeout(() => {
            this.isRefreshing = false;
            this.resetCountdown();
        }, 1000);
    }

    /**
     * Retorna solo los cedears de la lista de stocks
     */
    getCedears(): StockDashboardItem[] {
        return this.stocks.filter(stock => stock.tipo === 'Cedear');
    }

    /**
     * Retorna solo las acciones de la lista de stocks
     */
    getAcciones(): StockDashboardItem[] {
        return this.stocks.filter(stock => stock.tipo === 'Accion');
    }

    /**
     * Retorna el icono según el símbolo de la criptomoneda
     */
    getCryptoIcon(symbol: string): string {
        const iconMap: { [key: string]: string } = {
            'BTC': 'currency_bitcoin',
            'ETH': 'toll',
            'XRP': 'waterfall_chart',
            'ADA': 'trending_up'
        };
        return iconMap[symbol] || 'currency_bitcoin';
    }

    /**
     * Retorna el icono según el tipo de acción
     */
    getStockIcon(tipo: string): string {
        return tipo === 'Cedear' ? 'apartment' : 'trending_up';
    }

    /**
     * Convierte segundos a formato mm:ss
     */
    formatCountdown(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Retorna las criptomonedas ordenadas por mayor porcentaje de cambio
     */
    getSortedCryptos(): CryptoDashboardItem[] {
        return [...this.cryptos].sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    }

    /**
     * Retorna los cedears ordenados por mayor porcentaje de cambio
     */
    getSortedCedears(): StockDashboardItem[] {
        return this.getCedears().sort((a, b) => b.variacionPorc - a.variacionPorc);
    }

    /**
     * Retorna las acciones ordenadas por mayor porcentaje de cambio
     */
    getSortedAcciones(): StockDashboardItem[] {
        return this.getAcciones().sort((a, b) => b.variacionPorc - a.variacionPorc);
    }

    /**
     * Obtiene el símbolo de la criptomoneda (especial para Bitcoin que usa $)
     */
    getCryptoSymbol(symbol: string): string {
        // Bitcoin y otras criptos usan $ como símbolo
        if (symbol === 'BTC' || symbol === 'B') {
            return '$';
        }
        return symbol;
    }

    /**
     * Maneja la selección de una tarjeta
     */
    selectCard(cardId: string): void {
        // Aquí puedes agregar lógica para mostrar detalles o navegar
        console.log('Card selected:', cardId);
    }
}
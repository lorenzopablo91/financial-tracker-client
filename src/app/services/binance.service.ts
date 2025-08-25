import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AccountInfo, CryptoData, CryptoPrice } from '../models/binance.interface';
import { API_CONFIG } from '../data/api';
import { cryptoMetadata, MIN_USD_VALUE } from '../data/crypto.data';

@Injectable({
    providedIn: 'root'
})
export class CryptoService {

    constructor(private http: HttpClient) { }

    /**
     * Función para crear HMAC SHA256 sin crypto-js
     */
    private async createSignature(message: string, secret: string): Promise<string> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

        // Convertir a hexadecimal
        const hashArray = Array.from(new Uint8Array(signature));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Obtiene los datos de criptomonedas con balances y precios
     */
    getCryptoData(): Observable<CryptoData[]> {
        return new Observable(observer => {
            this.getAccountBalances().subscribe({
                next: (balances) => {
                    const symbols = Object.keys(balances);

                    this.getCryptoPrices(symbols).subscribe({
                        next: (prices) => {
                            try {
                                // Calcular valores en USD y filtrar
                                const cryptoData = symbols
                                    .filter(symbol => cryptoMetadata[symbol])
                                    .map(symbol => {
                                        const amount = balances[symbol];
                                        const priceUSD = prices[symbol];
                                        const valueUSD = amount * priceUSD;

                                        return {
                                            name: cryptoMetadata[symbol].name,
                                            symbol: symbol,
                                            amount,
                                            priceUSD,
                                            valueUSD,
                                            color: cryptoMetadata[symbol].color
                                        };
                                    })
                                    .filter(crypto => crypto.valueUSD >= MIN_USD_VALUE);

                                observer.next(cryptoData);
                                observer.complete();
                            } catch (error) {
                                observer.error(error);
                            }
                        },
                        error: (error) => observer.error(error)
                    });
                },
                error: (error) => observer.error(error)
            });
        });
    }

    /**
     * Obtiene el precio de una sola criptomoneda
     */
    private fetchCryptoPrice(symbol: string): Observable<CryptoPrice | null> {
        if (symbol === 'USDT') {
            return of({
                symbol: 'USDTUSDT',
                price: '1.00'
            });
        }

        const url = `/binance/api/v3/ticker/price?symbol=${symbol}USDT`;

        return this.http.get<CryptoPrice>(url).pipe(
            catchError((error: HttpErrorResponse) => {
                console.error(`Error fetching price for ${symbol}:`, {
                    status: error.status,
                    statusText: error.statusText,
                    url,
                    error: error.error
                });
                return of(null); // Retornar null en caso de error
            })
        );
    }

    /**
     * Obtiene precios de múltiples criptomonedas
     */
    getCryptoPrices(symbols: string[]): Observable<Record<string, number>> {
        const priceObservables: Observable<CryptoPrice | null>[] = symbols.map(symbol =>
            this.fetchCryptoPrice(symbol)
        );

        return forkJoin(priceObservables).pipe(
            map((prices: (CryptoPrice | null)[]) => {
                const result = prices.reduce((acc, curr, index) => {
                    if (curr === null) {
                        console.warn(`Skipping ${symbols[index]} due to fetch error`);
                        return acc;
                    }

                    const symbol = curr.symbol.replace('USDT', '');
                    return {
                        ...acc,
                        [symbol]: parseFloat(curr.price)
                    };
                }, {} as Record<string, number>);

                if (Object.keys(result).length === 0) {
                    throw new Error('No cryptocurrency prices could be fetched');
                }

                return result;
            }),
            catchError(error => {
                console.error('Detailed error in getCryptoPrices:', {
                    error,
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
                return throwError(() => error);
            })
        );
    }

    /**
     * Obtiene los balances de la cuenta de Binance
     */
    private getAccountBalances(): Observable<Record<string, number>> {
        return new Observable(observer => {
            // 1. Obtener el tiempo del servidor
            this.getBinanceServerTime().subscribe({
                next: async (serverTime) => {
                    try {
                        // 2. Calcular el offset entre el tiempo local y del servidor
                        const timeOffset = serverTime - Date.now();

                        // 3. Crear el timestamp ajustado
                        const timestamp = Date.now() + timeOffset;
                        const recvWindow = 60000; // 60 segundos

                        // 4. Construir el query string con el timestamp ajustado
                        const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}&omitZeroBalances=true`;
                        const signature = await this.createSignature(queryString, API_CONFIG.BINANCE.SECRET_KEY);

                        const url = `/binance/api/v3/account?${queryString}&signature=${signature}`;

                        // 5. Configurar headers
                        const headers = new HttpHeaders({
                            'X-MBX-APIKEY': API_CONFIG.BINANCE.API_KEY
                        });

                        // 6. Hacer la petición
                        this.http.get<AccountInfo>(url, { headers }).subscribe({
                            next: (accountInfo) => {
                                const balances = accountInfo.balances.reduce((acc, curr) => {
                                    const totalBalance = parseFloat(curr.free) + parseFloat(curr.locked);
                                    if (totalBalance > 0) {
                                        return {
                                            ...acc,
                                            [curr.asset]: totalBalance
                                        };
                                    }
                                    return acc;
                                }, {} as Record<string, number>);

                                observer.next(balances);
                                observer.complete();
                            },
                            error: (error: HttpErrorResponse) => {
                                const errorInfo = {
                                    status: error.status,
                                    statusText: error.statusText,
                                    body: error.error,
                                    timestamp,
                                    serverTime,
                                    localTime: Date.now(),
                                    timeOffset,
                                    recvWindow
                                };
                                console.error('Detailed error info:', errorInfo);
                                observer.error(new Error(`HTTP error! status: ${error.status}, body: ${JSON.stringify(error.error)}`));
                            }
                        });
                    } catch (error) {
                        console.error('Error en getAccountBalances:', error);
                        observer.error(error);
                    }
                },
                error: (error) => observer.error(error)
            });
        });
    }

    /**
     * Obtiene el tiempo del servidor de Binance
     */
    private getBinanceServerTime(): Observable<number> {
        const url = '/binance/api/v3/time';

        return this.http.get<{ serverTime: number }>(url, {
            headers: { 'Cache-Control': 'no-cache' }
        }).pipe(
            map(data => data.serverTime),
            catchError((error: HttpErrorResponse) => {
                console.error('Failed to fetch server time:', error);
                return throwError(() => new Error('Failed to fetch server time'));
            })
        );
    }
}
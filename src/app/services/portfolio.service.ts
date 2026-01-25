import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    private readonly baseURL: string = `${environment.API_URL}/portfolio`;

    constructor(private http: HttpClient) { }

    /**
     * Obtiene la lista de portafolios
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    getPortfolios(options?: any): Observable<any> {
        return this.http.get<any>(this.baseURL, options);
    }

    /**
     * Obtiene la valuación de un portafolio
     * @param portfolioId ID del portafolio
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    getPortfolioValuation(portfolioId: string, options?: any): Observable<any> {
        return this.http.get<any>(`${this.baseURL}/${portfolioId}/valorizar`, options);
    }

    /**
     * Obtiene los snapshots históricos de un portafolio
     * @param portfolioId ID del portafolio
     * @param limit Cantidad de snapshots a obtener
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    getPortfolioSnapshots(portfolioId: string, limit = 30, options?: any): Observable<any> {
        return this.http.get<any>(
            `${this.baseURL}/${portfolioId}/snapshots?limit=${limit}`,
            options
        )
    }

    /**
     * Crea un nuevo portafolio
     * @param data Datos del portafolio
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    createPortfolio(data: { nombre: string; descripcion?: string; capitalInicial?: number }, options?: any): Observable<any> {
        return this.http.post<any>(this.baseURL, data, options);
    }

    /**
     * Crea un snapshot del portafolio
     * @param portfolioId ID del portafolio
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    createSnapshot(portfolioId: string, options?: any): Observable<any> {
        return this.http.post<any>(`${this.baseURL}/${portfolioId}/snapshot`, {}, options);
    }

    /**
     * Elimina un portafolio
     * @param portfolioId ID del portafolio
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    deletePortfolio(portfolioId: string, options?: any): Observable<any> {
        return this.http.delete<any>(`${this.baseURL}/${portfolioId}`, options);
    }

    /**
     * Obtiene las transacciones de un portafolio
     * @param portfolioId ID del portafolio
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    getTransactions(portfolioId: string, options?: any): Observable<any> {
        return this.http.get<any>(`${this.baseURL}/${portfolioId}/operaciones`, options);
    }

    /**
     * Registra un aporte al portafolio
     * @param portafolioId ID del portafolio
     * @param data monto en USD y notas opcionales
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    registrarAporte(
        portafolioId: string,
        data: { montoUSD: number; notas?: string },
        options?: any
    ): Observable<any> {
        return this.http.post<any>(
            `${this.baseURL}/${portafolioId}/aporte`,
            data,
            options
        );
    }

    /**
     * Registra un retiro al portafolio
     * @param portafolioId ID del portafolio
     * @param data monto en USD y notas opcionales
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    registrarRetiro(
        portafolioId: string,
        data: { montoUSD: number; notas?: string },
        options?: any
    ): Observable<any> {
        return this.http.post<any>(
            `${this.baseURL}/${portafolioId}/retiro`,
            data,
            options
        );
    }

    /**
     * Registrar una compra de activo en el portafolio
     */
    registrarCompra(
        portafolioId: string,
        data: {
            prefijo: string;
            nombre?: string;
            tipo: string;
            cantidad: number;
            precioUSD?: number;
            precioARS?: number;
            tipoCambio?: number;
            notas?: string;
        },
        options?: any
    ): Observable<any> {
        return this.http.post<any>(
            `${this.baseURL}/${portafolioId}/compra`,
            data,
            options
        );
    }

    /**
     * Registrar una venta de activo del portafolio
     */
    registrarVenta(
        activoId: string,
        data: {
            cantidad: number;
            precioUSD?: number;
            precioARS?: number;
            tipoCambio?: number;
            notas?: string;
        },
        options?: any
    ): Observable<any> {
        return this.http.post<any>(
            `${this.baseURL}/activos/${activoId}/venta`,
            data,
            options
        );
    }
}
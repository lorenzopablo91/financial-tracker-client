import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
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
        return this.http.get<any>(this.baseURL, options).pipe(
            retry(1)
        );
    }

    /**
     * Obtiene la valuación de un portafolio
     * @param portfolioId ID del portafolio
     * @param options Opciones HTTP adicionales (incluye context para loader)
     */
    getPortfolioValuation(portfolioId: string, options?: any): Observable<any> {
        return this.http.get<any>(`${this.baseURL}/${portfolioId}/valorizar`, options).pipe(
            retry(1)
        );
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
        ).pipe(
            retry(1)
        );
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
        return this.http.get<any>(`${this.baseURL}/${portfolioId}/transactions`, options).pipe(
            retry(1)
        );
    }
}
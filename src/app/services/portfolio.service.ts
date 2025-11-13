import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PortfolioResponse } from '../models/portfolio.interface';

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    private readonly baseURL: string = `${environment.API_URL}/portfolio`;

    constructor(private http: HttpClient) { }

    getPortfolios(): Observable<PortfolioResponse> {
        return this.http.get<PortfolioResponse>(`${this.baseURL}`).pipe(
            retry(1)
        );
    }

    getPortfolioValuation(portfolioId: string): Observable<any> {
        return this.http.get<any>(`${this.baseURL}/${portfolioId}/valorizar`).pipe(
            retry(1)
        );
    }

    getPortfolioSnapshots(portfolioId: string, limit = 30): Observable<any> {
        return this.http.get<any>(`${this.baseURL}/${portfolioId}/snapshots?limit=${limit}`).pipe(
            retry(1)
        );
    }

}
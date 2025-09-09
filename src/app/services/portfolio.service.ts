import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { PortfolioResponse } from '../models/portfolio.interface';

@Injectable({
    providedIn: 'root'
})
export class PortfolioService {
    private readonly baseURL: string = `${environment.API_URL}/portfolio`;

    constructor(private http: HttpClient) { }

    getPortfolioCategories(): Observable<PortfolioResponse> {
        return this.http.get<PortfolioResponse>(`${this.baseURL}`).pipe(
            retry(1)
        );
    }
}
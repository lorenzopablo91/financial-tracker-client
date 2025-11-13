import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class ExchangeRanresService {
    constructor(private http: HttpClient) { }

    baseURL: string = `${environment.API_URL}/exchange-rates`

    getDolarPrices(): Observable<any> {
        return this.http.get(`${this.baseURL}/dolar`);
    }

    getCryptoPrices(coin: string): Observable<any> {
        let params = new HttpParams();
        params = params.set('symbols', coin);

        return this.http.get(`${this.baseURL}/crypto/coin`, { params });
    }
}
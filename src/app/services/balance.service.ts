import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LOADER_MESSAGE, SKIP_LOADER } from '../shared/interceptors/loader-context.interceptor';
import {
  BackendMonthlyBalance,
  BackendExpenseDetail,
  CreateMonthlyBalancePayload,
  CreateExpenseDetailPayload,
  BalanceSummary,
  ApiResponse
} from '../models/balance.interface';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private readonly baseURL: string = `${environment.API_URL}/balance`;

  constructor(private http: HttpClient) { }

  
  getAllBalances(): Observable<ApiResponse<BackendMonthlyBalance[]>> {
    return this.http.get<ApiResponse<BackendMonthlyBalance[]>>(this.baseURL, {
      context: new HttpContext().set(LOADER_MESSAGE, '📊 Cargando balances...')
    });
  }

  getBalanceById(balanceId: string): Observable<ApiResponse<BackendMonthlyBalance>> {
    return this.http.get<ApiResponse<BackendMonthlyBalance>>(`${this.baseURL}/${balanceId}`, {
      context: new HttpContext().set(SKIP_LOADER, true)
    });
  }

  getBalanceByPeriod(year: number, month: number): Observable<ApiResponse<BackendMonthlyBalance>> {
    return this.http.get<ApiResponse<BackendMonthlyBalance>>(
      `${this.baseURL}/period/${year}/${month}`,
      {
        context: new HttpContext().set(SKIP_LOADER, true)
      }
    );
  }

  createBalance(payload: CreateMonthlyBalancePayload): Observable<ApiResponse<BackendMonthlyBalance>> {
    return this.http.post<ApiResponse<BackendMonthlyBalance>>(this.baseURL, payload, {
      context: new HttpContext().set(LOADER_MESSAGE, '💾 Guardando balance...')
    });
  }

  bulkCreateBalances(balances: CreateMonthlyBalancePayload[]): Observable<ApiResponse<BackendMonthlyBalance[]>> {
    return this.http.post<ApiResponse<BackendMonthlyBalance[]>>(
      `${this.baseURL}/bulk`,
      { balances },
      {
        context: new HttpContext().set(LOADER_MESSAGE, '📦 Importando balances...')
      }
    );
  }

  updateBalance(
    balanceId: string,
    payload: Partial<CreateMonthlyBalancePayload>
  ): Observable<ApiResponse<BackendMonthlyBalance>> {
    return this.http.put<ApiResponse<BackendMonthlyBalance>>(
      `${this.baseURL}/${balanceId}`,
      payload,
      {
        context: new HttpContext().set(LOADER_MESSAGE, '✏️ Actualizando balance...')
      }
    );
  }

  deleteBalance(balanceId: string): Observable<any> {
    return this.http.delete(`${this.baseURL}/${balanceId}`, {
      context: new HttpContext().set(LOADER_MESSAGE, '🗑️ Eliminando balance...')
    });
  }

  getBalanceSummary(balanceId: string): Observable<ApiResponse<BalanceSummary>> {
    return this.http.get<ApiResponse<BalanceSummary>>(
      `${this.baseURL}/${balanceId}/summary`,
      {
        context: new HttpContext().set(SKIP_LOADER, true)
      }
    );
  }

  updateExpenseDetail(
    detailId: string,
    payload: Partial<CreateExpenseDetailPayload>
  ): Observable<ApiResponse<BackendExpenseDetail>> {
    return this.http.put<ApiResponse<BackendExpenseDetail>>(
      `${this.baseURL}/expense-detail/${detailId}`,
      payload,
      {
        context: new HttpContext().set(SKIP_LOADER, true)
      }
    );
  }

  deleteExpenseDetail(detailId: string): Observable<any> {
    return this.http.delete(
      `${this.baseURL}/expense-detail/${detailId}`,
      {
        context: new HttpContext().set(LOADER_MESSAGE, '🗑️ Eliminando detalle...')
      }
    );
  }
}
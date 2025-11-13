import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/auth.interface';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = `${environment.API_URL}/auth`;
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadStoredSession();
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password })
            .pipe(
                tap(response => this.storeSession(response))
            );
    }

    refreshToken(): Observable<AuthResponse> {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            throw new Error('No hay refresh token');
        }

        return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, {
            refresh_token: refreshToken
        }).pipe(
            tap(response => this.storeSession(response))
        );
    }

    logout(): Observable<any> {
        const accessToken = localStorage.getItem('access_token');

        return this.http.post(`${this.API_URL}/logout`, { access_token: accessToken })
            .pipe(
                tap(() => this.clearSession())
            );
    }

    private storeSession(response: AuthResponse): void {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('expires_at', response.expires_at.toString());
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
    }

    private clearSession(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    private loadStoredSession(): void {
        const user = localStorage.getItem('user');
        if (user) {
            this.currentUserSubject.next(JSON.parse(user));
        }
    }

    isTokenExpired(): boolean {
        const expiresAt = localStorage.getItem('expires_at');
        if (!expiresAt) return true;

        return Date.now() >= parseInt(expiresAt) * 1000;
    }

    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    getUserRole(): string | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user).role : null;
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken() && !this.isTokenExpired();
    }
}
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardStreamPayload } from '../models/dashboard.interface';

@Injectable({
    providedIn: 'root'
})
export class DashboardService implements OnDestroy {

    private readonly baseStreamURL = `${environment.API_URL.replace('/portfolio', '')}/dashboard/stream`;
    private eventSource: EventSource | null = null;

    constructor(private ngZone: NgZone) { }

    connectStream(): Observable<DashboardStreamPayload> {
        return new Observable(observer => {
            this.disconnect();

            const token = localStorage.getItem('access_token');
            if (!token) {
                observer.error(new Error('No hay token de autenticación'));
                return;
            }

            const url = `${this.baseStreamURL}?token=${token}`;
            this.eventSource = new EventSource(url);

            this.eventSource.onmessage = (event) => {
                this.ngZone.run(() => {
                    try {
                        const payload: DashboardStreamPayload = JSON.parse(event.data);
                        observer.next(payload);
                    } catch (err) {
                        observer.error(err);
                    }
                });
            };

            this.eventSource.onerror = () => {
                this.ngZone.run(() => {
                    if (this.eventSource?.readyState === EventSource.CLOSED) {
                        observer.error(new Error('Conexión al stream cerrada'));
                    }
                    // readyState CONNECTING = reconectando automáticamente, no hacer nada
                });
            };

            this.eventSource.addEventListener('error', (event: any) => {
                this.ngZone.run(() => {
                    observer.error(new Error(event.data?.message ?? 'Error en stream del servidor'));
                });
            });

            return () => this.disconnect();
        });
    }

    disconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
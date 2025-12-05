import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {
    private loadingCount = signal<number>(0);
    public isLoading = signal<boolean>(false);
    public message = signal<string>('Cargando...');

    show(message: string = 'Cargando...'): void {
        this.loadingCount.update(count => count + 1);
        this.message.set(message);
        this.isLoading.set(true);
    }

    hide(): void {
        this.loadingCount.update(count => {
            const newCount = Math.max(0, count - 1);
            if (newCount === 0) {
                this.isLoading.set(false);
            }
            return newCount;
        });
    }

    forceHide(): void {
        this.loadingCount.set(0);
        this.isLoading.set(false);
    }

    updateMessage(message: string): void {
        if (this.isLoading()) {
            this.message.set(message);
        }
    }
}
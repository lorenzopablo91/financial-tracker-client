import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ToastType } from '../models/toast.interface';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private defaultConfig: MatSnackBarConfig = {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
    };

    constructor(private snackBar: MatSnackBar) { }

    success(message: string, duration?: number): void {
        this.show(message, ToastType.SUCCESS, duration);
    }

    error(message: string, duration?: number): void {
        this.show(message, ToastType.ERROR, duration || 5000);
    }

    warning(message: string, duration?: number): void {
        this.show(message, ToastType.WARNING, duration || 4000);
    }

    info(message: string, duration?: number): void {
        this.show(message, ToastType.INFO, duration);
    }

    private show(message: string, type: ToastType, duration?: number): void {
        const config: MatSnackBarConfig = {
            ...this.defaultConfig,
            duration: duration || this.defaultConfig.duration,
            panelClass: [`${type}-snackbar`]
        };

        this.snackBar.open(message, 'Cerrar', config);
    }
}
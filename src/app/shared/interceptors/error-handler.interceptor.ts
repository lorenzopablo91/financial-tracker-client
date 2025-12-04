import { inject } from '@angular/core';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpErrorResponse
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export const errorHandlerInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
    const snackBar = inject(MatSnackBar);
    const router = inject(Router);

    const messages: Record<number, string> = {
        400: 'Solicitud incorrecta',
        401: 'No autorizado. Por favor, inicia sesión nuevamente',
        403: 'Acceso denegado',
        404: 'Recurso no encontrado',
        409: 'Conflicto al procesar la solicitud',
        500: 'Error interno del servidor',
        503: 'Servicio no disponible. Intenta más tarde'
    };

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {

            /** 1. Errores del cliente (network o JS) */
            if (error.error instanceof ErrorEvent) {
                const msg = `Error: ${error.error.message}`;
                showError(msg, snackBar);
                console.error('Error HTTP:', error);

                return throwError(() => ({
                    message: msg,
                    status: error.status,
                    originalError: error
                }));
            }

            /** 2. Mensajes enviados desde backend */
            if (error.error?.message) {
                showError(error.error.message, snackBar);
                console.error('Error HTTP:', error);

                return throwError(() => ({
                    message: error.error.message,
                    status: error.status,
                    originalError: error
                }));
            }

            /** 3. Backend devolvió texto plano */
            if (typeof error.error === 'string') {
                showError(error.error, snackBar);
                console.error('Error HTTP:', error);

                return throwError(() => ({
                    message: error.error,
                    status: error.status,
                    originalError: error
                }));
            }

            /** 4. Mensaje por código HTTP */
            const message = messages[error.status] ?? `Error ${error.status}: ${error.message}`;

            // Acciones adicionales en casos especiales
            if (error.status === 401) {
                router.navigate(['/login']);
            }

            showError(message, snackBar);
            console.error('Error HTTP:', error);

            return throwError(() => ({
                message,
                status: error.status,
                originalError: error
            }));
        })
    );
};

function showError(message: string, snackBar: MatSnackBar): void {
    snackBar.open(message, 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
    });
}

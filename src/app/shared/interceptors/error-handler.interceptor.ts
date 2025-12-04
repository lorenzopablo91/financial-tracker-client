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

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ha ocurrido un error inesperado';

            if (error.error instanceof ErrorEvent) {
                // Error del cliente
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Error del servidor
                switch (error.status) {
                    case 400:
                        errorMessage = 'Solicitud incorrecta';
                        break;
                    case 401:
                        errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente';
                        router.navigate(['/login']);
                        break;
                    case 403:
                        errorMessage = 'Acceso denegado';
                        break;
                    case 404:
                        errorMessage = 'Recurso no encontrado';
                        break;
                    case 500:
                        errorMessage = 'Error interno del servidor';
                        break;
                    case 503:
                        errorMessage = 'Servicio no disponible. Intenta más tarde';
                        break;
                    default:
                        errorMessage = `Error ${error.status}: ${error.message}`;
                }
            }

            // Mostrar notificación al usuario
            showError(errorMessage, snackBar);

            // Log del error para debugging
            console.error('Error HTTP:', error);

            // Retornar el error para que el componente pueda manejarlo si es necesario
            return throwError(() => ({
                message: errorMessage,
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
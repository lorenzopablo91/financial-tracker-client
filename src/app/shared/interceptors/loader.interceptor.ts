import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';
import { LOADER_MESSAGE, SKIP_LOADER, SKIP_PROGRESSIVE_MESSAGES } from './loader-context.interceptor';

// Rutas que NO deben mostrar el loader global
const EXCLUDED_ROUTES = ['/portfolios'];

// Métodos que siempre muestran loader
const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

function shouldShowLoader(req: HttpRequest<any>): boolean {
    if (req.context.get(SKIP_LOADER)) return false;

    if (MUTATION_METHODS.includes(req.method)) return true;

    if (req.method === 'GET') {
        const isPortfolioList =
            req.url.includes('/portfolios') &&
            !req.url.includes('/portfolios/') &&
            !req.url.includes('?');

        return !isPortfolioList;
    }

    return true;
}

function getInitialMessage(req: HttpRequest<any>): string {
    if (req.method === 'POST') return 'Creando...';
    if (req.method === 'PUT' || req.method === 'PATCH') return 'Actualizando...';
    if (req.method === 'DELETE') return 'Eliminando...';
    if (req.url.includes('valorizar')) return 'Calculando valuación...';
    if (req.url.includes('snapshots')) return 'Cargando histórico...';

    return 'Cargando datos...';
}

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
    const loaderService = inject(LoaderService);

    if (!shouldShowLoader(req)) return next(req);

    const customMessage = req.context.get(LOADER_MESSAGE);
    const skipProgressiveMessages = req.context.get(SKIP_PROGRESSIVE_MESSAGES);

    loaderService.show(customMessage ?? getInitialMessage(req));

    const timers: any[] = [];

    if (!skipProgressiveMessages) {
        const progressiveSteps = [
            { text: '⏳ Ups, esto puede demorar un rato más...', delay: 10000 },
            { text: '🌐 Conectando nuevamente la aplicación...', delay: 30000 },
            { text: '⚙️ Ajustando configuraciones necesarias...', delay: 45000 },
            { text: '🚀 Finalizando los últimos detalles...', delay: 60000 },
            { text: '🙌 ¡Gracias por la espera, todo listo!', delay: 90000 },
        ];

        progressiveSteps.forEach(step => {
            timers.push(setTimeout(() => loaderService.updateMessage(step.text), step.delay));
        });
    }

    return next(req).pipe(
        finalize(() => {
            timers.forEach(clearTimeout);
            loaderService.hide();
        })
    );
};

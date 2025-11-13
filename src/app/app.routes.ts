import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./shared/components/login/login.component')
            .then(m => m.LoginComponent),
        data: { hideMenu: true }
    },
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    //   {
    //     path: 'dashboard',
    //     loadComponent: () => import('./components/dashboard/dashboard.component')
    //       .then(m => m.DashboardComponent),
    //     canActivate: [authGuard],
    //   },
    {
        path: 'balance',
        loadComponent: () => import('./components/balance/balance.component')
            .then(m => m.BalanceComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: 'ADMIN' }
    },
    {
        path: 'wallet',
        loadComponent: () => import('./components/wallet/wallet.component')
            .then(m => m.WalletComponent),
        canActivate: [authGuard],
        data: { role: 'ADMIN' }
    },
    {
        path: 'unauthorized',
        loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
            .then(m => m.UnauthorizedComponent)
    },
    {
        path: '**',
        loadComponent: () => import('./shared/components/not-found/not-found.component')
            .then(m => m.NotFoundComponent),
        canActivate: [authGuard]
    }
];

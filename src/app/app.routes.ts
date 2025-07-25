import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'balance',
        loadComponent: () => import('./components/balance/balance.component').then(m => m.BalanceComponent)
    }
];
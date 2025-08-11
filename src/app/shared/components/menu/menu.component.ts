import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialImports } from '../../imports/material-imports';
import { MenuItem } from '../../../models/menu.interface';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    ...MaterialImports,
    CommonModule,
    RouterModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  menuItems = signal<MenuItem[]>([
    {
      path: '/balance',
      label: 'Balance',
      icon: 'account_balance'
    },
    {
      path: '/wallet',
      label: 'Billetera',
      icon: 'wallet'
    }
  ]);

  constructor(private router: Router) { }

  // Método opcional para navegar programáticamente
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Método para agregar nuevos items dinámicamente
  addMenuItem(item: MenuItem): void {
    this.menuItems.update(items => [...items, item]);
  }
}
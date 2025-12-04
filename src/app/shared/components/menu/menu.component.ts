import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MaterialImports } from '../../imports/material-imports';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MenuItem } from '../../models/menu.interface';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog.component';

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
  private allMenuItems = signal<MenuItem[]>([
    {
      path: '/balance',
      label: 'BALANCE',
      icon: 'account_balance',
      roles: ['ADMIN']
    },
    {
      path: '/portfolio',
      label: 'PORTAFOLIO',
      icon: 'portfolio',
      roles: ['ADMIN', 'VIEWER']
    }
  ]);

  menuItems = computed(() => {
    const userRole = this.authService.getUserRole();

    if (!userRole) {
      return [];
    }

    return this.allMenuItems().filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.includes(userRole);
    });
  });

  currentUser$ = this.authService.currentUser$;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  addMenuItem(item: MenuItem): void {
    this.allMenuItems.update(items => [...items, item]);
  }

  onLogout(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '90vw',
      autoFocus: false,
      panelClass: 'custom-confirm-dialog',
      data: {
        title: 'Cerrar Sesión',
        message: '¿Estás seguro que deseas cerrar sesión?',
        confirmText: 'Cerrar Sesión',
        cancelText: 'Cancelar',
        icon: 'logout'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout().subscribe({
          next: () => {
            this.router.navigate(['/login']);
          },
          error: (error) => {
            this.authService['clearSession']();
            this.router.navigate(['/login']);
          }
        });
      }
    });
  }
}
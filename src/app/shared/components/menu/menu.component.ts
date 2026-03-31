import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HttpContext } from '@angular/common/http';
import { MaterialImports } from '../../imports/material-imports';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MenuItem } from '../../models/menu.interface';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog.component';
import { MENU_ITEMS } from '../../../data/menu.data';
import { filter, finalize } from 'rxjs/operators';
import { LOADER_MESSAGE } from '../../interceptors/loader-context.interceptor';

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
  private allMenuItems = signal<MenuItem[]>(MENU_ITEMS);
  private currentRoute = signal<string>('');

  // Computed que devuelve todos los items con información de si están habilitados
  menuItems = computed(() => {
    const userRole = this.authService.getUserRole();
    const currentRoute = this.currentRoute();

    if (!userRole) {
      return this.allMenuItems().map(item => ({
        ...item,
        enabled: false,
        isActive: false
      }));
    }

    return this.allMenuItems().map(item => ({
      ...item,
      enabled: !item.roles || item.roles.length === 0 || item.roles.includes(userRole),
      isActive: currentRoute === item.path
    }));
  });

  currentUser$ = this.authService.currentUser$;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    // Detectar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        this.currentRoute.set(navEnd.urlAfterRedirects);
      });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Método para verificar si un item está habilitado antes de navegar
  onMenuClick(item: MenuItem & { enabled: boolean }, event: Event): void {
    if (!item.enabled) {
      event.preventDefault();
      event.stopPropagation();
    }
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
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        icon: 'logout'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const context = new HttpContext().set(LOADER_MESSAGE, '👋 Saliendo de la sesión..');

        this.authService.logout({ context })
          .pipe(
            finalize(() => {
              this.router.navigate(['/login']);
            })
          )
          .subscribe({
            next: () => {
              // Navigation happens in finalize
            },
            error: (error) => {
              this.authService['clearSession']();
              // Navigation happens in finalize
            }
          });
      }
    });
  }
}
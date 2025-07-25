import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './shared/components/menu/menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  template: `
    <app-menu></app-menu>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
    }
  `]
})
export class AppComponent {
  title = 'Gestor de Finanzas';
}
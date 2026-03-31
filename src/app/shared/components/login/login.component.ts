import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpContext } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MaterialImports } from '../../imports/material-imports';
import { LOADER_MESSAGE } from '../../interceptors/loader-context.interceptor';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialImports],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.loading = true;
    this.error = '';

    const context = new HttpContext().set(LOADER_MESSAGE, '🔐 Ingresando a la sesión..');

    this.authService.login(this.credentials.email, this.credentials.password, { context })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          if (error.status === 401) {
            this.error = 'Email o contraseña incorrectos';
          } else if (error.status === 0) {
            this.error = 'No se pudo conectar con el servidor';
          } else {
            this.error = 'Error al iniciar sesión. Intenta nuevamente.';
          }
        }
      });
  }
}

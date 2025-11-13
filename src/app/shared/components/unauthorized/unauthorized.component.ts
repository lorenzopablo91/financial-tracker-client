import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="no-portfolio-message">
      <mat-icon>lock</mat-icon>
      <h2>Acceso denegado</h2>
      <p>No tienes permisos para acceder a esta página.</p>
      <button class="active" (click)="goBack()">Volver</button>
    </div>
  `,
  styles: [`
    .no-portfolio-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 24px;
      gap: 12px;

      @media (min-width: 768px) {
        padding: 80px 24px;
        gap: 16px;
      }

      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--text-secondary);
        opacity: 0.5;

        @media (min-width: 768px) {
          font-size: 72px;
          width: 72px;
          height: 72px;
        }
      }

      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;

        @media (min-width: 768px) {
          font-size: 1.5rem;
        }
      }

      p {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0;
        max-width: 400px;

        @media (min-width: 768px) {
          font-size: 1rem;
        }
      }

      button {
        font-family: 'Roboto Mono';
        min-width: 50px;
        height: 32px;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: 4px;
        transition: all 0.2s ease;
        color: var(--text-secondary);
        border: none;
        background: transparent;
        cursor: pointer;
        margin-top: 16px;

        &:hover {
          background-color: rgba(var(--primary-500-rgb), 0.1);
          color: var(--primary-500);
        }

        &.active {
          background-color: var(--primary-500);
          color: white;
          font-weight: 600;
          font-family: 'Roboto Mono';

          &:hover {
            background-color: var(--primary-600);
          }
        }
      }
    }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) { }

  goBack(): void {
    this.router.navigate(['/wallet']);
  }
}

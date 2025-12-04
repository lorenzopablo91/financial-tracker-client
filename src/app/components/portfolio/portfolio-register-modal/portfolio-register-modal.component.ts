import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialImports } from '../../../shared/imports/material-imports';

@Component({
  selector: 'app-portfolio-register-modal',
  standalone: true,
  imports: [
    ...MaterialImports,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './portfolio-register-modal.component.html',
  styleUrls: ['./portfolio-register-modal.component.scss']
})
export class PortfolioRegisterModalComponent {
  portfolioForm: FormGroup;
  readonly isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PortfolioRegisterModalComponent>
  ) {
    this.portfolioForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      capitalInicial: [null, [Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.portfolioForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      // Preparar los datos, eliminando campos vacíos opcionales
      const formData = { ...this.portfolioForm.value };

      // Si descripción está vacía, no la enviamos
      if (!formData.descripcion || formData.descripcion.trim() === '') {
        delete formData.descripcion;
      }

      // Si capitalInicial es null, 0 o vacío, no lo enviamos
      if (formData.capitalInicial === null || formData.capitalInicial === '' || formData.capitalInicial === 0) {
        delete formData.capitalInicial;
      }

      this.dialogRef.close(formData);
    }
  }

  onCancel(): void {
    if (!this.isSubmitting()) {
      this.dialogRef.close(null);
    }
  }
}
import { ChangeDetectionStrategy, Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<{ email: string; password: string }>();
  @Output() openRegister = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();

  showPassword = signal(false);
  isFlipped = signal(false);

  loginForm = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  useCredentials(email: string, role: string) {
    const password =
      role === 'ADMIN'
        ? 'admin123'
        : role === 'BIBL'
        ? 'biblio123'
        : role === 'DOC'
        ? 'docente123'
        : 'estudiante123';
    this.loginForm.setValue({ email, password });
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.getRawValue();
    this.loginSuccess.emit({ email, password });
  }

  toggleFlip() {
    this.isFlipped.update(v => !v);
  }
}

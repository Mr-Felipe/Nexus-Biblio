import { ChangeDetectionStrategy, Component, signal, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  @Output() registerSuccess = new EventEmitter<{ name: string; email: string; password: string; role: 'DOC' | 'EST'; phone: string; address: string }>();
  @Output() openLogin = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();

  private state = inject(LibraryState);

  showPassword = signal(false);

  registerForm = new FormGroup({
    name: new FormControl('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
    phone: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    address: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    role: new FormControl<'DOC' | 'EST'>('EST', { validators: [Validators.required], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required, Validators.minLength(4)], nonNullable: true }),
  });

  onRegisterSubmit() {
    if (this.registerForm.invalid) return;
    const raw = this.registerForm.getRawValue();
    this.registerSuccess.emit({
      name: raw.name,
      email: raw.email,
      password: raw.password,
      role: raw.role,
      phone: raw.phone,
      address: raw.address,
    });
  }
}

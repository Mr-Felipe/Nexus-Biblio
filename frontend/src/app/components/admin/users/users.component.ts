import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, User, normalizeText } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  userSearchQuery = signal('');
  userRoleFilter = signal('ALL');
  showAddUserModal = signal(false);
  editingUser = signal<User | null>(null);
  showDeleteConfirmModal = signal(false);
  userToDelete = signal<User | null>(null);
  deleteBlockReasons = signal<string[]>([]);

  filteredUsers = computed(() => {
    const q = normalizeText(this.userSearchQuery().trim());
    const role = this.userRoleFilter();
    return this.state.users().filter((u) => {
      const matchQ = normalizeText(u.name).includes(q) || normalizeText(u.id).includes(q) || normalizeText(u.email).includes(q);
      const matchRole = role === 'ALL' || u.role === role;
      return matchQ && matchRole;
    });
  });

  userForm = new FormGroup({
    name: new FormControl('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    role: new FormControl<'ADMIN' | 'BIBL' | 'DOC' | 'EST'>('EST', { validators: [Validators.required], nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    identificacion: new FormControl('', { nonNullable: true }),
  });

  openAddUserModal() {
    this.editingUser.set(null);
    this.userForm.reset({
      name: '',
      email: '',
      role: 'EST',
      password: '',
      phone: '',
      address: '',
      identificacion: '',
    });
    this.showAddUserModal.set(true);
  }

  openEditUserModal(user: User) {
    this.editingUser.set(user);
    this.userForm.setValue({
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || '',
      phone: user.phone || '',
      address: user.address || '',
      identificacion: user.identificacion || '',
    });
    this.showAddUserModal.set(true);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.toast.show('error', 'Por favor, rellene todos los campos correctamente.');
      return;
    }

    const raw = this.userForm.getRawValue();
    const editMode = this.editingUser();

    if (editMode) {
      this.state.updateUser(editMode.id, {
        name: raw.name,
        email: raw.email,
        role: raw.role,
        password: raw.password || undefined,
        phone: raw.phone || undefined,
        address: raw.address || undefined,
        identificacion: raw.identificacion || undefined,
      });
      this.toast.show('success', 'Usuario actualizado correctamente.');
    } else {
      this.state.addUser({
        name: raw.name,
        email: raw.email,
        role: raw.role,
        password: raw.password || undefined,
        phone: raw.phone || undefined,
        address: raw.address || undefined,
        identificacion: raw.identificacion || undefined,
      });
      this.toast.show('success', 'Usuario registrado exitosamente.');
    }

    this.showAddUserModal.set(false);
  }

  isUserSanctioned(userId: string): boolean {
    return this.state.sanctions().some(s => s.userId === userId && s.status === 'Activa');
  }

  deleteUser(user: User) {
    const activeLoans = this.state.loans().filter(
      l => l.userId === user.id && !['Devuelto', 'Rechazado', 'Cancelado'].includes(l.status)
    );
    const activeReservations = this.state.reservations().filter(
      r => r.userId === user.id && ['En cola', 'Listo para retirar'].includes(r.status)
    );

    const reasons: string[] = [];
    if (activeLoans.length > 0) {
      reasons.push(`${activeLoans.length} préstamo(s) activo(s)`);
    }
    if (activeReservations.length > 0) {
      reasons.push(`${activeReservations.length} reserva(s) activa(s)`);
    }

    this.userToDelete.set(user);
    this.deleteBlockReasons.set(reasons);
    this.showDeleteConfirmModal.set(true);
  }

  confirmDeleteUser() {
    const user = this.userToDelete();
    if (!user) return;
    this.state.deleteUser(user.id);
    this.toast.show('success', 'Usuario eliminado con éxito.');
    this.showDeleteConfirmModal.set(false);
    this.userToDelete.set(null);
  }
}

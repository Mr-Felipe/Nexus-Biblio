import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, User } from '../../../library-state';
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

  filteredUsers = computed(() => {
    const q = this.userSearchQuery().toLowerCase().trim();
    const role = this.userRoleFilter();
    return this.state.users().filter((u) => {
      const matchQ = u.name.toLowerCase().includes(q) || u.id.includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = role === 'ALL' || u.role === role;
      return matchQ && matchRole;
    });
  });

  userForm = new FormGroup({
    id: new FormControl('', { validators: [Validators.required, Validators.pattern(/^\d+$/)], nonNullable: true }),
    name: new FormControl('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    role: new FormControl<'ADMIN' | 'BIBL' | 'DOC' | 'EST'>('EST', { validators: [Validators.required], nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    phone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });

  openAddUserModal() {
    this.editingUser.set(null);
    this.userForm.reset({
      id: '',
      name: '',
      email: '',
      role: 'EST',
      password: '',
      phone: '',
      address: '',
    });
    this.userForm.get('id')?.enable();
    this.showAddUserModal.set(true);
  }

  openEditUserModal(user: User) {
    this.editingUser.set(user);
    this.userForm.setValue({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password || '',
      phone: user.phone || '',
      address: user.address || '',
    });
    this.userForm.get('id')?.disable();
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
      });
      this.toast.show('success', 'Usuario actualizado correctamente.');
    } else {
      const exists = this.state.users().some((u) => u.id === raw.id);
      if (exists) {
        this.toast.show('error', `Ya existe un usuario con el ID ${raw.id}`);
        return;
      }
      this.state.addUser({
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: raw.role,
        password: raw.password || undefined,
        phone: raw.phone || undefined,
        address: raw.address || undefined,
      });
      this.toast.show('success', 'Usuario registrado exitosamente.');
    }

    this.showAddUserModal.set(false);
  }

  toggleUserStatus(user: User) {
    const newStatus = user.status === 'Activo' ? 'Inactivo' : 'Activo';
    this.state.updateUser(user.id, { status: newStatus });
    this.toast.show('info', `Estado de ${user.name} cambiado a: ${newStatus}`);
  }

  deleteUser(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.state.deleteUser(id);
      this.toast.show('success', 'Usuario eliminado con éxito.');
    }
  }
}

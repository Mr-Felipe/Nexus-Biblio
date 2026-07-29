import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from './library-state';
import { ToastService } from './services/toast.service';

// Auth components
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';

// Layout components
import { HeaderComponent } from './components/layout/header/header.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { ToastComponent } from './components/layout/toast/toast.component';

// Admin components
import { UsersComponent } from './components/admin/users/users.component';
import { InventoryComponent } from './components/admin/inventory/inventory.component';
import { LoansComponent } from './components/admin/loans/loans.component';
import { ReturnsComponent } from './components/admin/returns/returns.component';
import { ReservationsComponent } from './components/admin/reservations/reservations.component';
import { SanctionsComponent } from './components/admin/sanctions/sanctions.component';
import { ReportsComponent } from './components/admin/reports/reports.component';

// Client components
import { HomeComponent } from './components/client/home/home.component';
import { CatalogueComponent } from './components/client/catalogue/catalogue.component';
import { MyLoansComponent } from './components/client/my-loans/my-loans.component';
import { MyReservationsComponent } from './components/client/my-reservations/my-reservations.component';
import { MySanctionsComponent } from './components/client/my-sanctions/my-sanctions.component';

// Footer
import { FooterComponent } from './components/footer/footer.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule,
    MatIconModule,
    // Auth
    LoginComponent,
    RegisterComponent,
    // Layout
    HeaderComponent,
    SidebarComponent,
    ToastComponent,
    // Admin
    UsersComponent,
    InventoryComponent,
    LoansComponent,
    ReturnsComponent,
    ReservationsComponent,
    SanctionsComponent,
    ReportsComponent,
    // Client
    HomeComponent,
    CatalogueComponent,
    MyLoansComponent,
    MyReservationsComponent,
    MySanctionsComponent,
    // Footer
    FooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  // UI state signals
  mobileSidebarOpen = signal(false);
  showLoginRequiredModal = signal(false);
  showNewRegister = signal(false);

  ngOnInit() {
    // no-op, state initializes itself
  }

  // Navigation
  navigateTo(view: string) {
    this.state.activeView.set(view);
    this.mobileSidebarOpen.set(false);
    if (view === 'login') {
      this.showNewRegister.set(false);
    }
  }

  // Auth handlers
  handleLogin(credentials: { email: string; password: string }) {
    const success = this.state.login(credentials.email, credentials.password);
    if (success) {
      this.toast.show('success', `¡Bienvenido de nuevo, ${this.state.currentUser()?.name}!`);
      this.navigateTo('home');
    } else {
      this.toast.show('error', 'Credenciales inválidas o usuario inactivo.');
    }
  }

  handleNewRegister(data: { name: string; email: string; password: string; role: 'DOC' | 'EST'; phone: string; address: string; identificacion: string }) {
    const exists = this.state.users().some((u) => u.email === data.email);
    if (exists) {
      this.toast.show('error', `Ya existe un usuario con el correo ${data.email}`);
      return;
    }

    this.state.addUser({
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
      phone: data.phone,
      address: data.address,
      identificacion: data.identificacion,
    });

    this.toast.show('success', '¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.');
    this.showNewRegister.set(false);
    this.navigateTo('login');
  }

  toggleNewAuthView() {
    this.showNewRegister.update(v => !v);
  }

  onLogout() {
    this.state.logout();
    this.toast.show('info', 'Sesión cerrada exitosamente.');
    this.navigateTo('home');
  }
}

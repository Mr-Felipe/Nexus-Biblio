import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  state = inject(LibraryState);

  stats = computed(() => this.state.getDashboardStats());

  loanStatusData = computed(() => {
    const loans = this.state.loans();
    const statuses = ['Activo', 'Pendiente devolución', 'Devuelto', 'Vencido'];
    const colors: Record<string, string> = {
      'Activo': 'bg-[#232233]',
      'Pendiente devolución': 'bg-amber-600',
      'Devuelto': 'bg-emerald-700',
      'Vencido': 'bg-red-600',
    };
    const data = statuses.map(s => ({
      label: s,
      value: loans.filter(l => l.status === s).length,
      color: colors[s] || 'bg-gray-500',
    }));
    const total = loans.length || 1;
    return data.map(d => ({ ...d, percent: (d.value / total) * 100 }));
  });

  recentLoans = computed(() => {
    return this.state.loans().slice(0, 5);
  });

  recentReservationsPending = computed(() => {
    return this.state.reservations().filter((r) => r.status === 'En cola' || r.status === 'Listo para retirar').slice(0, 5);
  });

  recentSanctionsActive = computed(() => {
    return this.state.sanctions().filter((s) => s.status === 'Activa').slice(0, 5);
  });

  navigateTo(view: string) {
    this.state.activeView.set(view);
  }
}

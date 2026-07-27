import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  dateFrom = signal('');
  dateTo = signal('');

  filteredLoans = computed(() => {
    let loans = this.state.loans();
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from) loans = loans.filter(l => l.loanDate >= from);
    if (to) loans = loans.filter(l => l.loanDate <= to);
    return loans;
  });

  loanStatusData = computed(() => {
    const loans = this.filteredLoans();
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

  sanctionStatusData = computed(() => {
    const sanctions = this.state.sanctions();
    return [
      { label: 'Activas', value: sanctions.filter(s => s.status === 'Activa').length, color: 'bg-red-600' },
      { label: 'Pagadas', value: sanctions.filter(s => s.status === 'Pagada').length, color: 'bg-emerald-700' },
    ];
  });

  exportReport(type: string) {
    const stats = this.state.getDashboardStats();
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const headers = 'Métrica,Valor,Fecha de Generación\n';
    const rows = [
      `"Total Copias en Catálogo",${stats.totalBooks},"${timestamp}"`,
      `"Copias Disponibles",${stats.availableBooks},"${timestamp}"`,
      `"Préstamos Activos",${stats.activeLoans},"${timestamp}"`,
      `"Préstamos Pendientes Devolución",${stats.pendingReturns},"${timestamp}"`,
      `"Total Préstamos Históricos",${stats.totalLoans},"${timestamp}"`,
      `"Reservas Activas",${stats.activeReservations},"${timestamp}"`,
      `"Sanciones Activas",${stats.activeSanctions},"${timestamp}"`,
      `"Usuarios Activos",${stats.activeUsers},"${timestamp}"`,
      `"Monto de Multas Pendientes",$${stats.totalFines},"${timestamp}"`,
    ].join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Reporte_BiblioLib_${type}.csv`);
    a.click();
    this.toast.show('success', `Exportación de reporte "${type}" completada como CSV.`);
  }

  exportPdf() {
    window.print();
    this.toast.show('info', 'Usa "Guardar como PDF" en el diálogo de impresión.');
  }
}

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, normalizeText } from '../../../library-state';
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

  stats = computed(() => {
    const books = this.state.books();
    const loans = this.state.loans();
    const reservations = this.state.reservations();
    const sanctions = this.state.sanctions();
    const users = this.state.users();

    const totalBooks = books.reduce((sum, b) => sum + b.copies, 0);
    const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);
    const activeLoans = loans.filter((l) => l.status === 'Activo' || l.status === 'Pendiente devolución' || l.status === 'Vencido').length;
    const pendingReturns = loans.filter((l) => l.status === 'Pendiente devolución').length;
    const totalLoans = loans.length;
    const activeReservations = reservations.filter((r) => r.status === 'En cola' || r.status === 'Listo para retirar').length;
    const activeSanctions = sanctions.filter((s) => s.status === 'Activa').length;
    const totalFines = sanctions.filter((s) => s.status === 'Activa').reduce((sum, s) => sum + s.fine, 0);
    const activeUsers = users.filter((u) => u.status === 'Activo').length;

    return { totalBooks, availableBooks, activeLoans, pendingReturns, totalLoans, activeReservations, activeSanctions, totalFines, activeUsers };
  });

  ejemplarStats = computed(() => {
    const all = this.state.books().flatMap(b => b.ejemplares || []);
    return {
      total: all.length,
      DISPONIBLE: all.filter(e => e.estado === 'DISPONIBLE').length,
      PRESTADO: all.filter(e => e.estado === 'PRESTADO').length,
      DAÑADO: all.filter(e => e.estado === 'DAÑADO').length,
      PERDIDO: all.filter(e => e.estado === 'PERDIDO').length,
    };
  });

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

  recentLoans = computed(() => this.state.loans().slice(0, 5));

  recentSanctionsActive = computed(() =>
    this.state.sanctions().filter(s => s.status === 'Activa').slice(0, 5)
  );

  activeLoansList = computed(() =>
    this.state.loans().filter(l => l.status === 'Activo')
  );

  pendingReturnsList = computed(() =>
    this.state.loans().filter(l => l.status === 'Pendiente devolución')
  );

  activeReservationsList = computed(() =>
    this.state.reservations().filter(r => r.status === 'En cola' || r.status === 'Listo para retirar')
  );

  sanctionedUsers = computed(() =>
    this.state.sanctions()
      .filter(s => s.status === 'Activa')
      .map(s => ({
        userName: s.userName,
        type: s.type,
        reason: s.reason,
        fine: s.fine,
      }))
  );

  navigateTo(view: string) {
    this.state.activeView.set(view);
  }

  historyTab = signal<'loans' | 'sanctions' | 'ejemplares'>('loans');
  historySearchQuery = signal('');

  setHistoryTab(tab: 'loans' | 'sanctions' | 'ejemplares') {
    this.historyTab.set(tab);
    this.historySearchQuery.set('');
  }

  historyLoans = computed(() => {
    const q = normalizeText(this.historySearchQuery().trim());
    return this.state.loans().filter(l => {
      const isHistory = l.status === 'Devuelto' || l.status === 'Vencido' || l.status === 'Cancelado';
      const matchQ = normalizeText(l.userName).includes(q) || normalizeText(l.bookTitle).includes(q) || normalizeText(l.id).includes(q);
      return isHistory && matchQ;
    }).sort((a, b) => {
      const dateA = a.returnDate || a.dueDate;
      const dateB = b.returnDate || b.dueDate;
      return dateB.localeCompare(dateA);
    });
  });

  historySanctions = computed(() => {
    const q = normalizeText(this.historySearchQuery().trim());
    return this.state.sanctions().filter(s => {
      const isHistory = s.status === 'Pagada';
      const matchQ = normalizeText(s.userName).includes(q) || normalizeText(s.reason).includes(q) || normalizeText(s.id).includes(q);
      return isHistory && matchQ;
    }).sort((a, b) => b.date.localeCompare(a.date));
  });

  unavailableEjemplares = computed(() => {
    const q = normalizeText(this.historySearchQuery().trim());
    const result: { bookTitle: string; bookIsbn: string; ejemplarNumero: number; codigo: string; estado: string }[] = [];
    for (const book of this.state.books()) {
      for (const ej of book.ejemplares || []) {
        if (ej.estado === 'PERDIDO' || ej.estado === 'DAÑADO') {
          const matchQ = normalizeText(book.title).includes(q) || normalizeText(book.isbn).includes(q) || normalizeText(ej.codigo).includes(q);
          if (matchQ) {
            result.push({ bookTitle: book.title, bookIsbn: book.isbn, ejemplarNumero: ej.numero, codigo: ej.codigo, estado: ej.estado });
          }
        }
      }
    }
    return result.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
  });

  totalUnavailable = computed(() => {
    let count = 0;
    for (const book of this.state.books()) {
      for (const ej of book.ejemplares || []) {
        if (ej.estado === 'PERDIDO' || ej.estado === 'DAÑADO') count++;
      }
    }
    return count;
  });

  exportReport(type: string) {
    const stats = this.state.getDashboardStats();
    const ej = this.ejemplarStats();
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const headers = 'Métrica,Valor,Fecha de Generación\n';
    const rows = [
      `"Total Copias en Catálogo",${stats.totalBooks},"${timestamp}"`,
      `"Copias Disponibles",${stats.availableBooks},"${timestamp}"`,
      `"Ejemplares Disponibles",${ej.DISPONIBLE},"${timestamp}"`,
      `"Ejemplares Prestados",${ej.PRESTADO},"${timestamp}"`,
      `"Ejemplares Dañados",${ej['DAÑADO']},"${timestamp}"`,
      `"Ejemplares Perdidos",${ej['PERDIDO']},"${timestamp}"`,
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

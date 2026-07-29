import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, normalizeText } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent {
  state = inject(LibraryState);
  private cdr = inject(ChangeDetectorRef);

  activeTab = signal<'loans' | 'sanctions' | 'ejemplares'>('loans');
  searchQuery = signal('');

  setTab(tab: 'loans' | 'sanctions' | 'ejemplares') {
    this.activeTab.set(tab);
    this.searchQuery.set('');
  }

  // Historial de préstamos devueltos o vencidos
  historyLoans = computed(() => {
    const q = normalizeText(this.searchQuery().trim());
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

  // Historial de sanciones pagadas
  historySanctions = computed(() => {
    const q = normalizeText(this.searchQuery().trim());
    return this.state.sanctions().filter(s => {
      const isHistory = s.status === 'Pagada';
      const matchQ = normalizeText(s.userName).includes(q) || normalizeText(s.reason).includes(q) || normalizeText(s.id).includes(q);
      return isHistory && matchQ;
    }).sort((a, b) => b.date.localeCompare(a.date));
  });

  // Ejemplares no disponibles (Perdidos y Dañados)
  unavailableEjemplares = computed(() => {
    const q = normalizeText(this.searchQuery().trim());
    const result: { bookTitle: string; bookIsbn: string; ejemplarNumero: number; codigo: string; estado: string }[] = [];

    for (const book of this.state.books()) {
      for (const ej of book.ejemplares || []) {
        if (ej.estado === 'PERDIDO' || ej.estado === 'DAÑADO') {
          const matchQ = normalizeText(book.title).includes(q) || normalizeText(book.isbn).includes(q) || normalizeText(ej.codigo).includes(q);
          if (matchQ) {
            result.push({
              bookTitle: book.title,
              bookIsbn: book.isbn,
              ejemplarNumero: ej.numero,
              codigo: ej.codigo,
              estado: ej.estado,
            });
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

  constructor() {
    setTimeout(() => this.cdr.markForCheck());
  }
}

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Book, BookCopy } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  bookSearchQuery = signal('');
  expandedBookIsbn = signal<string | null>(null);

  filteredBooks = computed(() => {
    const q = this.bookSearchQuery().toLowerCase().trim();
    return this.state.books().filter((b) => {
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
    });
  });

  totalCopiesCount = computed(() => {
    return this.state.books().reduce((acc, b) => acc + b.copies, 0);
  });

  totalAvailableCopiesCount = computed(() => {
    return this.state.books().reduce((acc, b) => acc + b.availableCopies, 0);
  });

  totalLoanedCopiesCount = computed(() => {
    return this.state.books().reduce((acc, b) => acc + (b.copies - b.availableCopies), 0);
  });

  getLoanedCopiesCount(isbn: string): number {
    const book = this.state.books().find((b) => b.isbn === isbn);
    if (!book) return 0;
    return Math.max(0, book.copies - book.availableCopies);
  }

  incrementCopies(book: Book) {
    this.state.updateBook(book.isbn, { copies: book.copies + 1 });
    this.toast.show('success', `Se agregó un ejemplar para "${book.title}". Total: ${book.copies + 1}`);
  }

  decrementCopies(book: Book) {
    const loaned = this.getLoanedCopiesCount(book.isbn);
    if (book.copies <= loaned) {
      this.toast.show('error', `No se pueden retirar ejemplares. Hay ${loaned} copias actualmente prestadas o reservadas.`);
      return;
    }
    this.state.updateBook(book.isbn, { copies: book.copies - 1 });
    this.toast.show('success', `Se retiró un ejemplar para "${book.title}". Total: ${book.copies - 1}`);
  }

  toggleBookExemplars(isbn: string) {
    if (this.expandedBookIsbn() === isbn) {
      this.expandedBookIsbn.set(null);
    } else {
      this.expandedBookIsbn.set(isbn);
    }
  }

  getBookCopies(book: Book): BookCopy[] {
    const copies: BookCopy[] = [];
    const customStatuses = book.customCopyStatuses || {};

    const activeLoans = this.state.loans().filter(l => l.bookIsbn === book.isbn && (l.status === 'Activo' || l.status === 'Pendiente devolución'));
    const activeReservations = this.state.reservations().filter(
      r => r.bookIsbn === book.isbn && (r.status === 'Listo para retirar' || (r.status === 'En cola' && r.queuePosition === 1))
    );

    let loanIndex = 0;
    let resIndex = 0;

    for (let i = 1; i <= book.copies; i++) {
      const customStatus = customStatuses[i];
      let status: 'Disponible' | 'Prestado' | 'En reserva' | 'Perdido' | 'Dañado' = 'Disponible';
      let loanDetails: BookCopy['loanDetails'] = undefined;
      let reservationDetails: BookCopy['reservationDetails'] = undefined;

      if (customStatus === 'Perdido' || customStatus === 'Dañado') {
        status = customStatus;
      } else if (loanIndex < activeLoans.length) {
        status = 'Prestado';
        const loan = activeLoans[loanIndex++];
        loanDetails = {
          loanId: loan.id,
          userId: loan.userId,
          userName: loan.userName,
          dueDate: loan.dueDate
        };
      } else if (resIndex < activeReservations.length) {
        status = 'En reserva';
        const res = activeReservations[resIndex++];
        reservationDetails = {
          reservationId: res.id,
          userId: res.userId,
          userName: res.userName
        };
      }

      copies.push({
        id: `${book.isbn}-${i}`,
        number: i,
        status,
        loanDetails,
        reservationDetails
      });
    }

    return copies;
  }

  updateExemplarStatus(isbn: string, copyNumber: number, newStatus: 'Disponible' | 'Perdido' | 'Dañado') {
    const error = this.state.updateCopyStatus(isbn, copyNumber, newStatus);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', `El ejemplar #${copyNumber} fue actualizado a ${newStatus.toLowerCase()}.`);
    }
  }

  getReservationsCount(isbn: string): number {
    return this.state.reservations().filter(
      (r) => r.bookIsbn === isbn && (r.status === 'En cola' || r.status === 'Listo para retirar')
    ).length;
  }

  openAddBookModal() {
    this.state.activeView.set('books');
  }

  openEditBookModal(book: Book) {
    this.state.activeView.set('books');
  }

  deleteBook(isbn: string) {
    this.state.deleteBook(isbn);
    this.toast.show('success', 'Libro removido de la biblioteca.');
  }
}

import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Book, BookCopy } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  bookSearchQuery = signal('');
  expandedBookIsbn = signal<string | null>(null);
  showEditBookModal = signal(false);
  editingBook = signal<Book | null>(null);
  showAddBookModal = signal(false);
  showDeleteModal = signal(false);
  deleteTarget = signal<Book | null>(null);
  deleteBlocked = signal(false);
  deleteBlockedReason = signal('');

  ngOnInit() {
    const pendingSearch = this.state.pendingSearch();
    if (pendingSearch) {
      this.bookSearchQuery.set(pendingSearch);
      this.state.pendingSearch.set('');
    }
  }

  bookForm = new FormGroup({
    isbn: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    title: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    author: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    editorial: new FormControl('', { nonNullable: true }),
    anioPublicacion: new FormControl<number | null>(null, { nonNullable: true }),
    copies: new FormControl<number>(1, { validators: [Validators.required, Validators.min(1)], nonNullable: true }),
    stockMinimo: new FormControl<number>(0, { validators: [Validators.required, Validators.min(0)], nonNullable: true }),
    coverUrl: new FormControl('', { nonNullable: true }),
  });

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
    return this.state.loans().filter(
      (l) => l.status === 'Activo' || l.status === 'Pendiente devolución'
    ).length;
  });

  getLoanedCopiesCount(isbn: string): number {
    return this.state.loans().filter(
      (l) => l.bookIsbn === isbn && (l.status === 'Activo' || l.status === 'Pendiente devolución')
    ).length;
  }

  async incrementCopies(book: Book) {
    const error = await this.state.addEjemplar(book.isbn);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', `Se agregó un ejemplar para "${book.title}".`);
    }
  }

  async decrementCopies(book: Book) {
    const error = await this.state.removeEjemplar(book.isbn);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', `Se retiró un ejemplar para "${book.title}".`);
    }
  }

  toggleBookExemplars(isbn: string) {
    if (this.expandedBookIsbn() === isbn) {
      this.expandedBookIsbn.set(null);
    } else {
      this.expandedBookIsbn.set(isbn);
    }
  }

  getBookCopies(book: Book): BookCopy[] {
    const ejemplares = book.ejemplares || [];
    if (ejemplares.length === 0) return [];

    const copies: BookCopy[] = [];
    const activeLoans = this.state.loans().filter(l => l.bookIsbn === book.isbn && (l.status === 'Activo' || l.status === 'Pendiente devolución'));
    const activeReservations = this.state.reservations().filter(
      r => r.bookIsbn === book.isbn && (r.status === 'Listo para retirar' || (r.status === 'En cola' && r.queuePosition === 1))
    );

    const loanedEjemplarIds = new Set<number>();
    for (const loan of activeLoans) {
      const ejId = parseInt(loan.id, 10);
      if (!isNaN(ejId)) loanedEjemplarIds.add(ejId);
    }

    const reservedEjemplarIds = new Set<number>();
    for (const res of activeReservations) {
      const ejId = parseInt(res.id, 10);
      if (!isNaN(ejId)) reservedEjemplarIds.add(ejId);
    }

    let loanIndex = 0;
    let resIndex = 0;

    for (const ej of ejemplares) {
      let status: BookCopy['status'] = 'Disponible';
      let loanDetails: BookCopy['loanDetails'] = undefined;
      let reservationDetails: BookCopy['reservationDetails'] = undefined;

      if (ej.estado === 'PERDIDO') {
        status = 'Perdido';
      } else if (ej.estado === 'DAÑADO') {
        status = 'Dañado';
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
        id: ej.codigo,
        ejemplarId: ej.id,
        number: ej.numero,
        codigo: ej.codigo,
        status,
        loanDetails,
        reservationDetails
      });
    }

    return copies;
  }

  async updateExemplarStatus(isbn: string, copyNumber: number, newStatus: 'Disponible' | 'Perdido' | 'Dañado') {
    const error = await this.state.updateCopyStatus(isbn, copyNumber, newStatus);
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
    this.bookForm.reset({
      isbn: '',
      title: '',
      author: '',
      editorial: '',
      anioPublicacion: null,
      copies: 1,
      stockMinimo: 0,
      coverUrl: '',
    });
    this.showAddBookModal.set(true);
  }

  saveNewBook() {
    if (this.bookForm.invalid) {
      this.toast.show('error', 'Por favor complete todos los datos requeridos.');
      return;
    }

    const raw = this.bookForm.getRawValue();
    const exists = this.state.books().some((b) => b.isbn === raw.isbn);
    if (exists) {
      this.toast.show('error', `Ya existe un libro con el ISBN ${raw.isbn}`);
      return;
    }

    const finalCover = raw.coverUrl ? raw.coverUrl : `https://picsum.photos/seed/${encodeURIComponent(raw.title)}/200/300`;

    this.state.addBook({
      isbn: raw.isbn,
      title: raw.title,
      author: raw.author,
      editorial: raw.editorial,
      anioPublicacion: raw.anioPublicacion,
      copies: raw.copies,
      stockMinimo: raw.stockMinimo,
      coverUrl: finalCover,
    });
    this.toast.show('success', 'Libro registrado exitosamente en el catálogo.');
    this.showAddBookModal.set(false);
  }

  openEditBookModal(book: Book) {
    this.editingBook.set(book);
    this.bookForm.setValue({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      editorial: book.editorial,
      anioPublicacion: book.anioPublicacion,
      copies: book.copies,
      stockMinimo: book.stockMinimo ?? 0,
      coverUrl: book.coverUrl,
    });
    this.showEditBookModal.set(true);
  }

  saveBook() {
    if (this.bookForm.invalid) {
      this.toast.show('error', 'Por favor complete todos los datos requeridos.');
      return;
    }

    const raw = this.bookForm.getRawValue();
    const editMode = this.editingBook();
    if (!editMode) return;

    if (raw.isbn !== editMode.isbn) {
      const isbnExists = this.state.books().some((b) => b.isbn === raw.isbn);
      if (isbnExists) {
        this.toast.show('error', `Ya existe otro libro con el ISBN ${raw.isbn}`);
        return;
      }
    }

    const finalCover = raw.coverUrl ? raw.coverUrl : `https://picsum.photos/seed/${encodeURIComponent(raw.title)}/200/300`;

    this.state.updateBook(editMode.isbn, {
      isbn: raw.isbn,
      title: raw.title,
      author: raw.author,
      editorial: raw.editorial,
      anioPublicacion: raw.anioPublicacion,
      copies: raw.copies,
      stockMinimo: raw.stockMinimo,
      coverUrl: finalCover,
    });
    this.toast.show('success', 'Libro actualizado correctamente.');
    this.showEditBookModal.set(false);
  }

  deleteBook(isbn: string) {
    const book = this.state.books().find((b) => b.isbn === isbn);
    if (!book) return;

    const loaned = this.getLoanedCopiesCount(isbn);
    const reserved = this.getReservationsCount(isbn);

    if (loaned > 0 || reserved > 0) {
      const parts: string[] = [];
      if (loaned > 0) parts.push(`${loaned} préstamo(s) activo(s)`);
      if (reserved > 0) parts.push(`${reserved} reserva(s) en cola`);
      this.deleteBlockedReason.set(parts.join(' y '));
      this.deleteBlocked.set(true);
    } else {
      this.deleteBlocked.set(false);
    }

    this.deleteTarget.set(book);
    this.showDeleteModal.set(true);
  }

  confirmDelete() {
    const book = this.deleteTarget();
    if (!book) return;
    this.state.deleteBook(book.isbn);
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
    this.toast.show('success', `Libro "${book.title}" removido de la biblioteca.`);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
  }
}

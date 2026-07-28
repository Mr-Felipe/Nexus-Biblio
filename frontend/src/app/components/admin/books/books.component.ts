import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Book } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './books.component.html',
  styleUrl: './books.component.css',
})
export class BooksComponent implements OnInit {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  bookSearchQuery = signal('');
  showAddBookModal = signal(false);
  editingBook = signal<Book | null>(null);
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

  filteredBooks = computed(() => {
    const q = this.bookSearchQuery().toLowerCase().trim();
    return this.state.books().filter((b) => {
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
    });
  });

  bookForm = new FormGroup({
    isbn: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    title: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    author: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    copies: new FormControl<number>(1, { validators: [Validators.required, Validators.min(1)], nonNullable: true }),
    stockMinimo: new FormControl<number>(0, { validators: [Validators.required, Validators.min(0)], nonNullable: true }),
    coverUrl: new FormControl('', { nonNullable: true }),
  });

  openAddBookModal() {
    this.editingBook.set(null);
    this.bookForm.reset({
      isbn: '',
      title: '',
      author: '',
      description: '',
      copies: 1,
      stockMinimo: 0,
      coverUrl: '',
    });
    this.bookForm.get('isbn')?.enable();
    this.showAddBookModal.set(true);
  }

  openEditBookModal(book: Book) {
    this.editingBook.set(book);
    this.bookForm.setValue({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      description: book.description,
      copies: book.copies,
      stockMinimo: book.stockMinimo ?? 0,
      coverUrl: book.coverUrl,
    });
    this.showAddBookModal.set(true);
  }

  saveBook() {
    if (this.bookForm.invalid) {
      this.toast.show('error', 'Por favor complete todos los datos requeridos.');
      return;
    }

    const raw = this.bookForm.getRawValue();
    const editMode = this.editingBook();

    const finalCover = raw.coverUrl ? raw.coverUrl : `https://picsum.photos/seed/${encodeURIComponent(raw.title)}/200/300`;

    if (editMode) {
      if (raw.isbn !== editMode.isbn) {
        const isbnExists = this.state.books().some((b) => b.isbn === raw.isbn);
        if (isbnExists) {
          this.toast.show('error', `Ya existe otro libro con el ISBN ${raw.isbn}`);
          return;
        }
      }
      this.state.updateBook(editMode.isbn, {
        isbn: raw.isbn,
        title: raw.title,
        author: raw.author,
        description: raw.description,
        copies: raw.copies,
        stockMinimo: raw.stockMinimo,
        coverUrl: finalCover,
      });
      this.toast.show('success', 'Libro actualizado correctamente.');
    } else {
      const exists = this.state.books().some((b) => b.isbn === raw.isbn);
      if (exists) {
        this.toast.show('error', `Ya existe un libro con el ISBN ${raw.isbn}`);
        return;
      }
      this.state.addBook({
        isbn: raw.isbn,
        title: raw.title,
        author: raw.author,
        description: raw.description,
        copies: raw.copies,
        stockMinimo: raw.stockMinimo,
        coverUrl: finalCover,
      });
      this.toast.show('success', 'Libro registrado exitosamente en el catálogo.');
    }
    this.showAddBookModal.set(false);
  }

  deleteBook(isbn: string) {
    const book = this.state.books().find((b) => b.isbn === isbn);
    if (!book) return;

    const activeLoans = this.state.loans().filter(
      (l) => l.bookIsbn === isbn && (l.status === 'Activo' || l.status === 'Pendiente devolución')
    ).length;
    const activeReservations = this.state.reservations().filter(
      (r) => r.bookIsbn === isbn && (r.status === 'En cola' || r.status === 'Listo para retirar')
    ).length;

    if (activeLoans > 0 || activeReservations > 0) {
      const parts: string[] = [];
      if (activeLoans > 0) parts.push(`${activeLoans} préstamo(s) activo(s)`);
      if (activeReservations > 0) parts.push(`${activeReservations} reserva(s) en cola`);
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

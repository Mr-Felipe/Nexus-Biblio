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

  ngOnInit() {
    const pending = this.state.pendingSearch();
    if (pending) {
      this.bookSearchQuery.set(pending);
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
      coverUrl: book.coverUrl,
    });
    this.bookForm.get('isbn')?.disable();
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
      this.state.updateBook(editMode.isbn, {
        title: raw.title,
        author: raw.author,
        description: raw.description,
        copies: raw.copies,
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
        coverUrl: finalCover,
      });
      this.toast.show('success', 'Libro registrado exitosamente en el catálogo.');
    }
    this.showAddBookModal.set(false);
  }

  deleteBook(isbn: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este libro del catálogo?')) {
      this.state.deleteBook(isbn);
      this.toast.show('success', 'Libro removido de la biblioteca.');
    }
  }
}

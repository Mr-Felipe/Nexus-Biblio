import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';
import { Book, Reservation } from '../../../models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css',
})
export class CatalogueComponent implements OnInit {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  catalogueSearchQuery = signal('');
  showLoginRequiredModal = signal(false);

  ngOnInit() {
    const pending = this.state.pendingSearch();
    if (pending) {
      this.catalogueSearchQuery.set(pending);
      this.state.pendingSearch.set('');
    }
  }

  filteredCatalogue = computed(() => {
    const q = this.catalogueSearchQuery().toLowerCase().trim();
    return this.state.books().filter((b) => {
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q) || b.editorial.toLowerCase().includes(q);
    });
  });

  getUserReservation(bookIsbn: string): Reservation | undefined {
    const current = this.state.currentUser();
    if (!current) return undefined;
    return this.state.reservations().find(
      (r) =>
        r.userId === current.id &&
        r.bookIsbn === bookIsbn &&
        (r.status === 'En cola' || r.status === 'Listo para retirar')
    );
  }

  async borrowBookDirectly(book: Book) {
    const current = this.state.currentUser();
    if (!current) {
      this.toast.show('error', 'Debe iniciar sesión para realizar un préstamo.');
      return;
    }
    const error = await this.state.createLoan(current.id, book.isbn);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', `¡Préstamo registrado con éxito! El libro "${book.title}" ha sido concedido.`);
    }
  }

  async claimReservedBook(res: Reservation) {
    const book = this.state.books().find((b) => b.isbn === res.bookIsbn);
    if (!book) {
      this.toast.show('error', 'Libro no encontrado.');
      return;
    }

    if (res.status === 'Listo para retirar') {
      this.state.updateBook(res.bookIsbn, { availableCopies: book.availableCopies + 1 });
    }

    const error = await this.state.createLoan(res.userId, res.bookIsbn);
    if (error) {
      if (res.status === 'Listo para retirar') {
        const currentBookState = this.state.books().find((b) => b.isbn === res.bookIsbn);
        if (currentBookState) {
          this.state.updateBook(res.bookIsbn, { availableCopies: Math.max(0, currentBookState.availableCopies - 1) });
        }
      }
      this.toast.show('error', `No se pudo procesar: ${error}`);
    } else {
      this.state.reservations.update((rs) =>
        rs.map((r) => (r.id === res.id ? { ...r, status: 'Retirada' as const } : r))
      );
      const updatedRes = this.state.reservations().find((r) => r.id === res.id);
      if (updatedRes) {
        this.state.syncToSupabase('reservas', updatedRes);
      }
      this.toast.show('success', `¡Has reclamado tu ejemplar! El préstamo de "${res.bookTitle}" ha sido formalizado.`);
      this.state.recalculateQueuePositions(res.bookIsbn);
    }
  }

  async requestReservation(book: Book) {
    const current = this.state.currentUser();
    if (!current) {
      this.toast.show('error', 'Debe iniciar sesión para reservar.');
      return;
    }

    const error = await this.state.createReservation(current.id, book.isbn);
    if (error) {
      this.toast.show('error', error);
    } else {
      const isQueue = book.availableCopies <= 0;
      this.toast.show(
        'success',
        isQueue
          ? `Agregado a la cola de reserva para "${book.title}".`
          : `¡Reserva lista para retirar! Pasa al mostrador por tu ejemplar.`
      );
    }
  }

  async cancelReservation(resId: string) {
    await this.state.cancelReservation(resId);
    this.toast.show('success', 'Reserva cancelada correctamente.');
  }
}

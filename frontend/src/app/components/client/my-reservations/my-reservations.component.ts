import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';
import { Reservation } from '../../../models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css',
})
export class MyReservationsComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  myActiveReservations = computed(() => {
    const cur = this.state.currentUser();
    if (!cur) return [];
    return this.state.reservations().filter((r) => r.userId === cur.id && (r.status === 'En cola' || r.status === 'Listo para retirar')).sort((a, b) => b.id.localeCompare(a.id));
  });

  myReservationsHistory = computed(() => {
    const cur = this.state.currentUser();
    if (!cur) return [];
    return this.state.reservations().filter((r) => r.userId === cur.id && r.status !== 'En cola' && r.status !== 'Listo para retirar').sort((a, b) => b.id.localeCompare(a.id));
  });

  async cancelReservation(resId: string) {
    await this.state.cancelReservation(resId);
    this.toast.show('success', 'Reserva cancelada correctamente.');
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
}

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Reservation } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  resSearchQuery = signal('');
  resStatusFilter = signal('ALL');

  filteredReservations = computed(() => {
    const q = this.resSearchQuery().toLowerCase().trim();
    const status = this.resStatusFilter();
    return this.state.reservations().filter((r) => {
      const matchQ = r.userName.toLowerCase().includes(q) || r.bookTitle.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchStatus = status === 'ALL' || r.status === status;
      return matchQ && matchStatus;
    });
  });

  cancelReservation(resId: string) {
    this.state.cancelReservation(resId);
    this.toast.show('success', 'Reserva cancelada correctamente.');
  }

  async deliverReservedBook(res: Reservation) {
    const error = await this.state.createLoan(res.userId, res.bookIsbn);
    if (error) {
      this.toast.show('error', `No se pudo procesar: ${error}`);
    } else {
      this.state.reservations.update((rs) =>
        rs.map((r) => (r.id === res.id ? { ...r, status: 'Retirada' as const } : r))
      );
      this.toast.show('success', `¡Préstamo formalizado! El libro ha sido entregado.`);
      this.state.recalculateQueuePositions(res.bookIsbn);
    }
  }
}

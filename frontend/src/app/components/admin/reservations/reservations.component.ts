import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Reservation, normalizeText } from '../../../library-state';
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
    const q = normalizeText(this.resSearchQuery().trim());
    const status = this.resStatusFilter();
    return this.state.reservations().filter((r) => {
      const matchQ = normalizeText(r.userName).includes(q) || normalizeText(r.bookTitle).includes(q) || normalizeText(r.id).includes(q);
      const matchStatus = status === 'ALL' || r.status === status;
      return matchQ && matchStatus;
    }).sort((a, b) => {
      const dateCmp = b.reservationDate.localeCompare(a.reservationDate);
      if (dateCmp !== 0) return dateCmp;
      const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });
  });

  async cancelReservation(resId: string) {
    await this.state.cancelReservation(resId);
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
      const updatedRes = this.state.reservations().find((r) => r.id === res.id);
      if (updatedRes) {
        this.state.syncToSupabase('reservas', updatedRes);
      }
      this.toast.show('success', `¡Préstamo formalizado! El libro ha sido entregado.`);
      this.state.recalculateQueuePositions(res.bookIsbn);
    }
  }
}

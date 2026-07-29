import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, normalizeText } from '../../../library-state';

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
}

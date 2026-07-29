import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, normalizeText } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.css',
})
export class LoansComponent {
  state = inject(LibraryState);
  private cdr = inject(ChangeDetectorRef);

  loanSearchQuery = signal('');
  loanStatusFilter = signal('ALL');

  filteredLoans = computed(() => {
    const q = normalizeText(this.loanSearchQuery().trim());
    const status = this.loanStatusFilter();
    return this.state.loans().filter((l) => {
      const matchQ = normalizeText(l.userName).includes(q) || normalizeText(l.bookTitle).includes(q) || normalizeText(l.id).includes(q) || normalizeText(l.userId).includes(q);
      const matchStatus = status === 'ALL' || l.status === status;
      return matchQ && matchStatus;
    }).sort((a, b) => {
      const dateCmp = b.loanDate.localeCompare(a.loanDate);
      if (dateCmp !== 0) return dateCmp;
      const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });
  });

  constructor() {
    setTimeout(() => this.cdr.markForCheck());
  }
}

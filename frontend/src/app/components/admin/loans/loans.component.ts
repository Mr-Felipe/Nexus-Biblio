import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Loan } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.css',
})
export class LoansComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  loanSearchQuery = signal('');
  loanStatusFilter = signal('ALL');
  showAddLoanModal = signal(false);

  filteredLoans = computed(() => {
    const q = this.loanSearchQuery().toLowerCase().trim();
    const status = this.loanStatusFilter();
    return this.state.loans().filter((l) => {
      const matchQ = l.userName.toLowerCase().includes(q) || l.bookTitle.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.userId.includes(q);
      const matchStatus = status === 'ALL' || l.status === status;
      return matchQ && matchStatus;
    });
  });

  constructor() {
    setTimeout(() => this.cdr.markForCheck());
  }

  loanForm = new FormGroup({
    userId: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    bookIsbn: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  openAddLoanModal() {
    this.loanForm.reset({
      userId: '',
      bookIsbn: '',
    });
    this.showAddLoanModal.set(true);
  }

  async saveLoan() {
    if (this.loanForm.invalid) {
      this.toast.show('error', 'Debe especificar el usuario y el libro.');
      return;
    }
    const { userId, bookIsbn } = this.loanForm.getRawValue();
    const error = await this.state.createLoan(userId, bookIsbn);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', 'Préstamo procesado correctamente. Plazo de 15 días concedido.');
      this.showAddLoanModal.set(false);
    }
  }

  async returnBook(loanId: string) {
    const error = await this.state.returnLoan(loanId);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', 'Devolución solicitada. El bibliotecario evaluará el estado del ejemplar.');
    }
  }
}

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
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

  loanSearchQuery = signal('');
  loanStatusFilter = signal('ALL');
  showAddLoanModal = signal(false);
  evaluatingLoan = signal<any | null>(null);
  showEvalReturnModal = signal(false);

  filteredLoans = computed(() => {
    const q = this.loanSearchQuery().toLowerCase().trim();
    const status = this.loanStatusFilter();
    return this.state.loans().filter((l) => {
      const matchQ = l.userName.toLowerCase().includes(q) || l.bookTitle.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.userId.includes(q);
      const matchStatus = status === 'ALL' || l.status === status;
      return matchQ && matchStatus;
    });
  });

  filteredPendingReturns = computed(() => {
    return this.state.pendingReturns();
  });

  loanForm = new FormGroup({
    userId: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    bookIsbn: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  evalReturnForm = new FormGroup({
    ejemplarEstado: new FormControl<'DISPONIBLE' | 'DAÑADO' | 'PERDIDO'>('DISPONIBLE', { validators: [Validators.required], nonNullable: true }),
    observaciones: new FormControl('', { nonNullable: true }),
    multa: new FormControl<number>(0, { validators: [Validators.min(0)], nonNullable: true }),
    tipoSancion: new FormControl<'DISCIPLINARIA' | 'ECONOMICA' | ''>('', { nonNullable: true }),
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

  returnBook(loanId: string) {
    const error = this.state.returnLoan(loanId);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', 'Devolución solicitada. El bibliotecario evaluará el estado del ejemplar.');
    }
  }

  openEvalReturnModal(loan: any) {
    this.evaluatingLoan.set(loan);
    this.evalReturnForm.patchValue({
      ejemplarEstado: 'DISPONIBLE',
      observaciones: '',
      multa: 0,
      tipoSancion: '',
    });
    this.showEvalReturnModal.set(true);
  }

  async submitEvalReturn() {
    const loan = this.evaluatingLoan();
    if (!loan) return;
    const form = this.evalReturnForm.getRawValue();
    const tipoSancion = form.tipoSancion || null;
    const error = await this.state.confirmReturn(
      loan.id,
      form.ejemplarEstado,
      form.observaciones || null,
      form.multa,
      tipoSancion as 'DISCIPLINARIA' | 'ECONOMICA' | null
    );
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', 'Devolución confirmada. Ejemplar evaluado correctamente.');
      this.showEvalReturnModal.set(false);
      this.evaluatingLoan.set(null);
    }
  }
}

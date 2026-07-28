import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, Loan } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.css',
})
export class ReturnsComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  evaluatingLoan = signal<any | null>(null);
  showEvalReturnModal = signal(false);
  evalEstado = signal<'DISPONIBLE' | 'DAÑADO' | 'PERDIDO'>('DISPONIBLE');

  filteredPendingReturns = computed(() => {
    return this.state.pendingReturns();
  });

  detectedSanctions = computed(() => {
    const loan = this.evaluatingLoan();
    if (!loan) return [];
    const sanctions: { type: string; reason: string; fine: number }[] = [];

    const dueDate = new Date(loan.dueDate);
    const returnDate = new Date();
    const diffDays = Math.floor((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 3) {
      sanctions.push({ type: 'DISCIPLINARIA', reason: `Retraso de ${diffDays} días en la devolución`, fine: 0 });
    }

    const estado = this.evalEstado();
    if (estado === 'DAÑADO') {
      sanctions.push({ type: 'ECONOMICA', reason: 'Ejemplar devuelto dañado', fine: 20000 });
    } else if (estado === 'PERDIDO') {
      sanctions.push({ type: 'ECONOMICA', reason: 'Ejemplar no devuelto (pérdida)', fine: 50000 });
    }

    return sanctions;
  });

  computedMulta = computed(() => {
    return this.detectedSanctions().reduce((sum, s) => sum + s.fine, 0);
  });

  computedTipoSancion = computed(() => {
    const types = this.detectedSanctions().map(s => s.type);
    if (types.includes('ECONOMICA')) return 'ECONOMICA';
    if (types.includes('DISCIPLINARIA')) return 'DISCIPLINARIA';
    return null;
  });

  evalReturnForm = new FormGroup({
    observaciones: new FormControl('', { nonNullable: true }),
  });

  openEvalReturnModal(loan: any) {
    this.evaluatingLoan.set(loan);
    this.evalEstado.set('DISPONIBLE');
    this.evalReturnForm.patchValue({
      observaciones: '',
    });
    this.showEvalReturnModal.set(true);
  }

  async submitEvalReturn() {
    const loan = this.evaluatingLoan();
    if (!loan) return;
    const estado = this.evalEstado();
    const observaciones = this.evalReturnForm.get('observaciones')?.value || null;
    const tipoSancion = this.computedTipoSancion();
    const multa = this.computedMulta();
    const error = await this.state.confirmReturn(
      loan.id,
      estado,
      observaciones,
      multa,
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

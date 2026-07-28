import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './my-loans.component.html',
  styleUrl: './my-loans.component.css',
})
export class MyLoansComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  private myLoans = computed(() => {
    const cur = this.state.currentUser();
    if (!cur) return [];
    return this.state.loans().filter((l) => l.userId === cur.id);
  });

  myActiveLoans = computed(() => {
    return this.myLoans().filter((l) => l.status === 'Activo' || l.status === 'Pendiente devolución' || l.status === 'Vencido');
  });

  myLoansHistory = computed(() => {
    return this.myLoans().filter((l) => l.status === 'Devuelto');
  });

  getDaysRemainingText(dueDateStr: string): { text: string; css: string; icon: string } {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Vencido hace ${Math.abs(diffDays)} días`,
        css: 'text-red-600 bg-red-50 border-red-100 font-bold',
        icon: 'warning',
      };
    } else if (diffDays === 0) {
      return {
        text: 'Vence HOY',
        css: 'text-amber-600 bg-amber-50 border-amber-100 font-bold animate-pulse',
        icon: 'error_outline',
      };
    } else if (diffDays <= 3) {
      return {
        text: `Vence en ${diffDays} días`,
        css: 'text-orange-600 bg-orange-50 border-orange-100 font-semibold',
        icon: 'hourglass_empty',
      };
    } else {
      return {
        text: `${diffDays} días restantes`,
        css: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        icon: 'schedule',
      };
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

import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState, normalizeText } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sanctions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './sanctions.component.html',
  styleUrl: './sanctions.component.css',
})
export class SanctionsComponent {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  sanctionSearchQuery = signal('');
  sanctionStatusFilter = signal('ALL');
  showAddSanctionModal = signal(false);

  filteredSanctions = computed(() => {
    const q = normalizeText(this.sanctionSearchQuery().trim());
    const status = this.sanctionStatusFilter();
    return this.state.sanctions().filter((s) => {
      const matchQ = normalizeText(s.userName).includes(q) || normalizeText(s.reason).includes(q) || normalizeText(s.id).includes(q);
      const matchStatus = status === 'ALL' || s.status === status;
      return matchQ && matchStatus;
    }).sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
      return numB - numA;
    });
  });

  sanctionForm = new FormGroup({
    userId: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    type: new FormControl<'Disciplinaria' | 'Económica' | 'Daño' | 'Pérdida'>('Disciplinaria', { validators: [Validators.required], nonNullable: true }),
    fine: new FormControl<number>(0, { validators: [Validators.min(0)], nonNullable: true }),
    reason: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  openAddSanctionModal() {
    this.sanctionForm.reset({
      userId: '',
      type: 'Disciplinaria',
      fine: 0,
      reason: '',
    });
    this.showAddSanctionModal.set(true);
  }

  saveSanction() {
    if (this.sanctionForm.invalid) {
      this.toast.show('error', 'Por favor rellene todos los campos.');
      return;
    }
    const { userId, type, fine, reason } = this.sanctionForm.getRawValue();
    const error = this.state.createSanction(userId, type, fine, reason);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', 'Sanción registrada correctamente.');
      this.showAddSanctionModal.set(false);
    }
  }

  paySanction(id: string) {
    const error = this.state.paySanction(id);
    if (error) {
      this.toast.show('error', error);
    } else {
      this.toast.show('success', 'Sanción levantada. El usuario puede realizar operaciones.');
    }
  }
}

import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-my-sanctions',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './my-sanctions.component.html',
  styleUrl: './my-sanctions.component.css',
})
export class MySanctionsComponent {
  state = inject(LibraryState);

  mySanctions = computed(() => {
    const cur = this.state.currentUser();
    if (!cur) return [];
    return this.state.sanctions().filter((s) => s.userId === cur.id).sort((a, b) => b.date.localeCompare(a.date));
  });
}

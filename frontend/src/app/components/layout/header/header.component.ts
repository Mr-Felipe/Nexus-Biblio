import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [CommonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  state = inject(LibraryState);
  @Input({ required: true }) mobileSidebarOpen!: ReturnType<typeof signal<boolean>>;
  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  @Output() openSupabaseModal = new EventEmitter<void>();
  showNotifications = signal(false);
  showProfile = signal(false);

  today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
}

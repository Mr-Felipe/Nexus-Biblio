import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar',
  imports: [CommonModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  state = inject(LibraryState);
  @Input({ required: true }) isOpen!: boolean;
  @Output() close = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
}

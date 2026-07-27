import { ChangeDetectionStrategy, Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  imports: [CommonModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  state = inject(LibraryState);
  @Output() navigate = new EventEmitter<string>();
}
